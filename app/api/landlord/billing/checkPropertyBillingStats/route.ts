import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

// Get property rates for CURRENT MONTH using created_at
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const property_id = searchParams.get("property_id");

    if (!property_id) {
        return NextResponse.json(
            { error: "Property ID is required" },
            { status: 400 }
        );
    }

    try {
        // Get Water rates - latest for current month via created_at
        const [waterRows]: any = await db.query(
            `
            SELECT 
                bill_id,
                consumption,
                total_amount,
                rate_per_cubic,
                created_at
            FROM WaterConcessionaireBilling
            WHERE property_id = ?
                AND YEAR(created_at) = YEAR(CURDATE())
                AND MONTH(created_at) = MONTH(CURDATE())
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [property_id]
        );

        // Get Electricity rates - latest for current month via created_at
        const [electricRows]: any = await db.query(
            `
            SELECT 
                bill_id,
                consumption,
                total_amount,
                rate_per_kwh,
                created_at
            FROM ElectricityConcessionaireBilling
            WHERE property_id = ?
                AND YEAR(created_at) = YEAR(CURDATE())
                AND MONTH(created_at) = MONTH(CURDATE())
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [property_id]
        );

        const waterRow = waterRows?.[0];
        const electricRow = electricRows?.[0];

        if (!waterRow && !electricRow) {
            return NextResponse.json({ billingData: null });
        }

const createdAt = waterRow?.created_at || electricRow?.created_at;

        return NextResponse.json({
            billingData: {
                created_at: createdAt,
                water: waterRow
                    ? {
                        total: Number(waterRow.total_amount),
                        consumption: Number(waterRow.consumption),
                        rate: Number(waterRow.rate_per_cubic),
                      }
                    : null,

                electricity: electricRow
                    ? {
                        total: Number(electricRow.total_amount),
                        consumption: Number(electricRow.consumption),
                        rate: Number(electricRow.rate_per_kwh),
                      }
                    : null,
            },
        });
    } catch (error) {
        console.error("Error fetching billing data:", error);
        return NextResponse.json(
            { error: "Database server error" },
            { status: 500 }
        );
    }
}
