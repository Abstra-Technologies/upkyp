import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { encryptData } from "@/crypto/encrypt";
import { getSessionUser } from "@/lib/auth/auth";

/* =========================
   AWS S3 CLIENT
========================= */
const s3Client = new S3Client({
    region: process.env.NEXT_AWS_REGION!,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

/* =========================
   HELPERS
========================= */
function sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

/* =========================
   PUT — UPDATE PROPERTY
========================= */
export async function PUT(req: NextRequest) {
    const property_id = req.nextUrl.searchParams.get("property_id");
    const formData = await req.formData();

    if (!property_id) {
        return NextResponse.json(
            { error: "Missing property_id" },
            { status: 400 }
        );
    }

    const sessionUser = await getSessionUser();

    if (!sessionUser || !sessionUser.landlord_id) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        /* =========================
           1️⃣ Verify Ownership
        ========================= */
        const [rows]: any = await connection.query(
            "SELECT property_id, landlord_id FROM Property WHERE property_id = ? LIMIT 1",
            [property_id]
        );

        if (!rows.length) {
            return NextResponse.json(
                { error: "Property not found" },
                { status: 404 }
            );
        }

        if (rows[0].landlord_id !== sessionUser.landlord_id) {
            return NextResponse.json(
                { error: "Forbidden - you do not own this property" },
                { status: 403 }
            );
        }

        /* =========================
           2️⃣ Parse Property Data
        ========================= */
        const raw = formData.get("data")?.toString() || "{}";
        const body = JSON.parse(raw);

        const fields = {
            property_name: body.propertyName,
            property_type: body.propertyType,
            amenities: Array.isArray(body.amenities)
                ? body.amenities.join(",")
                : body.amenities || null,
            street: body.street ?? null,
            brgy_district: body.brgyDistrict ?? null,
            city: body.city ?? null,
            zip_code: body.zipCode ?? null,
            province: body.province ?? null,
            water_billing_type: body.water_billing_type ?? null,
            electricity_billing_type: body.electricity_billing_type ?? null,
            description: body.description ?? null,
            floor_area: body.floorArea ?? null,
            flexipay_enabled: body.flexiPayEnabled ?? 0,
            property_preferences: body.propertyPreferences
                ? JSON.stringify(body.propertyPreferences)
                : null,
            accepted_payment_methods: body.paymentMethodsAccepted
                ? JSON.stringify(body.paymentMethodsAccepted)
                : null,
            latitude: body.lat ?? null,
            longitude: body.lng ?? null,
        };

        /* =========================
           3️⃣ Update Property
        ========================= */
        await connection.query(
            `
      UPDATE Property SET
        property_name=?, property_type=?, amenities=?, street=?, brgy_district=?, city=?, zip_code=?, province=?,
        water_billing_type=?, electricity_billing_type=?, description=?, floor_area=?,
        flexipay_enabled=?, property_preferences=?, accepted_payment_methods=?,
        latitude=?, longitude=?, updated_at=CURRENT_TIMESTAMP
      WHERE property_id=?
      `,
            [
                fields.property_name,
                fields.property_type,
                fields.amenities,
                fields.street,
                fields.brgy_district,
                fields.city,
                fields.zip_code,
                fields.province,
                fields.water_billing_type,
                fields.electricity_billing_type,
                fields.description,
                fields.floor_area,
                fields.flexipay_enabled,
                fields.property_preferences,
                fields.accepted_payment_methods,
                fields.latitude,
                fields.longitude,
                property_id,
            ]
        );

        /* =========================
           4️⃣ Upload NEW Photos
        ========================= */
        const files = formData.getAll("files");
        const uploadedPhotos: any[] = [];

        const folder = process.env.NEXT_PUBLIC_S3_PROPHOTOS;
        if (!folder) {
            throw new Error("Missing NEXT_PUBLIC_S3_PROPHOTOS env variable");
        }

        for (const file of files) {
            if (!(file instanceof File)) continue;

            const buffer = Buffer.from(await file.arrayBuffer());
            const cleanName = sanitizeFilename(file.name);

            const key = `${folder}/${Date.now()}_${cleanName}`;

            const publicUrl = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${key}`;

            const encryptedUrl = JSON.stringify(
                encryptData(publicUrl, encryptionSecret)
            );

            await s3Client.send(
                new PutObjectCommand({
                    Bucket: process.env.NEXT_S3_BUCKET_NAME!,
                    Key: key,
                    Body: buffer,
                    ContentType: file.type,
                    CacheControl: "public, max-age=31536000",
                })
            );

            uploadedPhotos.push([property_id, encryptedUrl, new Date(), new Date()]);
        }

        if (uploadedPhotos.length) {
            await connection.query(
                `
        INSERT INTO PropertyPhoto (property_id, photo_url, created_at, updated_at)
        VALUES ?
        `,
                [uploadedPhotos]
            );
        }

        /* =========================
           5️⃣ Activity Log
        ========================= */
        await connection.query(
            "INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, NOW())",
            [sessionUser.user_id, `Edited Property: ${fields.property_name}`]
        );

        await connection.commit();

        /* =========================
           6️⃣ Invalidate Cache
        ========================= */
        const cacheKey = `properties:landlord:${sessionUser.landlord_id}`;
        await redis.del(cacheKey);

        /* =========================
           ✅ RESPONSE
        ========================= */
        return NextResponse.json({
            success: true,
            uploadedPhotos: uploadedPhotos.map((p) => ({
                property_id: p[0],
                photo_url: p[1],
            })),
        });
    } catch (err: any) {
        await connection.rollback();
        console.error("❌ UPDATE PROPERTY ERROR:", err);

        return NextResponse.json(
            { error: err.message || "Failed to update property." },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
