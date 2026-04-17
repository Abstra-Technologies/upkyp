export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { encryptData } from "@/crypto/encrypt";
import { fcm } from "@/lib/firebase-admin";
import sanitizeHtml from "sanitize-html";
import { sendUserNotification } from "@/lib/notifications/sendUserNotification";

const s3Client = new S3Client({
    region: process.env.NEXT_AWS_REGION,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

function sanitizeFilename(filename: string) {
    return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const property_ids = formData.getAll("property_ids[]").map(String);
        const subject = (formData.get("subject") as string)?.trim();
        let description = (formData.get("description") as string)?.trim();
        const landlord_id = String(formData.get("landlord_id"));

        if (!property_ids.length || !subject || !description || !landlord_id) {
            return NextResponse.json({ message: "All fields are required" }, { status: 400 });
        }

        // Sanitize HTML from rich text editor
        description = sanitizeHtml(description, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "u"]),
            allowedAttributes: {
                ...sanitizeHtml.defaults.allowedAttributes,
                img: ["src", "alt", "width", "height"],
            },
        });

        // Validate properties
        const [existingProps]: any = await db.execute(
            `SELECT property_id FROM Property WHERE property_id IN (${property_ids.map(() => "?").join(",")})`,
            property_ids
        );
        const existingIds = existingProps.map((p: any) => p.property_id);
        const invalidIds = property_ids.filter(id => !existingIds.includes(id));
        if (invalidIds.length > 0) {
            return NextResponse.json(
                { message: `Invalid property IDs: ${invalidIds.join(", ")}` },
                { status: 400 }
            );
        }

        // Get landlord → user_id
        const [landlordRows] = await db.execute(
            `SELECT user_id FROM Landlord WHERE landlord_id = ?`,
            [landlord_id]
        );
        const landlord = (landlordRows as any[])[0];
        if (!landlord) return NextResponse.json({ message: "Landlord not found" }, { status: 404 });
        const user_id = landlord.user_id;

        // Collect uploaded files
        const files: File[] = [];
        for (const [, value] of formData.entries()) {
            if (value instanceof File) files.push(value);
        }

        const createdAnnouncements: any[] = [];
        const maxBodyLength = 300;
        const plainText = description.replace(/<[^>]+>/g, "");
        const truncatedDescription =
            plainText.length > maxBodyLength ? plainText.slice(0, maxBodyLength) + "..." : plainText;

        // Process each property
        for (const property_id of property_ids) {
            const [result]: any = await db.execute(
                `INSERT INTO Announcement 
         (property_id, landlord_id, subject, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
                [property_id, landlord_id, subject, description]
            );
            const announcement_id = result.insertId;
            const photoRecords: string[] = [];

            // Upload photos to S3
            for (const file of files) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const sanitizedFilename = sanitizeFilename(file.name);
                const fileName = `announcementPhoto/${Date.now()}_${sanitizedFilename}`;
                const photoUrl = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${fileName}`;
                const encryptedUrl = JSON.stringify(encryptData(photoUrl, encryptionSecret));

                await s3Client.send(
                    new PutObjectCommand({
                        Bucket: process.env.NEXT_S3_BUCKET_NAME!,
                        Key: fileName,
                        Body: buffer,
                        ContentType: file.type,
                    })
                );

                await db.execute(
                    `INSERT INTO AnnouncementPhoto (announcement_id, photo_url, created_at)
           VALUES (?, ?, NOW())`,
                    [announcement_id, encryptedUrl]
                );
                photoRecords.push(photoUrl);
            }

            // Notify tenants
            const [tenants]: any = await db.execute(
                `SELECT DISTINCT t.user_id
         FROM LeaseAgreement la
         JOIN Tenant t ON la.tenant_id = t.tenant_id
         JOIN Unit u ON la.unit_id = u.unit_id
         WHERE u.property_id = ? AND la.status = 'active'`,
                [property_id]
            );

            for (const tenant of tenants) {
                await sendUserNotification({
                    userId: tenant.user_id,
                    title: subject,
                    body: truncatedDescription,
                    url: "/tenant/feeds",
                });

                // Android FCM
                const [androidTokens]: any = await db.execute(
                    `SELECT token FROM FCM_Token WHERE user_id = ? AND platform = 'android' AND active = 1`,
                    [tenant.user_id]
                );
                if (androidTokens.length > 0) {
                    for (const row of androidTokens) {
                        try {
                            await fcm.send({
                                token: row.token,
                                notification: { title: subject, body: truncatedDescription },
                                data: { url: "/tenant/feeds" },
                            });
                        } catch (err: any) {
                            if (err.errorInfo?.code === "messaging/registration-token-not-registered") {
                                await db.execute(`DELETE FROM FCM_Token WHERE token = ?`, [row.token]);
                            }
                        }
                    }
                }
            }

            createdAnnouncements.push({ announcement_id, property_id, subject, files: photoRecords });
        }

        return NextResponse.json({ message: "Announcements created + notifications sent." }, { status: 201 });
    } catch (error: any) {
        console.error("❌ Error creating announcement:", error);
        return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
    }
}
