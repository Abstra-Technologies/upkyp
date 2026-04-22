import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

const round4 = (n: number) =>
    Math.round((n + Number.EPSILON) * 10000) / 10000;

export async function POST(req: NextRequest) {
    try {
        const {
            property_id,
            electricityTotal,
            electricityConsumption,
            waterTotal,
            waterConsumption,
        } = await req.json();

        if (!property_id) {
            return NextResponse.json(
                { error: "Property ID is required" },
                { status: 400 }
            );
        }

        const eTotal = Number(electricityTotal) || 0;
        const eCons = Number(electricityConsumption) || 0;
        const wTotal = Number(waterTotal) || 0;
        const wCons = Number(waterConsumption) || 0;

        const electricityRate = eTotal > 0 && eCons > 0 ? round4(eTotal / eCons) : null;
        const waterRate = wTotal > 0 && wCons > 0 ? round4(wTotal / wCons) : null;

        // Electricity rates
        if (eTotal > 0 && eCons > 0) {
            // Check if already exists for current month
            const [existing]: any = await db.query(
                `SELECT bill_id FROM ElectricityConcessionaireBilling
                 WHERE property_id = ?
                 AND YEAR(created_at) = YEAR(CURDATE())
                 AND MONTH(created_at) = MONTH(CURDATE())`,
                [property_id]
            );

            if (existing.length > 0) {
                await db.execute(
                    `UPDATE ElectricityConcessionaireBilling SET consumption = ?, total_amount = ?, rate_per_kwh = ?, updated_at = NOW()
                     WHERE property_id = ?
                     AND YEAR(created_at) = YEAR(CURDATE())
                     AND MONTH(created_at) = MONTH(CURDATE())`,
                    [eCons, eTotal, electricityRate, property_id]
                );
            } else {
                await db.execute(
                    `INSERT INTO ElectricityConcessionaireBilling (property_id, consumption, total_amount, rate_per_kwh)
                     VALUES (?, ?, ?, ?)`,
                    [property_id, eCons, eTotal, electricityRate]
                );
            }
        }

        // Water rates
        if (wTotal > 0 && wCons > 0) {
            // Check if already exists for current month
            const [existing]: any = await db.query(
                `SELECT bill_id FROM WaterConcessionaireBilling
                 WHERE property_id = ?
                 AND YEAR(created_at) = YEAR(CURDATE())
                 AND MONTH(created_at) = MONTH(CURDATE())`,
                [property_id]
            );

            if (existing.length > 0) {
                await db.execute(
                    `UPDATE WaterConcessionaireBilling SET consumption = ?, total_amount = ?, rate_per_cubic = ?, updated_at = NOW()
                     WHERE property_id = ?
                     AND YEAR(created_at) = YEAR(CURDATE())
                     AND MONTH(created_at) = MONTH(CURDATE())`,
                    [wCons, wTotal, waterRate, property_id]
                );
            } else {
                await db.execute(
                    `INSERT INTO WaterConcessionaireBilling (property_id, consumption, total_amount, rate_per_cubic)
                     VALUES (?, ?, ?, ?)`,
                    [property_id, wCons, wTotal, waterRate]
                );
            }
        }

        return NextResponse.json({ message: "Concessionaire rates saved successfully" }, { status: 201 });
    } catch (error) {
        console.error("Concessionaire Billing UPSERT Error:", error);
        return NextResponse.json({ error: "Database server error" }, { status: 500 });
    }
}


export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const property_id = searchParams.get("property_id");

        if (!property_id) {
            return NextResponse.json(
                { error: "Property ID is required" },
                { status: 400 }
            );
        }

        // Get latest Water rates for current month
        const [waterRows]: any = await db.execute(
            `SELECT bill_id, property_id,
                    consumption, total_amount, rate_per_cubic, created_at, updated_at
             FROM WaterConcessionaireBilling
             WHERE property_id = ?
             AND YEAR(created_at) = YEAR(CURDATE())
             AND MONTH(created_at) = MONTH(CURDATE())
             ORDER BY created_at DESC
             LIMIT 1`,
            [property_id]
        );

        // Get latest Electricity rates for current month
        const [electricRows]: any = await db.execute(
            `SELECT bill_id, property_id,
                    consumption, total_amount, rate_per_kwh, created_at, updated_at
             FROM ElectricityConcessionaireBilling
             WHERE property_id = ?
             AND YEAR(created_at) = YEAR(CURDATE())
             AND MONTH(created_at) = MONTH(CURDATE())
             ORDER BY created_at DESC
             LIMIT 1`,
            [property_id]
        );

        const waterRow = waterRows?.[0];
        const electricRow = electricRows?.[0];

        if (!waterRow && !electricRow) {
            return NextResponse.json({ billingData: null }, { status: 200 });
        }

        return NextResponse.json(
            {
                billingData: {
                    electricity: electricRow
                        ? {
                            consumption: electricRow.consumption,
                            total: electricRow.total_amount,
                            rate: electricRow.rate_per_kwh,
                        }
                        : null,

                    water: waterRow
                        ? {
                            consumption: waterRow.consumption,
                            total: waterRow.total_amount,
                            rate: waterRow.rate_per_cubic,
                        }
                        : null,

                    created_at: waterRow?.created_at || electricRow?.created_at,
                    updated_at: waterRow?.updated_at || electricRow?.updated_at,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Concessionaire Billing FETCH Error:", error);
        return NextResponse.json(
            { error: "Database server error" },
            { status: 500 }
        );
    }
}