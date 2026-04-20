
import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";

/*
USE CASES

components/landlord/analytics/PaymentSummaryCard.tsx

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

        //  Query all properties with units
        const [rows]: any = await db.query(
            `
      SELECT 
        p.property_id,
        p.property_name,
        p.city,
        p.province,
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
                { success: true, data: [] }, // empty response
                { status: 200 }
            );
        }

        // ✅ Group units under their properties
        const properties = rows.reduce((acc: any, row: any) => {
            let property = acc.find((p: any) => p.property_id === row.property_id);

            if (!property) {
                property = {
                    property_id: row.property_id,
                    property_name: row.property_name,
                    city: row.city,
                    province: row.province,
                    units: [],
                };
                acc.push(property);
            }

            if (row.unit_id) {
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
