import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

const PLAN_MAP: Record<string, {
    code: "FREE" | "STANDARD" | "PRO" | "ENTERPRISE" | "LIFETIME";
    trialDays: number;
    isFree: boolean;
}> = {
    "Free Plan": { code: "FREE", trialDays: 0, isFree: true },
    "Standard Plan": { code: "STANDARD", trialDays: 60, isFree: false },
    "Pro Plan": { code: "PRO", trialDays: 60, isFree: false },
    "Enterprise Plan": { code: "ENTERPRISE", trialDays: 60, isFree: false },
    "Lifetime License": { code: "LIFETIME", trialDays: 0, isFree: false },
};

export async function POST(req: NextRequest) {
    const sessionUser = await getSessionUser();

    if (!sessionUser || sessionUser.userType !== "landlord") {
        return NextResponse.json(
            { error: "Unauthorized. Valid landlord session required." },
            { status: 401 }
        );
    }

    if (!sessionUser.landlord_id) {
        return NextResponse.json(
            { error: "Landlord ID not found in session." },
            { status: 400 }
        );
    }

    const conn = await db.getConnection();

    try {
        const { landlord_id, plan_name } = await req.json();

        if (String(landlord_id) !== String(sessionUser.landlord_id)) {
            return NextResponse.json(
                { error: "Forbidden: You can only activate plans for your own account." },
                { status: 403 }
            );
        }

        console.log('landlord id: ' + landlord_id);
        console.log('plan: ' + plan_name);

        if (!landlord_id || !plan_name) {
            return NextResponse.json(
                { error: "Missing landlord_id or plan_name." },
                { status: 400 }
            );
        }

        const plan = PLAN_MAP[plan_name];
        if (!plan) {
            return NextResponse.json(
                { error: "Invalid plan selection." },
                { status: 400 }
            );
        }

        await conn.beginTransaction();

        /* --------------------------------------------------
           LOCK landlord row (prevents race conditions)
        -------------------------------------------------- */
        const [landlordRows]: any = await conn.execute(
            "SELECT is_trial_used FROM Landlord WHERE landlord_id = ? FOR UPDATE",
            [landlord_id]
        );

        if (!landlordRows.length) {
            await conn.rollback();
            return NextResponse.json(
                { error: "Landlord not found." },
                { status: 404 }
            );
        }

        const isTrialUsed = landlordRows[0].is_trial_used === 1;

        /* --------------------------------------------------
           IDEMPOTENCY CHECK
           If same active plan already exists → success
        -------------------------------------------------- */
        const [activeSubs]: any = await conn.execute(
            `SELECT subscription_id
       FROM Subscription
       WHERE landlord_id = ?
         AND plan_code = ?
         AND is_active = 1
       LIMIT 1`,
            [landlord_id, plan.code]
        );

        if (activeSubs.length) {
            await conn.commit();
            return NextResponse.json(
                { message: "Subscription already active." },
                { status: 200 }
            );
        }

        /* --------------------------------------------------
           TRIAL RULE ENFORCEMENT
        -------------------------------------------------- */
        if (!plan.isFree && isTrialUsed) {
            await conn.rollback();
            return NextResponse.json(
                { error: "Free trial already used." },
                { status: 403 }
            );
        }

        /* --------------------------------------------------
           Deactivate previous subscriptions
        -------------------------------------------------- */
        await conn.execute(
            "UPDATE Subscription SET is_active = 0 WHERE landlord_id = ?",
            [landlord_id]
        );

        /* --------------------------------------------------
           Dates
        -------------------------------------------------- */
        const startDate = new Date();
        let endDate: Date | null = null;
        let isTrial = 0;

        if (!plan.isFree && plan.trialDays > 0) {
            isTrial = 1;
            endDate = new Date();
            endDate.setDate(endDate.getDate() + plan.trialDays);

            await conn.execute(
                "UPDATE Landlord SET is_trial_used = 1, trial_used_at = NOW() WHERE landlord_id = ?",
                [landlord_id]
            );
        }

        /* --------------------------------------------------
           Insert subscription
        -------------------------------------------------- */
        await conn.execute(
            `
      INSERT INTO Subscription (
        landlord_id,
        plan_name,
        plan_code,
        start_date,
        end_date,
        payment_status,
        is_trial,
        amount_paid,
        request_reference_number,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, 'paid', ?, 0.00, UUID(), 1)
      `,
            [
                landlord_id,
                plan_name,
                plan.code,
                startDate,
                endDate,
                isTrial,
            ]
        );

        await conn.commit();

        return NextResponse.json(
            {
                message: plan.isFree
                    ? "Free plan activated."
                    : `${plan.trialDays}-day free trial activated.`,
                trial_end_date: endDate,
            },
            { status: 201 }
        );
    } catch (err: any) {
        await conn.rollback();

        // Idempotency safety net (DB constraint)
        if (err.code === "ER_DUP_ENTRY") {
            return NextResponse.json(
                { message: "Subscription already exists." },
                { status: 200 }
            );
        }

        console.error("[SubscriptionActivation]", err);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    } finally {
        conn.release();
    }
}
