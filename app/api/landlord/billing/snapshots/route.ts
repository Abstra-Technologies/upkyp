import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth";
//  for platform subscription

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

        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "12");
        const offset = (page - 1) * limit;

        const [snapshots]: any = await db.query(
            `
                SELECT
                    sbs.snapshot_id,
                    sbs.billing_month,
                    sbs.billing_period_start,
                    sbs.billing_period_end,
                    sbs.applied_floor_price,
                    sbs.total_computed,
                    sbs.final_charge,
                    sbs.charge_basis,
                    sbs.sync_status,
                    sbs.created_at,
                    sub.subscription_id,
                    p.name AS plan_name,
                    p.price AS plan_base_price,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'property_type', sbi.property_type,
                            'units_used', sbi.units_used,
                            'unit_price', sbi.unit_price,
                            'computed_amount', sbi.computed_amount
                        )
                    ) AS unit_items
                FROM SubscriptionMonthlyBillingSnapshot sbs
                JOIN Subscription sub ON sbs.subscription_id = sub.subscription_id
                JOIN Plan p ON sub.plan_id = p.plan_id
                LEFT JOIN SubscriptionMonthlyBillingSnapshotItem sbi ON sbs.snapshot_id = sbi.snapshot_id
                WHERE sub.landlord_id = ?
                GROUP BY sbs.snapshot_id
                ORDER BY sbs.billing_month DESC
                LIMIT ? OFFSET ?
            `,
            [sessionUser.landlord_id, limit, offset]
        );

        const [countRows]: any = await db.query(
            `
                SELECT COUNT(*) AS total
                FROM SubscriptionMonthlyBillingSnapshot sbs
                JOIN Subscription sub ON sbs.subscription_id = sub.subscription_id
                WHERE sub.landlord_id = ?
            `,
            [sessionUser.landlord_id]
        );

        const total = countRows[0]?.total || 0;
        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            success: true,
            data: snapshots,
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
        });
    } catch (error) {
        console.error("BILLING SNAPSHOTS ERROR:", error);
        return NextResponse.json(
            { error: "Failed to fetch billing snapshots" },
            { status: 500 }
        );
    }
}
