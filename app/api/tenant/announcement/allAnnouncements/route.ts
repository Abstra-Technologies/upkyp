import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { decryptData } from "@/crypto/encrypt";
import { cacheLife, cacheTag } from "next/cache";

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

async function getCachedAnnouncements(user_id: string, agreement_id: string | null) {
    "use cache";
    cacheLife("minutes");
    cacheTag(`announcements-${user_id}-${agreement_id || "no-agreement"}`);

    return { user_id, agreement_id };
}

async function fetchAnnouncements(user_id: string, agreement_id: string | null) {
    let property_id: string | null = null;
    let landlord_id: string | null = null;

    if (agreement_id) {
        const [result]: any = await db.execute(
            `
            SELECT p.property_id, p.landlord_id
            FROM LeaseAgreement la
            JOIN Unit u ON la.unit_id = u.unit_id
            JOIN Property p ON u.property_id = p.property_id
            WHERE la.agreement_id = ?
            `,
            [agreement_id]
        );

        if (result.length === 0) {
            return { error: "Invalid agreement_id or no property found." };
        }

        property_id = result[0].property_id;
        landlord_id = result[0].landlord_id;
    } else {
        const [tenant]: any = await db.execute(
            "SELECT tenant_id FROM Tenant WHERE user_id = ?",
            [user_id]
        );

        if (tenant.length === 0) {
            return { error: "Tenant not found" };
        }

        const tenantId = tenant[0].tenant_id;

        const [property]: any = await db.execute(
            `SELECT p.property_id, p.landlord_id 
              FROM Property p 
              JOIN Unit u ON p.property_id = u.property_id 
              JOIN LeaseAgreement la ON u.unit_id = la.unit_id 
              WHERE la.tenant_id = ? 
              ORDER BY la.start_date DESC
              LIMIT 1`,
            [tenantId]
        );

        if (property.length === 0) {
            return { error: "No associated property found" };
        }

        property_id = property[0].property_id;
        landlord_id = property[0].landlord_id;
    }

    const [systemAnnouncementsRaw]: any = await db.execute(
        "SELECT id, title, message, created_at FROM AdminAnnouncement WHERE target_audience IN ('all', 'tenant')"
    );

    const systemAnnouncements = systemAnnouncementsRaw.map((ann: any) => ({
        unique_id: `sys-${ann.id}`,
        announcement_id: null,
        title: ann.title,
        message: ann.message,
        created_at: ann.created_at,
        updated_at: null,
        photos: [],
        source: "system",
    }));

    let landlordAnnouncements = [];

    if (landlord_id && property_id) {
        const [landlordAnnouncementsRaw]: any = await db.execute(
            `
            SELECT 
              announcement_id,
              subject,
              description,
              created_at,
              updated_at
            FROM Announcement 
            WHERE landlord_id = ? AND property_id = ?
            ORDER BY created_at DESC
            `,
            [landlord_id, property_id]
        );

        landlordAnnouncements = await Promise.all(
            landlordAnnouncementsRaw.map(async (ann: any) => {
                const [photos]: any = await db.execute(
                    `
                    SELECT 
                      photo_id,
                      photo_url,
                      created_at
                    FROM AnnouncementPhoto
                    WHERE announcement_id = ?
                    ORDER BY photo_id ASC
                    `,
                    [ann.announcement_id]
                );

                const decryptedPhotos = photos
                    .map((photo: any) => {
                        if (!photo.photo_url) return null;

                        try {
                            const encryptedData = JSON.parse(photo.photo_url);
                            const decryptedUrl = decryptData(
                                encryptedData,
                                encryptionSecret
                            );

                            if (
                                typeof decryptedUrl === "string" &&
                                decryptedUrl.length > 0 &&
                                (decryptedUrl.startsWith("http://") ||
                                    decryptedUrl.startsWith("https://") ||
                                    decryptedUrl.startsWith("/"))
                            ) {
                                return {
                                    photo_id: photo.photo_id,
                                    photo_url: decryptedUrl,
                                    created_at: photo.created_at,
                                };
                            }
                        } catch (err) {
                            console.error("Photo URL decryption error:", err);
                            if (
                                typeof photo.photo_url === "string" &&
                                (photo.photo_url.startsWith("http://") ||
                                    photo.photo_url.startsWith("https://") ||
                                    photo.photo_url.startsWith("/"))
                            ) {
                                return {
                                    photo_id: photo.photo_id,
                                    photo_url: photo.photo_url,
                                    created_at: photo.created_at,
                                };
                            }
                        }

                        return null;
                    })
                    .filter(Boolean);

                return {
                    unique_id: `ll-${ann.announcement_id}`,
                    announcement_id: ann.announcement_id,
                    title: ann.subject,
                    message: ann.description,
                    created_at: ann.created_at,
                    updated_at: ann.updated_at,
                    photos: decryptedPhotos,
                    image_url:
                        decryptedPhotos.length > 0 ? decryptedPhotos[0].photo_url : null,
                    source: "landlord",
                };
            })
        );
    }

    const announcements = [
        ...systemAnnouncements,
        ...landlordAnnouncements,
    ].sort(
        (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return { announcements };
}

export async function GET(req: NextRequest) {
    try {
        const user_id = req.nextUrl.searchParams.get("user_id");
        const agreement_id = req.nextUrl.searchParams.get("agreement_id");

        if (!user_id) {
            return NextResponse.json(
                { message: "Missing user_id parameter" },
                { status: 400 }
            );
        }

        const cached = await getCachedAnnouncements(user_id, agreement_id);
        const result = await fetchAnnouncements(user_id, agreement_id);

        if (result.error) {
            return NextResponse.json(
                { message: result.error },
                { status: 404 }
            );
        }

        return NextResponse.json(result.announcements);
    } catch (error: any) {
        console.error("Error fetching announcements:", error);
        return NextResponse.json(
            { message: "Internal Server Error", error: error.message },
            { status: 500 }
        );
    }
}
