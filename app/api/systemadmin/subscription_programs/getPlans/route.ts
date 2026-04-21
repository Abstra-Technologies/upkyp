import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth/adminAuth";

export async function GET(request: NextRequest) {
    try {
        // 📦 Fetch Plans with Limits and Features
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

        // Fetch unit prices for each plan
        const plansWithPrices = await Promise.all(
            plans.map(async (plan: any) => {
                const [priceRows]: any = await db.query(
                    `SELECT unit_range, min_units, max_units, monthly_price, annual_price
                     FROM PlanPrices WHERE plan_id = ? ORDER BY min_units ASC`,
                    [plan.plan_id]
                );
                
                return {
                    ...plan,
                    prices: priceRows.map((row: any) => ({
                        ...row,
                        monthly_price: row.monthly_price ? Number(row.monthly_price) : null,
                        annual_price: row.annual_price ? Number(row.annual_price) : null,
                    })),
                };
            })
        );

        return NextResponse.json(plansWithPrices);

    } catch (error) {
        console.error("ADMIN GET PLANS ERROR:", error);

        return NextResponse.json(
            { success: false, message: "Failed to fetch plans" },
            { status: 500 }
        );
    }
}
