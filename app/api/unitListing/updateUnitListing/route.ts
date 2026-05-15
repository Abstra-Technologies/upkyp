import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/s3";
import { encryptData } from "@/crypto/encrypt";
import { getSessionUser } from "@/lib/auth/auth";
import { revalidateTag } from "next/cache";

function sanitizeFilename(filename: string): string {
    return filename
        .normalize("NFD")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
}

export async function PUT(req: Request) {
    const session = await getSessionUser();

    if (!session || !session.landlord_id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const landlordId = session.landlord_id;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Missing unit ID" }, { status: 400 });
    }

    const connection = await db.getConnection();

    try {
        const formData = await req.formData();

        const unitName = formData.get("unitName")?.toString() ?? null;
        const unitSize = Number(formData.get("unitSize")) || null;
        const rentAmt = Number(formData.get("rentAmt")) || null;
        const furnish = formData.get("furnish")?.toString() ?? null;
        const unitType = formData.get("unitType")?.toString() ?? null;
        const amenities = formData.get("amenities")?.toString() ?? "";

        const uploadedFiles = formData.getAll("files") as File[];

        if (!unitName || !unitSize || !rentAmt) {
            return NextResponse.json(
                { error: "Required fields missing" },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        const [existingRows]: any = await connection.execute(
            `SELECT unit_id, property_id FROM Unit WHERE unit_id = ?`,
            [id]
        );

        if (existingRows.length === 0) {
            await connection.rollback();
            return NextResponse.json({ error: "Unit not found" }, { status: 404 });
        }

        const property_id = existingRows[0].property_id;

        await connection.execute(
            `UPDATE Unit 
             SET unit_name = ?, 
                 unit_size = ?, 
                 rent_amount = ?, 
                 furnish = ?, 
                 unit_style = ?, 
                 amenities = ?, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE unit_id = ?`,
            [unitName, unitSize, rentAmt, furnish, unitType, amenities, id]
        );

        if (uploadedFiles && uploadedFiles.length > 0) {
            const photoRecords: any[] = [];

            for (const file of uploadedFiles) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const sanitized = sanitizeFilename(file.name || "unit-photo.jpg");
                const key = `${landlordId}/${property_id}/${process.env.NEXT_AWS_UNIT_PHOTOS}/${id}/${Date.now()}_${sanitized}`;

                const s3Url = await uploadToS3(buffer, key, file.type || "image/jpeg");
                const encryptedUrl = JSON.stringify(encryptData(s3Url, process.env.ENCRYPTION_SECRET!));

                photoRecords.push([id, encryptedUrl, new Date(), new Date()]);
            }

            if (photoRecords.length > 0) {
                await connection.query(
                    `INSERT INTO UnitPhoto (unit_id, photo_url, created_at, updated_at)
                     VALUES ?`,
                    [photoRecords]
                );
            }
        }

        await connection.commit();

        revalidateTag(`units-${property_id}`);
        revalidateTag("units-all");

        return NextResponse.json(
            {
                message: "Unit updated successfully with encrypted photo URLs",
                unit_id: id,
                uploadedPhotos: uploadedFiles.length,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error updating unit:", error);
        await connection.rollback();

        return NextResponse.json(
            { error: "Failed to update unit listing", details: error.message },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
