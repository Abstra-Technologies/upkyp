/* -------------------------------------------------------------------------- */
/* XENDIT SUBSCRIPTION & RECURRING WEBHOOK                                     */
/* -------------------------------------------------------------------------- */
/* Handles:                                                                    */
/* - recurring.plan.activation    : Subscription successfully activated        */
/* - payment_token.activated      : Payment method linked successfully         */
/* - recurring.cycle.paid         : Payment cycle completed                    */
/* - recurring.cycle.failed      : Payment cycle failed                       */

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

/* -------------------------------------------------------------------------- */
/* ENV                                                                        */
/* -------------------------------------------------------------------------- */

const {
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    XENDIT_TEXT_WEBHOOK_TOKEN,
} = process.env;

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                   */
/* -------------------------------------------------------------------------- */

async function getDbConnection() {
    return mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
    });
}

/* -------------------------------------------------------------------------- */
/* EVENT HANDLERS                                                              */
/* -------------------------------------------------------------------------- */

async function handlePlanActivation(conn: mysql.Connection, data: any) {
    const { recurring_plan_id, customer_id, payment_session_id, reference_id, status, subscription } = data;
    const subRefId = subscription?.reference_id || reference_id;
    console.log("[SUBSCRIPTION WEBHOOK] Activating plan:", { recurring_plan_id, reference_id: subRefId, status, subscription });

    const updateFields: string[] = [
        "payment_status = 'paid'",
        "subscription_status = 'active'",
        "is_active = 1"
    ];
    const params: any[] = [];
    const conditions: string[] = [];

    if (recurring_plan_id) {
        updateFields.push("recurring_plan_id = ?");
        params.push(recurring_plan_id);
    }

    if (subRefId) {
        conditions.push("request_reference_number = ?");
        params.push(subRefId);
    }

    if (conditions.length === 0) {
        return { processed: false, message: "No identifier provided" };
    }

    if (recurring_plan_id) {
        conditions.push("recurring_plan_id = ?");
        params.push(recurring_plan_id);
    }

    await conn.execute(
        `UPDATE Subscription SET ${updateFields.join(", ")} WHERE ${conditions.join(" OR ")}`,
        params
    );

    return { processed: true, message: "Plan activated", recurring_plan_id };
}

async function handleSessionCompleted(conn: mysql.Connection, data: any) {
    const { payment_session_id, customer_id, reference_id, status } = data;
    console.log("[SUBSCRIPTION WEBHOOK] Session completed:", { payment_session_id, customer_id, reference_id, status });

    const conditions: string[] = [];
    const params: any[] = [];

    if (payment_session_id) {
        conditions.push("payment_session_id = ?");
        params.push(payment_session_id);
    }

    if (reference_id) {
        conditions.push("request_reference_number = ?");
        params.push(reference_id);
    }

    if (conditions.length > 0) {
        await conn.execute(
            `UPDATE Subscription SET ${conditions.map(c => `payment_session_id = COALESCE(?, ${c.split(' = ')[1]})`).join(", ")} WHERE ${conditions.join(" OR ")}`,
            [payment_session_id || null, ...params]
        );
    }

    return { processed: true, message: "Session completed recorded", payment_session_id };
}

async function handlePlanInactivated(conn: mysql.Connection, data: any) {
    const { recurring_plan_id, reason } = data;
    console.log("[SUBSCRIPTION WEBHOOK] Plan inactivated:", { recurring_plan_id, reason });

    await conn.execute(
        `UPDATE Subscription
         SET is_active = 0,
             subscription_status = 'cancelled'
         WHERE recurring_plan_id = ?`,
        [recurring_plan_id || null]
    );

    return { processed: true, message: "Plan inactivated", recurring_plan_id };
}

async function handlePaymentTokenActivated(conn: mysql.Connection, data: any) {
    const { payment_token_id, customer_id, recurring_plan_id } = data;
    console.log("[SUBSCRIPTION WEBHOOK] Payment token activated:", { payment_token_id, recurring_plan_id });

    await conn.execute(
        `UPDATE Landlord
         SET payment_token_id = COALESCE(?, payment_token_id),
             payment_method_type = COALESCE('CARDS', payment_method_type)
         WHERE xendit_customer_id = ?`,
        [payment_token_id || null, customer_id]
    );

    if (recurring_plan_id) {
        await conn.execute(
            `UPDATE Subscription
             SET payment_token_id = ?,
                 recurring_plan_id = COALESCE(?, recurring_plan_id)
             WHERE recurring_plan_id = ?`,
            [payment_token_id || null, recurring_plan_id || null, recurring_plan_id]
        );
    }

    return { processed: true, message: "Payment token recorded", payment_token_id };
}

