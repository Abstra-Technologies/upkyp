import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { encryptData } from "@/crypto/encrypt";
import { generateUnitId } from "@/utils/id_generator";

const s3Client = new S3Client({
    region: process.env.NEXT_AWS_REGION!,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

function sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

export async function POST(req: Request) {
    const formData = await req.formData();

    const property_id = formData.get("property_id") as string;
    const unitName = formData.get("unit_name") as string;
    const unitSize = formData.get("unit_size") as string;
    const rentAmt = formData.get("rent_amount") as string;
    const furnish = formData.get("furnish") as string;
    const amenities = formData.get("amenities") as string;
    const status = (formData.get("status") as string) || "unoccupied";
    const unitType = formData.get("unitType") as string;

    console.log('property id:')


    // Extract 360 photo directly
    const photo360 = formData.get("photo360") as File | null;

    if (!property_id || !unitName || !rentAmt) {
        return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
        );
    }

    const files: File[] = [];
    for (const entry of formData.entries()) {
        if ((entry[0] === "photos" || entry[0] === "photo") && entry[1] instanceof File) {
            files.push(entry[1]);
        }
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Step 0: Generate unique unit_id
        let unit_id = generateUnitId();
        let isUnique = false;

        while (!isUnique) {
            const [rows]: any = await connection.query(
                "SELECT unit_id FROM Unit WHERE unit_id = ? LIMIT 1",
                [unit_id]
            );
            if (rows.length === 0) {
                isUnique = true;
            } else {
                unit_id = generateUnitId();
            }
        }

        // Step 1: Insert Unit
        await connection.execute(
            `INSERT INTO Unit
            (unit_id, property_id, unit_name, unit_size, rent_amount, furnish, amenities, status, unit_style)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                unit_id,
                property_id,
                unitName,
                unitSize || null,
                rentAmt,
                furnish,
                amenities || "",
                'unoccupied',
                unitType,
            ]
        );

        // Step 2: Upload normal photos
        if (files.length > 0) {
            const uploadedFilesData = await Promise.all(
                files.map(async (file) => {
                    const arrayBuffer = await file.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const sanitizedFilename = sanitizeFilename(file.name);
                    const fileName = `unitPhoto/${Date.now()}_${sanitizedFilename}`;
                    const photoUrl = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${fileName}`;

                    const encryptedUrl = JSON.stringify(
                        encryptData(photoUrl, encryptionSecret)
                    );

                    await s3Client.send(
                        new PutObjectCommand({
                            Bucket: process.env.NEXT_S3_BUCKET_NAME!,
                            Key: fileName,
                            Body: buffer,
                            ContentType: file.type,
                        })
                    );

                    return [unit_id, encryptedUrl, new Date(), new Date()];
                })
            );

            await connection.query(
                `INSERT INTO UnitPhoto (unit_id, photo_url, created_at, updated_at) VALUES ?`,
                [uploadedFilesData]
            );
        }

        // Step 3: Save 360° photo (if exists)
        if (photo360) {
            const arrayBuffer = await photo360.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const sanitizedFilename = sanitizeFilename(photo360.name);
            const fileName = `unit360/${Date.now()}_${sanitizedFilename}`;

            const photoUrl360 = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${fileName}`;

            const encryptedUrl360 = JSON.stringify(
                encryptData(photoUrl360, encryptionSecret)
            );

            await s3Client.send(
                new PutObjectCommand({
                    Bucket: process.env.NEXT_S3_BUCKET_NAME!,
                    Key: fileName,
                    Body: buffer,
                    ContentType: photo360.type,
                })
            );

            // Insert into Unit360 table
            await connection.execute(
                `INSERT INTO Unit360 (unit_id, photo360_url, created_at, updated_at)
                 VALUES (?, ?, NOW(), NOW())`,
                [unit_id, encryptedUrl360]
            );
        }

        await connection.commit();

        return NextResponse.json(
            {
                message: "Unit, photos, and 360° image uploaded successfully",
                unitId: unit_id,
            },
            { status: 201 }
        );
    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error("Error creating unit:", error);
        return NextResponse.json(
            { error: "Failed to create unit: " + error.message },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
