import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

/**
 * @method      DELETE
 * @route       /api/unitListing/deleteUnitPhoto
 * @desc        delete a unit photo single.
 * @usedIn      app/landlord/properties/[id]/units/edit/[unitId]/page.tsx
 * @returns     n/a
 */


const s3Client = new S3Client({
    region: process.env.NEXT_AWS_REGION!,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

// Encryption secret
const encryptionSecret = process.env.ENCRYPTION_SECRET!;

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get("id");

    console.log("photo id", photoId);

    if (!photoId) {
        return NextResponse.json({ error: "Missing photo ID" }, { status: 400 });
    }

    let connection;
    try {
        connection = await db.getConnection();

        // Fetch the encrypted photo URL
        const [rows]: any = await connection.execute(
            `SELECT photo_url FROM UnitPhoto WHERE id = ?`,
            [photoId]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: "Photo not found" }, { status: 404 });
        }

        let photoUrl = rows[0].photo_url;

        try {
            photoUrl = decryptData(JSON.parse(photoUrl), encryptionSecret);
        } catch (err) {
            console.error("Error decrypting photo URL:", err);
            return NextResponse.json(
                { error: "Failed to decrypt photo URL" },
                { status: 500 }
            );
        }

        const key = new URL(photoUrl).pathname.substring(1);

        try {
            await s3Client.send(
                new DeleteObjectCommand({
                    Bucket: process.env.NEXT_S3_BUCKET_NAME!,
                    Key: key,
                })
            );
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
        if (connection) connection.release();
    }
}
