import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { decryptData } from "@/crypto/encrypt";
import { deleteFromS3 } from "@/lib/s3";

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

export async function DELETE(req: Request) {
    try {
        const { photo_id, property_id } = await req.json();

        console.log('property id photo: ', property_id);
        console.log('photo id : ', photo_id);

        if (!photo_id || !property_id) {
            return NextResponse.json({ error: "photo_id and property_id are required" }, { status: 400 });
        }

        // Get the encrypted URL from DB
        const [rows] = await db.query(
            "SELECT photo_url FROM PropertyPhoto WHERE photo_id = ? AND property_id = ?",
            [photo_id, property_id]
        );


        // @ts-ignore
        if (!rows.length) {
            console.warn("[PropertyPhoto] ❌ No photos found", {
                property_id,
                query,
                params,
            });

            return NextResponse.json(
                { error: "Photo not found" },
                { status: 404 }
            );
        }

// ✅ BETTER DEBUG
        console.log("[PropertyPhoto] ✅ Rows fetched:", {
            count: rows.length,
            property_id,
        });

// 🔍 Inspect first row (VERY IMPORTANT)
        console.log("[PropertyPhoto] Sample row:", {
            photo_id: rows[0]?.photo_id,
            property_id: rows[0]?.property_id,
            raw_photo_url: rows[0]?.photo_url,
            type: typeof rows[0]?.photo_url,
        });


        // @ts-ignore
        const encryptedUrl = rows[0].photo_url;

        // Decrypt the URL
        let decryptedUrl: string;
        try {
            // @ts-ignore
            decryptedUrl = decryptData(JSON.parse(encryptedUrl), encryptionSecret);
        } catch (err) {
            console.error("Failed to decrypt URL:", err);
            return NextResponse.json({ error: "Failed to decrypt photo URL" }, { status: 500 });
        }

        // Delete the file from S3
        await deleteFromS3(decryptedUrl);

        // Delete from DB
        await db.query("DELETE FROM PropertyPhoto WHERE photo_id = ? AND property_id = ?", [photo_id, property_id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete photo:", error);
        return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
    }
}
