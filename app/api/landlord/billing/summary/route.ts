import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const sessionUser = await getSessionUser();

        if (!sessionUser || sessionUser.userType !== "landlord") {
            return NextResponse.json(
                { error: "Unauthorized. Valid landlord session required." },
                { status: 401 }
            );
        }

        if (!sessionUser.landlord_id) {
            return NextResponse.json(
                { error: "Landlord profile not found." },
                { status: 404 }
            );
        }

        const [activeSub]: any = await db.query(
            `
                SELECT
                    s.subscription_id,
                    p.plan_id,
                    p.plan_code,
                    p.name AS plan_name,
                    p.price AS base_price,
                    s.subscription_status
                FROM Subscription s
                JOIN Plan p ON s.plan_id = p.plan_id
                WHERE s.landlord_id = ?
                  AND s.subscription_status = 'active'
                LIMIT 1
            `,
            [sessionUser.landlord_id]
        );

        if (!activeSub || activeSub.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    hasActiveSubscription: false,
                    currentMonthUnits: 0,
                    currentMonthCharge: 0,
                    totalBilled: 0,
                    planName: null,
                },
            });
        }

        const subscription = activeSub[0];

        const [unitPriceRows]: any = await db.query(
            `SELECT property_type, unit_price FROM PlanUnitPriceByPropertyType WHERE plan_id = ?`,
            [subscription.plan_id]
        );

        const unitPricesByType: Record<string, number> = {};
        unitPriceRows.forEach((row: any) => {
            unitPricesByType[row.property_type] = Number(row.unit_price);
        });

        const [properties]: any = await db.query(
            `
                SELECT p.property_type, COUNT(u.unit_id) AS unit_count
                FROM Property p
                LEFT JOIN Unit u ON p.property_id = u.property_id
                WHERE p.landlord_id = ?
                GROUP BY p.property_type
            `,
            [sessionUser.landlord_id]
        );

        let totalUnits = 0;
        let totalUnitCost = 0;
        const unitsByType: { type: string; count: number; price: number; subtotal: number }[] = [];

        properties.forEach((row: any) => {
            const type = row.property_type || "residential";
            const count = Number(row.unit_count) || 0;
            const price = Number(unitPricesByType[type]) || 0;
            const subtotal = count * price;
            totalUnits += count;
            totalUnitCost += subtotal;
            unitsByType.push({ type, count, price, subtotal });
        });

        const basePrice = Number(subscription.base_price);
        const finalCharge = Math.max(basePrice, totalUnitCost);

        const [totalBilledRows]: any = await db.query(
            `SELECT COALESCE(SUM(final_charge), 0) AS total FROM SubscriptionMonthlyBillingSnapshot sbs
             JOIN Subscription sub ON sbs.subscription_id = sub.subscription_id
             WHERE sub.landlord_id = ?`,
            [sessionUser.landlord_id]
        );

        const totalBilled = Number(totalBilledRows[0]?.total || 0);

        return NextResponse.json({
            success: true,
            data: {
                hasActiveSubscription: true,
                planName: subscription.plan_name,
                basePrice,
                currentMonthUnits: totalUnits,
                currentMonthUnitCost: totalUnitCost,
                currentMonthCharge: finalCharge,
                totalBilled,
                unitsByType,
            },
        });
    } catch (error) {
        console.error("BILLING SUMMARY ERROR:", error);
        return NextResponse.json(
            { error: "Failed to fetch billing summary" },
            { status: 500 }
        );
    }
}