async function handleCycleSucceeded(conn: mysql.Connection, data: any) {
    const { recurring_plan_id, cycle_number, amount, paid_at, action_id, reference_id } = data;
    console.log("[SUBSCRIPTION WEBHOOK] Cycle succeeded:", { recurring_plan_id, cycle_number, amount, paid_at });

    if (recurring_plan_id) {
        await conn.execute(
            `UPDATE Subscription
             SET last_payment_date = ?,
                 payment_status = 'paid',
                 subscription_status = 'active',
                 is_active = 1
             WHERE recurring_plan_id = ?`,
            [paid_at ? new Date(paid_at) : null, recurring_plan_id]
        );
    }

    return { processed: true, message: "Cycle succeeded recorded", cycle_number };
}

async function handleCycleCreated(conn: mysql.Connection, data: any) {
    const { recurring_plan_id, cycle_number, amount, due_date, reference_id, schedule_timestamp } = data;
    console.log("[SUBSCRIPTION WEBHOOK] Cycle created:", { recurring_plan_id, cycle_number, amount, due_date, reference_id });

    const updateDate = due_date || schedule_timestamp;

    if (recurring_plan_id) {
        await conn.execute(
            `UPDATE Subscription
             SET next_billing_date = ?,
                 payment_status = 'pending'
             WHERE recurring_plan_id = ?`,
            [updateDate ? new Date(updateDate) : null, recurring_plan_id]
        );
    }

    if (reference_id) {
        await conn.execute(
            `UPDATE Subscription
             SET next_billing_date = ?,
                 payment_status = 'pending'
             WHERE request_reference_number = ?`,
            [updateDate ? new Date(updateDate) : null, reference_id]
        );
    }

    return { processed: true, message: "Cycle created recorded", cycle_number };
}

async function handleCycleRetrying(conn: mysql.Connection, data: any) {
    const { recurring_plan_id, cycle_number, next_retry_timestamp, failure_reason } = data;
    console.log("[SUBSCRIPTION WEBHOOK] Cycle retrying:", { recurring_plan_id, cycle_number, next_retry_timestamp, failure_reason });

    await conn.execute(
        `UPDATE Subscription
         SET payment_status = 'failed',
             subscription_status = 'past_due',
             next_billing_date = ?
         WHERE recurring_plan_id = ?`,
        [next_retry_timestamp ? new Date(next_retry_timestamp) : null, recurring_plan_id || null]
    );

    return { processed: true, message: "Cycle retry scheduled", cycle_number };
}

async function handleCycleFailed(conn: mysql.Connection, data: any) {
    const { recurring_plan_id, cycle_number, failure_reason } = data;
    console.log("[SUBSCRIPTION WEBHOOK] Cycle failed:", { recurring_plan_id, cycle_number, failure_reason });

    await conn.execute(
        `UPDATE Subscription
         SET payment_status = 'failed',
             subscription_status = 'past_due'
         WHERE recurring_plan_id = ?`,
        [recurring_plan_id || null]
    );

    return { processed: true, message: "Cycle failure recorded", cycle_number };
}

/* -------------------------------------------------------------------------- */
/* WEBHOOK HANDLER                                                             */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
    let conn: mysql.Connection | null = null;

    try {
        const token = req.headers.get("x-callback-token");

        if (!token || token !== XENDIT_TEXT_WEBHOOK_TOKEN) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const payload = await req.json();
        const eventType = payload.event;

        console.log("[SUBSCRIPTION WEBHOOK] Received event:", eventType, payload);

        conn = await getDbConnection();
        await conn.beginTransaction();

        let response: any;

        switch (eventType) {
            case "recurring_plan.activated":
            case "recurring.plan.activated":
                response = await handlePlanActivation(conn, payload.data || payload);
                break;

            case "payment_token.activation":
            case "payment_token.activated":
                response = await handlePaymentTokenActivated(conn, payload.data || payload);
                break;

            case "payment_session.completed":
                response = await handleSessionCompleted(conn, payload.data || payload);
                break;

            case "recurring_plan.inactivated":
            case "recurring.plan.inactivated":
                response = await handlePlanInactivated(conn, payload.data || payload);
                break;

            case "recurring.cycle.created":
                response = await handleCycleCreated(conn, payload.data || payload);
                break;

            case "recurring.cycle.retrying":
                response = await handleCycleRetrying(conn, payload.data || payload);
                break;

            case "recurring.cycle.failed":
                response = await handleCycleFailed(conn, payload.data || payload);
                break;

            case "recurring.cycle.succeeded":
                response = await handleCycleSucceeded(conn, payload.data || payload);
                break;

            default:
                console.log("[SUBSCRIPTION WEBHOOK] Ignored event type:", eventType);
                await conn.commit();
                return NextResponse.json({ message: "Ignored event type", event: eventType });
        }

        await conn.commit();

        return NextResponse.json({
            message: response.message || "Event processed successfully",
            event: eventType,
            ...response,
        });

    } catch (err: any) {
        if (conn) await conn.rollback();

        console.error("[SUBSCRIPTION WEBHOOK] Error:", err.message);

        return NextResponse.json(
            { message: "Webhook failed", error: err.message },
            { status: 500 }
        );
    } finally {
        if (conn) await conn.end();
    }
}