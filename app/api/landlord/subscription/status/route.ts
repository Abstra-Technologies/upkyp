import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cacheLife, cacheTag } from "next/cache";

async function getCachedSubscriptionStatus(user_id: string) {
    "use cache";
    cacheLife("hours");
    cacheTag(`subscription-status-${user_id}`);

    const [landlordRows]: any = await db.query(
        `
        SELECT landlord_id
        FROM rentalley_db.Landlord
        WHERE user_id = ?
        LIMIT 1
        `,
        [user_id]
    );

    if (!landlordRows.length) {
        return { has_subscription: false };
    }

    const landlord_id = landlordRows[0].landlord_id;

    const [subRows]: any = await db.query(
        `
        SELECT 
            subscription_id,
            plan_name,
            plan_code,
            start_date,
            end_date,
            is_active,
            payment_status
        FROM rentalley_db.Subscription
        WHERE landlord_id = ?
          AND is_active = 1
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [landlord_id]
    );

    if (!subRows.length) {
        return { has_subscription: false };
    }

    const sub = subRows[0];

    return {
        has_subscription: true,
        subscription_id: sub.subscription_id,
        plan_name: sub.plan_name,
        plan_code: sub.plan_code,
        start_date: sub.start_date,
        end_date: sub.end_date,
        is_active: sub.is_active === 1,
        payment_status: sub.payment_status,
    };
}

export async function GET(req: NextRequest) {
    try {
        const user_id = req.nextUrl.searchParams.get("user_id");

        if (!user_id) {
            return NextResponse.json(
                { error: "Missing user_id" },
                { status: 400 }
            );
        }

        const result = await getCachedSubscriptionStatus(user_id);
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[SUBSCRIPTION_STATUS_ERROR]", error);
        return NextResponse.json(
            { error: "Failed to fetch subscription status" },
            { status: 500 }
        );
    }
}