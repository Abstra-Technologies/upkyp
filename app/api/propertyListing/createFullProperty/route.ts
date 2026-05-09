import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";
import { encryptData } from "@/crypto/encrypt";
import { generatePropertyId } from "@/utils/id_generator";
import { getSessionUser } from "@/lib/auth/auth";

function sanitizeFilename(filename: string) {
    return filename
        .replace(/[^a-zA-Z0-9.]/g, "_")
        .replace(/\s+/g, "_");
}

export async function POST(req: NextRequest) {
    const session = await getSessionUser();

    if (!session || !session.landlord_id) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const landlordId = session.landlord_id;

    const formData = await req.formData();

    const propertyRaw = formData.get("property")?.toString();

    if (!propertyRaw) {
        return NextResponse.json(
            { error: "Missing required data" },
            { status: 400 }
        );
    }

    const property = JSON.parse(propertyRaw);
    const photos = formData.getAll("photos") as File[];

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        /* =====================================================
           1️⃣ Generate Unique Property ID
        ===================================================== */

        let propertyId = "";
        let unique = false;

        while (!unique) {
            const idCandidate = generatePropertyId();

            const [rows]: any = await connection.execute(
                `SELECT COUNT(*) AS count FROM Property WHERE property_id = ?`,
                [idCandidate]
            );

            if (rows[0].count === 0) {
                propertyId = idCandidate;
                unique = true;
            }
        }

        /* =====================================================
           2️⃣ Insert Property
        ===================================================== */

        await connection.execute(
            `
            INSERT INTO Property (
                property_id,
                landlord_id,
                property_name,
                property_type,
                property_subtype,
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
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
            `,
            [
                propertyId,
                landlordId,
                property.propertyName,
                property.propertyType,
                property.propertySubtype || "",
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
            const photoUploads = await Promise.all(
                photos.map(async (file) => {
                    const buffer = Buffer.from(await file.arrayBuffer());
                    const sanitizedFilename = sanitizeFilename(file.name);
                    const key = `${landlordId}/${propertyId}/${process.env.NEXT_PUBLIC_S3_PROPHOTOS}/${Date.now()}_${sanitizedFilename}`;
                    const s3Url = await uploadToS3(buffer, key, file.type);
                    return JSON.stringify(encryptData(s3Url, process.env.ENCRYPTION_SECRET!));
                })
            );

            await Promise.all(
                photoUploads.map((url) =>
                    connection.execute(
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

        await connection.commit();

        return NextResponse.json(
            {
                success: true,
                message: "Property created successfully",
                propertyId,
            },
            { status: 201 }
        );

    } catch (err: any) {
        await connection.rollback();
        console.error("Property creation failed:", err);

        return NextResponse.json(
            {
                error: "Failed to create property",
                details: err?.message,
            },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
