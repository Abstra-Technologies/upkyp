import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");

    if (!propertyId) {
        return NextResponse.json(
            { error: "Missing property_id parameter." },
            { status: 400 }
        );
    }

    try {
        const [propRows]: any = await db.query(
            `SELECT property_id, property_name FROM Property WHERE property_id = ? LIMIT 1`,
            [propertyId]
        );

        if (!propRows.length) {
            return NextResponse.json(
                { error: "Property not found." },
                { status: 404 }
            );
        }

        const [waterRows]: any = await db.query(
            `
            SELECT bill_id, period_start, period_end, consumption, total_amount, rate_per_cubic
            FROM WaterConcessionaireBilling
            WHERE property_id = ?
            ORDER BY period_start DESC
            `,
            [propertyId]
        );

        const [elecRows]: any = await db.query(
            `
            SELECT bill_id, period_start, period_end, consumption, total_amount, rate_per_kwh
            FROM ElectricityConcessionaireBilling
            WHERE property_id = ?
            ORDER BY period_start DESC
            `,
            [propertyId]
        );

        return NextResponse.json(
            {
                message: "Concessionaire billing records fetched successfully.",
                property: {
                    id: propRows[0].property_id,
                    name: propRows[0].property_name,
                },
                waterBillings: waterRows.map((w: any) => ({
                    bill_id: w.bill_id,
                    period_start: w.period_start,
                    period_end: w.period_end,
                    consumption: Number(w.consumption),
                    total_amount: Number(w.total_amount),
                    rate: Number(w.rate_per_cubic),
                })),
                electricityBillings: elecRows.map((e: any) => ({
                    bill_id: e.bill_id,
                    period_start: e.period_start,
                    period_end: e.period_end,
                    consumption: Number(e.consumption),
                    total_amount: Number(e.total_amount),
                    rate: Number(e.rate_per_kwh),
                })),
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Concessionaire Billing API Error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
