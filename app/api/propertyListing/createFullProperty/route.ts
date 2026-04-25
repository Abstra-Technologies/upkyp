import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { encryptData } from "@/crypto/encrypt";
import { generatePropertyId } from "@/utils/id_generator";

const s3Client = new S3Client({
    region: process.env.NEXT_AWS_REGION!,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

/* =====================================================
   UTILS
===================================================== */

function sanitizeFilename(filename: string) {
    return filename
        .replace(/[^a-zA-Z0-9.]/g, "_")
        .replace(/\s+/g, "_");
}

async function uploadToS3(file: File, folder: string) {
    const buffer = Buffer.from(await file.arrayBuffer());

    const sanitizedFilename = sanitizeFilename(
        file.name ?? "upload"
    );

    const key = `${folder}/${Date.now()}_${sanitizedFilename}`;

    await s3Client.send(
        new PutObjectCommand({
            Bucket: process.env.NEXT_S3_BUCKET_NAME!,
            Key: key,
            Body: buffer,
            ContentType:
                file.type ?? "application/octet-stream",
        })
    );

    const url = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${key}`;

    return JSON.stringify(encryptData(url, encryptionSecret));
}

/* =====================================================
   POST – CREATE PROPERTY (SIMPLIFIED)
===================================================== */

export async function POST(req: NextRequest) {
    const formData = await req.formData();

    const landlord_id =
        formData.get("landlord_id")?.toString();

    const propertyRaw =
        formData.get("property")?.toString();

    if (!landlord_id || !propertyRaw) {
        return NextResponse.json(
            { error: "Missing required data" },
            { status: 400 }
        );
    }

    const property = JSON.parse(propertyRaw);
    const photos = formData.getAll("photos") as File[];

    try {
        /* =====================================================
           1️⃣ Generate Unique Property ID
        ===================================================== */

        let propertyId = "";
        let unique = false;

        while (!unique) {
            const idCandidate = generatePropertyId();

            const [rows]: any = await db.execute(
                `SELECT COUNT(*) AS count FROM Property WHERE property_id = ?`,
                [idCandidate]
            );

            if (rows[0].count === 0) {
                propertyId = idCandidate;
                unique = true;
            }
        }

        /* =====================================================
           2️⃣ Insert Property (Nullable Safe)
        ===================================================== */

        await db.execute(
            `
      INSERT INTO Property (
        property_id,
        landlord_id,
        property_name,
        property_type,
        amenities,
        street,
        brgy_district,
        city,
        zip_code,
        province,
        water_billing_type,
        electricity_billing_type,
        description,
        floor_area,
        latitude,
        longitude,
        rent_increase_percent,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
      `,
            [
                propertyId,
                landlord_id,
                property.propertyName,
                property.propertyType,
                property.amenities?.join(",") || null,
                property.street || null,
                property.brgyDistrict || null,
                property.city || null,
                property.zipCode || null,
                property.province || null,
                property.waterBillingType || null,
                property.electricityBillingType || null,
                property.propDesc ?? null,
                property.floorArea ?? null,
                property.latitude ?? null,
                property.longitude ?? null,
                property.rentIncreasePercent ?? 0.0,
            ]
        );

        /* =====================================================
           3️⃣ Upload Photos (Parallel)
        ===================================================== */

        if (photos?.length > 0) {
            const uploadedPhotos = await Promise.all(
                photos.map((file) =>
                    uploadToS3(file, "property-photo")
                )
            );

            await Promise.all(
                uploadedPhotos.map((url) =>
                    db.execute(
                        `
            INSERT INTO PropertyPhoto
            (property_id, photo_url, created_at, updated_at)
            VALUES (?, ?, NOW(), NOW())
            `,
                        [propertyId, url]
                    )
                )
            );
        }

        /* =====================================================
           SUCCESS
        ===================================================== */

        return NextResponse.json(
            {
                success: true,
                message: "Property created successfully",
                propertyId,
            },
            { status: 201 }
        );

    } catch (err: any) {
        console.error("Property creation failed:", err);

        return NextResponse.json(
            {
                error: "Failed to create property",
                details: err?.message,
            },
            { status: 500 }
        );
    }
}