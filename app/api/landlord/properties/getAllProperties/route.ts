import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";
import { safeDecrypt } from "@/utils/decrypt/safeDecrypt";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionUser();

        if (!session || session.userType !== "landlord") {
            return NextResponse.json(
                { error: "Unauthorized. Please log in." },
                { status: 401 }
            );
        }

        if (!session.landlord_id) {
            return NextResponse.json(
                { error: "Landlord profile not found." },
                { status: 404 }
            );
        }

        const [rows]: any[] = await db.execute(
            `
            SELECT 
                p.property_id,
                p.property_name,
                p.city,
                p.province,
                p.street,
                p.property_type,
                p.status,
                p.created_at,
                pv.status AS verification_status,
                u.unit_id,
                u.unit_name,
                u.status AS unit_status,
                u.rent_amount
            FROM Property p
            LEFT JOIN PropertyVerification pv ON p.property_id = pv.property_id
            LEFT JOIN Unit u ON p.property_id = u.property_id
            WHERE p.landlord_id = ?
            ORDER BY p.created_at DESC, u.unit_id
            `,
            [session.landlord_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json({ success: true, data: [] }, { status: 200 });
        }

        const propertyIds = [...new Set(rows.map((r: any) => r.property_id))];

        const [photoRows]: any[] = await db.execute(
            `SELECT photo_id, property_id, photo_url FROM PropertyPhoto WHERE property_id IN (?) ORDER BY photo_id ASC`,
            [propertyIds]
        );

        const photosByProperty: Record<string, any[]> = {};
        for (const photo of photoRows as any[]) {
            const pid = photo.property_id;
            if (!photosByProperty[pid]) {
                photosByProperty[pid] = [];
            }
            photosByProperty[pid].push({
                photo_id: photo.photo_id,
                photo_url: safeDecrypt(photo.photo_url),
            });
        }

        const properties = rows.reduce((acc: any[], row: any) => {
            let property = acc.find((p: any) => p.property_id === row.property_id);

            if (!property) {
                property = {
                    property_id: row.property_id,
                    property_name: row.property_name,
                    city: row.city,
                    province: row.province,
                    street: row.street,
                    property_type: row.property_type,
                    status: row.status,
                    created_at: row.created_at,
                    verification_status: row.verification_status || null,
                    total_units: 0,
                    occupied_units: 0,
                    total_income: 0,
                    photos: photosByProperty[row.property_id] || [],
                    units: [],
                };
                acc.push(property);
            }

            if (row.unit_id) {
                property.total_units += 1;
                if (row.unit_status === "occupied") {
                    property.occupied_units += 1;
                    property.total_income += Number(row.rent_amount || 0);
                }
                property.units.push({
                    unit_id: row.unit_id,
                    unit_name: row.unit_name,
                    unit_status: row.unit_status,
                    rent_amount: row.rent_amount,
                });
            }

            return acc;
        }, []);

        return NextResponse.json({ success: true, data: properties });
    } catch (error) {
        console.error("Error fetching properties:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
