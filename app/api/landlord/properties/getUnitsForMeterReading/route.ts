import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionUser();

        if (!session) {
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

        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get("property_id");

        if (!propertyId) {
            return NextResponse.json(
                { error: "Missing property_id parameter" },
                { status: 400 }
            );
        }

        // Verify property belongs to landlord
        const [propertyRows]: any = await db.query(
            `SELECT property_id, property_name, water_billing_type, electricity_billing_type 
             FROM Property WHERE property_id = ? AND landlord_id = ?`,
            [propertyId, session.landlord_id]
        );

        if (propertyRows.length === 0) {
            return NextResponse.json(
                { error: "Property not found or access denied." },
                { status: 404 }
            );
        }

        const property = propertyRows[0];

        // Fetch units with active leases and last reading info
        // prev_ = reading from previous month (period_end from last month)
        // curr_ = reading already entered for current month
        const [unitRows]: any = await db.query(
            `
            SELECT 
                u.unit_id,
                u.unit_name,
                u.status as unit_status,
                (SELECT current_reading FROM ElectricMeterReading WHERE unit_id = u.unit_id AND MONTH(period_end) < MONTH(CURDATE()) ORDER BY period_end DESC LIMIT 1) as prev_electric_reading,
                (SELECT period_end FROM ElectricMeterReading WHERE unit_id = u.unit_id AND MONTH(period_end) < MONTH(CURDATE()) ORDER BY period_end DESC LIMIT 1) as prev_period_end,
                (SELECT current_reading FROM WaterMeterReading WHERE unit_id = u.unit_id AND MONTH(period_end) < MONTH(CURDATE()) ORDER BY period_end DESC LIMIT 1) as prev_water_reading,
                (SELECT current_reading FROM ElectricMeterReading WHERE unit_id = u.unit_id AND MONTH(period_end) = MONTH(CURDATE()) ORDER BY created_at DESC LIMIT 1) as curr_electric_reading,
                (SELECT current_reading FROM WaterMeterReading WHERE unit_id = u.unit_id AND MONTH(period_end) = MONTH(CURDATE()) ORDER BY created_at DESC LIMIT 1) as curr_water_reading
            FROM Unit u
            WHERE u.property_id = ? AND u.status = 'occupied'
            ORDER BY u.unit_name ASC
            `,
            [propertyId]
        );

        return NextResponse.json({
            property,
            units: unitRows,
        });
    } catch (error) {
        console.error("Error fetching property units:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
