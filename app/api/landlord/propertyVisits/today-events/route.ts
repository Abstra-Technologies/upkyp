import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // mysql2/promise instance

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const landlordId = searchParams.get("landlord_id");

    if (!landlordId) {
        return NextResponse.json(
            { error: "Missing landlord_id" },
            { status: 400 }
        );
    }

    // Today's date only (yyyy-mm-dd)
    const today = new Date().toISOString().split("T")[0];

    try {
        // ============================
        // 1️⃣ Today's Property Visits
        // ============================
        // 1️⃣ Today’s Property Visits
        // ============================
        const [visits] = await db.execute(
            `
            SELECT 
                pv.visit_id,
                pv.visit_date,
                pv.visit_time,
                pv.status,
                u.unit_name,
                p.property_name
            FROM PropertyVisit pv
            JOIN Unit u ON u.unit_id = pv.unit_id
            JOIN Property p ON p.property_id = u.property_id
            WHERE p.landlord_id = ?
              AND pv.visit_date = ?
            ORDER BY pv.visit_time ASC
            `,
            [landlordId, today]
        );

        // ============================
        // 2️⃣ Units Created Today
        // ============================
        const [unitsToday] = await db.execute(
            `
            SELECT 
                unit_id,
                unit_name,
                created_at
            FROM Unit
            WHERE property_id IN (
                SELECT property_id FROM Property WHERE landlord_id = ?
            )
            AND DATE(created_at) = ?
            ORDER BY created_at DESC
            `,
            [landlordId, today]
        );

        // ============================
        // 3️⃣ Properties Created Today
        // ============================
        const [propertiesToday] = await db.execute(
            `
            SELECT 
                property_id,
                property_name,
                created_at
            FROM Property
            WHERE landlord_id = ?
              AND DATE(created_at) = ?
            ORDER BY created_at DESC
            `,
            [landlordId, today]
        );


        const summary = {
            total_visits: visits.length,
            new_units: unitsToday.length,
            new_properties: propertiesToday.length,
        };

        return NextResponse.json({
            date: today,
            summary,
            visits,
            new_units: unitsToday,
            new_properties: propertiesToday,
        });

    } catch (err: any) {
        console.error("Error fetching today-events:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
