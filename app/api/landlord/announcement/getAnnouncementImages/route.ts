import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cacheLife, cacheTag } from "next/cache";
import { decryptData } from "@/crypto/encrypt";

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

async function getCachedAnnouncementImages(id: string) {
    "use cache";
    cacheLife("minutes");
    cacheTag(`announcement-images-${id}`);

    const query = `
        SELECT photo_id, photo_url, created_at
        FROM AnnouncementPhoto
        WHERE announcement_id = ?
        ORDER BY created_at ASC
    `;

    const [rows] = await db.execute(query, [id]);

    return (rows as any[]).map((row) => {
        try {
            const parsed = JSON.parse(row.photo_url);
            const decryptedUrl = decryptData(parsed, encryptionSecret);
            return {
                ...row,
                photo_url: decryptedUrl,
            };
        } catch (error) {
            console.error("Error decrypting image:", error);
            return row;
        }
    });
}

export async function GET(req: NextRequest) {
    try {
        const id = req.nextUrl.searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { message: "Announcement ID is required" },
                { status: 400 }
            );
        }

        const decryptedRows = await getCachedAnnouncementImages(id);

        return NextResponse.json(decryptedRows);
    } catch (error: any) {
        console.error("Error fetching announcement images:", error.message);
        return NextResponse.json(
            { message: "Internal Server Error", error: error.message },
            { status: 500 }
        );
    }
}
