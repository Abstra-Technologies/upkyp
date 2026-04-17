import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

/* =====================================================
   Cached subscription fetch (used for validation)
===================================================== */
const getActiveSubscription = unstable_cache(
    async (landlord_id: string) => {
        const [rows]: any = await db.query(
            `
      SELECT *
      FROM rentalley_db.Subscription
      WHERE landlord_id = ?
        AND is_active = 1
      ORDER BY end_date DESC
      LIMIT 1
    `,
            [landlord_id]
        );

        return rows[0] || null;
    },
    ["active-subscription"],
    { revalidate: 30 }
);

/* =====================================================
   POST /api/landlord/subscription/cancel
===================================================== */
export async function POST(req: Request) {
    const sessionUser = await getSessionUser();

    if (!sessionUser || sessionUser.userType !== "landlord") {
        return NextResponse.json(
            { error: "Unauthorized. Valid landlord session required." },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const { landlord_id } = body;

        if (!landlord_id) {
            return NextResponse.json(
                { error: "Missing landlord_id" },
                { status: 400 }
            );
        }

        if (String(sessionUser.landlord_id) !== String(landlord_id)) {
            return NextResponse.json(
                { error: "Forbidden: You can only cancel your own subscription." },
                { status: 403 }
            );
        }

        /* ---------------------------------------------
           1️⃣ Fetch active subscription (cached)
        ---------------------------------------------- */
        const subscription = await getActiveSubscription(landlord_id);

        if (!subscription) {
            return NextResponse.json(
                { error: "No active subscription found" },
                { status: 404 }
            );
        }

        if (subscription.payment_status === "cancelled") {
            return NextResponse.json(
                {
                    message: "Subscription already cancelled",
                    end_date: subscription.end_date,
                },
                { status: 200 }
            );
        }

        /* ---------------------------------------------
           2️⃣ Mark as cancelled (keep access)
        ---------------------------------------------- */
        await db.query(
            `
      UPDATE rentalley_db.Subscription
      SET payment_status = 'cancelled',
          updated_at = NOW()
      WHERE subscription_id = ?
    `,
            [subscription.subscription_id]
        );

        /* ---------------------------------------------
           3️⃣ Return success
        ---------------------------------------------- */
        return NextResponse.json({
            success: true,
            message: "Subscription cancelled successfully",
            access_until: subscription.end_date,
        });
    } catch (error: any) {
        console.error("[CANCEL_SUBSCRIPTION]", error);

        return NextResponse.json(
            {
                error: "Failed to cancel subscription",
                details: error.message,
            },
            { status: 500 }
        );
    }
}
