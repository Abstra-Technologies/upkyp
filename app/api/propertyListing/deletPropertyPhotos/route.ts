import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { decryptData } from "@/crypto/encrypt";
import { deleteFromS3 } from "@/lib/s3";
import { getSessionUser } from "@/lib/auth/auth";

export async function DELETE(req: Request) {
    const session = await getSessionUser();

    if (!session || !session.landlord_id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { photo_id, property_id } = await req.json();

        if (!photo_id || !property_id) {
            return NextResponse.json({ error: "photo_id and property_id are required" }, { status: 400 });
        }

        const [rows]: any = await db.query(
            "SELECT photo_url FROM PropertyPhoto WHERE photo_id = ? AND property_id = ?",
            [photo_id, property_id]
        );

        if (!rows.length) {
            return NextResponse.json(
                { error: "Photo not found" },
                { status: 404 }
            );
        }

        const encryptedUrl = rows[0].photo_url;

        let decryptedUrl: string;
        try {
            const result = decryptData(JSON.parse(encryptedUrl), process.env.ENCRYPTION_SECRET!);
            if (!result || typeof result !== "string") {
                throw new Error("Decryption returned invalid data");
            }
            decryptedUrl = result;
        } catch (err) {
            console.error("Failed to decrypt URL:", err);
            return NextResponse.json({ error: "Failed to decrypt photo URL" }, { status: 500 });
        }

        await deleteFromS3(decryptedUrl);

        await db.query("DELETE FROM PropertyPhoto WHERE photo_id = ? AND property_id = ?", [photo_id, property_id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete photo:", error);
        return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
    }
}
