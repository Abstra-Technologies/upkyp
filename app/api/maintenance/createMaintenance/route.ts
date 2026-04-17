import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateMaintenanceId } from "@/utils/id_generator";
import { encryptData } from "@/crypto/encrypt";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import webpush from "web-push";

const s3Client = new S3Client({
    region: process.env.NEXT_AWS_REGION,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

webpush.setVapidDetails(
    "mailto:support@upkyp.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

function sanitizeFilename(filename: string) {
    return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

export async function POST(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        const contentType = req.headers.get("content-type") || "";
        if (!contentType.includes("multipart/form-data")) {
            return NextResponse.json(
                { error: "Invalid Content-Type. Use multipart/form-data" },
                { status: 400 }
            );
        }

        const formData = await req.formData();
        console.log('fpr, daya', formData);
        const agreement_id = formData.get("agreement_id")?.toString();
        const description = formData.get("description")?.toString();
        const category = formData.get("category")?.toString();
        const asset_id = formData.get("asset_id")?.toString() || null;
        const is_emergency = formData.get("is_emergency") === "1" ? 1 : 0;

        console.log('asset id', asset_id);

        if (!agreement_id || !category || !description) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const files: File[] = [];
        for (const [, value] of formData.entries()) {
            if (value instanceof File) files.push(value);
        }

        await connection.beginTransaction();

        // --- Get active lease ---
        const [agreementRows]: any = await connection.execute(
            `
      SELECT la.tenant_id, la.unit_id, u.property_id
      FROM LeaseAgreement la
      JOIN Unit u ON la.unit_id = u.unit_id
      WHERE la.agreement_id = ? AND la.status = 'active'
    `,
            [agreement_id]
        );

        if (!agreementRows.length) {
            await connection.rollback();
            return NextResponse.json(
                { error: "No active lease found for this agreement" },
                { status: 404 }
            );
        }

        const { tenant_id, unit_id, property_id } = agreementRows[0];

        // --- Get landlord user_id ---
        const [landlordRows]: any = await connection.execute(
            `
      SELECT l.landlord_id, l.user_id AS landlord_user_id
      FROM Landlord l
      WHERE l.landlord_id = (
        SELECT landlord_id FROM Property WHERE property_id = ?
      )
    `,
            [property_id]
        );

        if (!landlordRows.length) {
            await connection.rollback();
            return NextResponse.json(
                { error: "Landlord not found for property" },
                { status: 404 }
            );
        }

        const { landlord_user_id } = landlordRows[0];

        // --- Generate request_id and set priority ---
        const request_id = generateMaintenanceId();

        // If the request is tied to an asset that’s under maintenance → force HIGH priority
        let priority_level = is_emergency ? "HIGH" : "LOW";
        if (asset_id) {
            const [assetStatus]: any = await connection.execute(
                `SELECT status FROM Asset WHERE asset_id = ?`,
                [asset_id]
            );
            if (
                assetStatus?.length > 0 &&
                assetStatus[0].status === "under_maintenance"
            ) {
                priority_level = "HIGH";
            }
        }

        // --- Prevent duplicate request_id ---
        const [exists]: any = await connection.execute(
            `SELECT request_id FROM MaintenanceRequest WHERE request_id = ?`,
            [request_id]
        );
        if (exists.length > 0) {
            await connection.rollback();
            return NextResponse.json(
                { error: "Duplicate request_id detected" },
                { status: 409 }
            );
        }

        // --- Insert Maintenance Request ---
        await connection.execute(
            `
      INSERT INTO MaintenanceRequest 
      (request_id, tenant_id, unit_id, asset_id, subject, description, category, status, priority_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
    `,
            [
                request_id,
                tenant_id,
                unit_id,
                asset_id,
                category,
                description,
                category,
                priority_level,
            ]
        );

        // --- Upload photos ---
        if (files.length > 0) {
            const uploads: any[] = [];
            for (const file of files) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const safeName = sanitizeFilename(file.name);
                const key = `maintenancePhoto/${request_id}/${Date.now()}_${safeName}`;
                const photoUrl = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${key}`;
                const encryptedUrl = JSON.stringify(
                    encryptData(photoUrl, encryptionSecret)
                );

                await s3Client.send(
                    new PutObjectCommand({
                        Bucket: process.env.NEXT_S3_BUCKET_NAME!,
                        Key: key,
                        Body: buffer,
                        ContentType: file.type,
                    })
                );

                uploads.push([request_id, encryptedUrl, new Date(), new Date()]);
            }

            await connection.query(
                `INSERT INTO MaintenancePhoto (request_id, photo_url, created_at, updated_at) VALUES ?`,
                [uploads]
            );
        }

        // --- Activity Log ---
        const [tenantUser]: any = await connection.execute(
            `SELECT user_id FROM Tenant WHERE tenant_id = ?`,
            [tenant_id]
        );
        const tenant_user_id = tenantUser?.[0]?.user_id || null;

        if (tenant_user_id) {
            await connection.execute(
                `INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, NOW())`,
                [
                    tenant_user_id,
                    `Created Maintenance Request (${category}) - ${description}`,
                ]
            );
        }

        // --- Notifications ---
        const [propertyUnit]: any = await connection.execute(
            `
      SELECT p.property_name, u.unit_name
      FROM Unit u
      JOIN Property p ON u.property_id = p.property_id
      WHERE u.unit_id = ?
    `,
            [unit_id]
        );

        const property_name = propertyUnit?.[0]?.property_name || "Unknown Property";
        const unit_name = propertyUnit?.[0]?.unit_name || "Unknown Unit";

        const title = is_emergency
            ? `🚨 Urgent Maintenance Request (${category})`
            : `🧰 Maintenance Request (${category})`;
        const body = is_emergency
            ? `An urgent maintenance issue was reported for ${unit_name} at ${property_name}.`
            : `A new maintenance request was created for ${unit_name} at ${property_name}.`;
        const url = `/landlord/maintenance-request?id=${request_id}`;

        await connection.execute(
            `INSERT INTO Notification (user_id, title, body, url, is_read, created_at)
       VALUES (?, ?, ?, ?, 0, NOW())`,
            [landlord_user_id, title, body, url]
        );

        // --- Web Push Notification ---
        const [subs]: any = await connection.execute(
            `SELECT endpoint, p256dh, auth FROM user_push_subscriptions WHERE user_id = ?`,
            [landlord_user_id]
        );

        if (subs.length > 0) {
            const payload = JSON.stringify({
                title,
                body,
                icon: "/icons/maintenance.png",
                data: { url },
            });

            for (const sub of subs) {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: { p256dh: sub.p256dh, auth: sub.auth },
                        },
                        payload
                    );
                } catch (err: any) {
                    console.warn("⚠️ Web Push failed:", err.message);

                    if (err.statusCode === 404 || err.statusCode === 410) {
                        await connection.execute(
                            `DELETE FROM user_push_subscriptions WHERE endpoint = ?`,
                            [sub.endpoint]
                        );
                        console.log(`🧹 Removed invalid push subscription: ${sub.endpoint}`);
                    }
                }
            }
        }

        await connection.commit();

        return NextResponse.json(
            {
                success: true,
                message: "Maintenance request created successfully",
                request_id,
                priority_level,
            },
            { status: 201 }
        );
    } catch (err: any) {
        console.error("❌ Maintenance creation error:", err);
        await connection.rollback();
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        connection.release?.();
    }
}
