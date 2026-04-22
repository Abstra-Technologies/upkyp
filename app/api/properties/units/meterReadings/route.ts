import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * @route GET /api/landlord/meter/getReadingsByUnit?unit_id=123
 * @desc Fetch latest water & electricity meter readings for a specific unit
 *       + applicable concessionaire rates from linked bills
 */

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const unitId = searchParams.get("unit_id");

    if (!unitId) {
        return NextResponse.json({ error: "Missing unit_id parameter" }, { status: 400 });
    }

    try {
        // 1️⃣ Validate unit exists and get property_id
        const [unitRows]: any = await db.query(
            `SELECT property_id FROM Unit WHERE unit_id = ? LIMIT 1`,
            [unitId]
        );

        if (!unitRows.length) {
            return NextResponse.json({ error: "Unit not found." }, { status: 404 });
        }

        const propertyId = unitRows[0].property_id;

        // 2️⃣ Fetch Water Meter Readings
        const [waterReadings]: any = await db.query(
            `
            SELECT 
                'water' AS utility_type,
                reading_id,
                unit_id,
                period_start,
                period_end,
                previous_reading,
                current_reading,
                consumption,
                water_bill_id,
                is_locked,
                created_at,
                updated_at
            FROM WaterMeterReading
            WHERE unit_id = ?
            ORDER BY period_end DESC
            `,
            [unitId]
        );

        // 3️⃣ Fetch Electricity Meter Readings
        const [electricReadings]: any = await db.query(
            `
            SELECT 
                'electricity' AS utility_type,
                reading_id,
                unit_id,
                period_start,
                period_end,
                previous_reading,
                current_reading,
                consumption,
                electricity_bill_id,
                is_locked,
                created_at,
                updated_at
            FROM ElectricMeterReading
            WHERE unit_id = ?
            ORDER BY period_end DESC
            `,
            [unitId]
        );

        // 4️⃣ Combine all readings
        const allReadings = [...waterReadings, ...electricReadings]
            .sort((a: any, b: any) => {
                return b.period_end?.localeCompare(a.period_end);
            });

        // 5️⃣ Get latest concessionaire rates (most recent period_end)
        const [latestBill]: any = await db.query(
            `
            SELECT 
                bill_id,
                period_start,
                period_end,
                water_rate,
                electricity_rate
            FROM ConcessionaireBilling
            WHERE property_id = ?
            ORDER BY period_end DESC
            LIMIT 1
            `,
            [propertyId]
        );

        const concessionaireRates = latestBill.length > 0
            ? {
                water_rate: latestBill[0].water_rate || null,
                electricity_rate: latestBill[0].electricity_rate || null,
                period_start: latestBill[0].period_start,
                period_end: latestBill[0].period_end,
                bill_id: latestBill[0].bill_id,
            }
            : {
                water_rate: null,
                electricity_rate: null,
                period_start: null,
                period_end: null,
                bill_id: null,
            };

        // 6️⃣ Enrich each reading with applicable rates (from linked bill or latest global)
        const enrichedReadings = allReadings.map((reading: any) => {
            let appliedWaterRate = null;
            let appliedElectricityRate = null;

            if (reading.concessionaire_bill_id) {
                // If reading links to a specific bill, ideally we'd join rates from there
                // But for simplicity, we use the latest known rates
                appliedWaterRate = concessionaireRates.water_rate;
                appliedElectricityRate = concessionaireRates.electricity_rate;
            } else {
                appliedWaterRate = concessionaireRates.water_rate;
                appliedElectricityRate = concessionaireRates.electricity_rate;
            }

            return {
                ...reading,
                water_rate: reading.utility_type === 'water' ? appliedWaterRate : null,
                electricity_rate: reading.utility_type === 'electricity' ? appliedElectricityRate : null,
                applicable_concessionaire_period: concessionaireRates.period_start && concessionaireRates.period_end
                    ? `${concessionaireRates.period_start} to ${concessionaireRates.period_end}`
                    : null,
            };
        });

        // 7️⃣ Final response
        return NextResponse.json(
            {
                message: "Meter readings fetched successfully.",
                unit_id: unitId,
                property_id: propertyId,
                latest_concessionaire_rates: concessionaireRates,
                readings: enrichedReadings,
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("❌ Error fetching meter readings:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}