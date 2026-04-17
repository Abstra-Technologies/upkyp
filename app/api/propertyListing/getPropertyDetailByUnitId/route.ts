import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { decryptData } from "@/crypto/encrypt";

// /landlord/properties/UPKYP10IPH4/units/details pages api

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const unit_id = searchParams.get("unit_id");

    if (!unit_id) {
        return NextResponse.json({ error: "Unit ID is required" }, { status: 400 });
    }

    try {
        // ✅ 1. Fetch property + unit details
        const [rows]: any = await db.query(
            `
                SELECT
                    u.unit_id,
                    u.unit_name,
                    u.rent_amount,
                    u.status,
                    u.qr_code_url,        -- 🆕
                    u.qr_enabled,         -- 🆕
                    u.qr_claim_enabled,   -- 🆕
                    p.property_id,
                    p.property_name,
                    p.street,
                    p.city,
                    p.province,
                    p.electricity_billing_type,
                    p.water_billing_type,
                    p.rent_increase_percent,
                    p.landlord_id
                FROM Unit u
                         JOIN Property p ON u.property_id = p.property_id
                WHERE u.unit_id = ?
            `,
            [unit_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { error: "No property found for this unit" },
                { status: 404 }
            );
        }

        const propertyDetails = rows[0];

        // ✅ 2. Fetch and decrypt photos
        const [photoRows]: any = await db.query(
            `SELECT photo_url FROM UnitPhoto WHERE unit_id = ?`,
            [unit_id]
        );

        let unitPhotos: string[] = [];

        if (photoRows && photoRows.length > 0) {
            unitPhotos = await Promise.all(
                photoRows.map(async (photo: any) => {
                    try {
                        return await decryptData(
                            JSON.parse(photo.photo_url),
                            process.env.ENCRYPTION_SECRET!
                        );
                    } catch (err) {
                        console.warn("⚠️ Failed to decrypt unit photo:", err);
                        return null;
                    }
                })
            );

            // remove any null entries
            unitPhotos = unitPhotos.filter(Boolean);
        }
        return NextResponse.json({
            propertyDetails,
            unitPhotos,
        });
    } catch (error) {
        console.error("❌ Database Error:", error);
        return NextResponse.json(
            { error: "Database server error" },
            { status: 500 }
        );
    }
}
