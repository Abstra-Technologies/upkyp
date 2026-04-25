
import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { safeDecrypt } from "@/utils/decrypt/safeDecrypt";

/*
USE CASES

components/landlord/analytics/PaymentSummaryCard.tsx
components/landlord/properties/propertyCards.tsx

* */

export async function GET(
    req: Request,
    { params }: { params: Promise<{ landlord_id: string }> }
) {
    try {
        const { landlord_id } = await params;


        if (!landlord_id) {
            return NextResponse.json(
                { success: false, error: "Missing landlordId" },
                { status: 400 }
            );
        }

        //  Query all properties with units and occupancy
        const [rows]: any = await db.query(
            `
      SELECT 
        p.property_id,
        p.property_name,
        p.city,
        p.province,
        p.street,
       
        u.unit_id,
        u.unit_name,
        u.status AS unit_status,
        u.rent_amount
      FROM Property p
      LEFT JOIN Unit u ON p.property_id = u.property_id
      WHERE p.landlord_id = ?
      ORDER BY p.property_id, u.unit_id
    `,
            [landlord_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { success: true, data: [] },
                { status: 200 }
            );
        }

        // Fetch all photos for these properties
        const propertyIds = [...new Set(rows.map((r: any) => r.property_id))];
        const [photoRows]: any = await db.query(
            `SELECT photo_id, property_id, photo_url FROM PropertyPhoto WHERE property_id IN (?) ORDER BY photo_id ASC`,
            [propertyIds]
        );

        // Decrypt photos and group by property_id
        const photosByProperty: Record<string, any[]> = {};
        for (const photo of photoRows) {
            if (!photosByProperty[photo.property_id]) {
                photosByProperty[photo.property_id] = [];
            }
            photosByProperty[photo.property_id].push({
                photo_id: photo.photo_id,
                photo_url: safeDecrypt(photo.photo_url),
            });
        }

        // Group units under their properties and calculate occupancy
        const properties = rows.reduce((acc: any, row: any) => {
            let property = acc.find((p: any) => p.property_id === row.property_id);

            if (!property) {
                property = {
                    property_id: row.property_id,
                    property_name: row.property_name,
                    city: row.city,
                    province: row.province,
                    street: row.street,
                    verification_status: row.verification_status,
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
        console.error("Error fetching landlord properties:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
