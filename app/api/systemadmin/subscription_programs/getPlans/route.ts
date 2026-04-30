import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth/adminAuth";

export async function GET(request: NextRequest) {
    try {
        const [plans]: any = await db.query(`
        SELECT
            p.plan_id,
            p.plan_code,
            p.name,
            p.price,
            p.billing_cycle,
            p.is_active,
            p.created_at,
            p.updated_at,
            p.platform_fee,
            p.fee_type,
            pl.max_storage,
            pl.max_assets_per_property,
            pl.financial_history_years
        FROM Plan p
        LEFT JOIN PlanLimits pl ON p.plan_id = pl.plan_id
        WHERE p.is_active = 1
        ORDER BY p.created_at DESC
    `);

        const plansWithUnitPrices = await Promise.all(
            plans.map(async (plan: any) => {
                const [unitPrices]: any = await db.query(
                    `SELECT property_type, unit_price FROM PlanUnitPriceByPropertyType WHERE plan_id = ?`,
                    [plan.plan_id]
                );

                const unitPricesByType: Record<string, number> = {};
                unitPrices.forEach((row: any) => {
                    unitPricesByType[row.property_type] = Number(row.unit_price);
                });

                return {
                    ...plan,
                    unitPricesByType,
                };
            })
        );

        return NextResponse.json(plansWithUnitPrices);

    } catch (error) {
        console.error("ADMIN GET PLANS ERROR:", error);

        return NextResponse.json(
            { success: false, message: "Failed to fetch plans" },
            { status: 500 }
        );
    }
}
