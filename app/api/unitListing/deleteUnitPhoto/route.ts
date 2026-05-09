import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { deleteFromS3 } from "@/lib/s3";
import { getSessionUser } from "@/lib/auth/auth";

export async function DELETE(req: NextRequest) {
    const session = await getSessionUser();

    if (!session || !session.landlord_id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get("id");

    if (!photoId) {
        return NextResponse.json({ error: "Missing photo ID" }, { status: 400 });
    }

    const connection = await db.getConnection();

    try {
        const [rows]: any = await connection.execute(
            `SELECT up.photo_url, u.unit_id, u.property_id 
             FROM UnitPhoto up 
             JOIN Unit u ON up.unit_id = u.unit_id 
             WHERE up.id = ?`,
            [photoId]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: "Photo not found" }, { status: 404 });
        }

        let photoUrl: string;
        try {
            const decrypted = decryptData(JSON.parse(rows[0].photo_url), process.env.ENCRYPTION_SECRET!);
            if (!decrypted || typeof decrypted !== "string") {
                throw new Error("Decryption returned invalid data");
            }
            photoUrl = decrypted;
        } catch (err) {
            console.error("Error decrypting photo URL:", err);
            return NextResponse.json(
                { error: "Failed to decrypt photo URL" },
                { status: 500 }
            );
        }

        try {
            await deleteFromS3(photoUrl);
        } catch (s3Error: any) {
            console.error("Error deleting from S3:", s3Error);
            return NextResponse.json(
                { error: "Failed to delete photo from S3", details: s3Error.message },
                { status: 500 }
            );
        }

        await connection.execute(`DELETE FROM UnitPhoto WHERE id = ?`, [photoId]);

        return NextResponse.json(
            { message: "Photo deleted successfully", photoId },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error deleting unit photo:", error);
        return NextResponse.json(
            { error: "Failed to delete unit photo", details: error.message },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
