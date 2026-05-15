import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/s3";
import { encryptData } from "@/crypto/encrypt";
import { generateUnitId } from "@/utils/id_generator";
import { getSessionUser } from "@/lib/auth/auth";
import { revalidateTag } from "next/cache";

function sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

export async function POST(req: Request) {
    const session = await getSessionUser();

    if (!session || !session.landlord_id) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const landlordId = session.landlord_id;

    const formData = await req.formData();

    const property_id = formData.get("property_id") as string;
    const unitName = formData.get("unit_name") as string;
    const unitSize = formData.get("unit_size") as string;
    const rentAmt = formData.get("rent_amount") as string;
    const furnish = formData.get("furnish") as string;
    const amenities = formData.get("amenities") as string;
    const unitType = formData.get("unitType") as string;

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

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

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

        if (files.length > 0) {
            const uploadedFilesData = await Promise.all(
                files.map(async (file) => {
                    const buffer = Buffer.from(await file.arrayBuffer());
                    const sanitizedFilename = sanitizeFilename(file.name);
                    const key = `${landlordId}/${property_id}/${process.env.NEXT_AWS_UNIT_PHOTOS}/${unit_id}/${Date.now()}_${sanitizedFilename}`;
                    const s3Url = await uploadToS3(buffer, key, file.type);
                    const encryptedUrl = JSON.stringify(encryptData(s3Url, process.env.ENCRYPTION_SECRET!));

                    return [unit_id, encryptedUrl, new Date(), new Date()];
                })
            );

            await connection.query(
                `INSERT INTO UnitPhoto (unit_id, photo_url, created_at, updated_at) VALUES ?`,
                [uploadedFilesData]
            );
        }


        await connection.commit();

        revalidateTag(`units-${property_id}`);
        revalidateTag("units-all");

        return NextResponse.json(
            {
                message: "Unit, photos, and 360° image uploaded successfully",
                unitId: unit_id,
            },
            { status: 201 }
        );
    } catch (error: any) {
        await connection.rollback();
        console.error("Error creating unit:", error);
        return NextResponse.json(
            { error: "Failed to create unit: " + error.message },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
