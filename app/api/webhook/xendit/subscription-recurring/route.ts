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
    console.log("[SUBSCRIPTION WEBHOOK] Activating plan:", { recurring_plan_id, reference_id, status });

    await conn.execute(
        `UPDATE Subscription
         SET payment_status = 'paid',
             subscription_status = 'active',
             is_active = 1,
             recurring_plan_id = COALESCE(?, recurring_plan_id),
             xendit_subscription_id = COALESCE(?, xendit_subscription_id)
         WHERE request_reference_number = ?`,
        [recurring_plan_id || null, recurring_plan_id || null, reference_id]
    );

    return { processed: true, message: "Plan activated", recurring_plan_id };
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

async function handleCyclePaid(conn: mysql.Connection, data: any) {
    const { recurring_plan_id, cycle_number, amount, paid_at, payment_id } = data;
    console.log("[SUBSCRIPTION WEBHOOK] Cycle paid:", { recurring_plan_id, cycle_number, amount });

    await conn.execute(
        `UPDATE Subscription
         SET last_payment_date = ?,
             payment_status = 'paid',
             subscription_status = 'active',
             is_active = 1
         WHERE recurring_plan_id = ?`,
        [paid_at ? new Date(paid_at) : null, recurring_plan_id]
    );

    if (recurring_plan_id && payment_id) {
        await conn.execute(
            `INSERT INTO SubscriptionPayment
             (subscription_id, landlord_id, xendit_payment_id, xendit_invoice_id, amount, status, paid_at, created_at)
             SELECT subscription_id, landlord_id, ?, NULL, ?, 'paid', ?, NOW()
             FROM Subscription WHERE recurring_plan_id = ?`,
            [payment_id, amount, paid_at ? new Date(paid_at) : null, recurring_plan_id]
        );
    }

    return { processed: true, message: "Cycle payment recorded", cycle_number };
}

async function handleCycleFailed(conn: mysql.Connection, data: any) {
    const { recurring_plan_id, cycle_number, reason } = data;
    console.log("[SUBSCRIPTION WEBHOOK] Cycle failed:", { recurring_plan_id, cycle_number, reason });

    await conn.execute(
        `UPDATE Subscription
         SET payment_status = 'failed',
             subscription_status = 'past_due'
         WHERE recurring_plan_id = ?`,
        [recurring_plan_id || null]
    );

    return { processed: true, message: "Cycle failure recorded", cycle_number };
}

async function handleCycleCreated(conn: mysql.Connection, data: any) {
    const { recurring_plan_id, cycle_number, amount, due_date } = data;
    console.log("[SUBSCRIPTION WEBHOOK] Cycle created:", { recurring_plan_id, cycle_number, amount, due_date });

    await conn.execute(
        `UPDATE Subscription
         SET next_billing_date = ?,
             payment_status = 'pending'
         WHERE recurring_plan_id = ?`,
        [due_date ? new Date(due_date) : null, recurring_plan_id || null]
    );

    return { processed: true, message: "Cycle created recorded", cycle_number };
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
            case "recurring.plan.activation":
            case "recurring_plan.activation":
                response = await handlePlanActivation(conn, payload.data || payload);
                break;

            case "payment_token.activated":
            case "payment_token.activation":
                response = await handlePaymentTokenActivated(conn, payload.data || payload);
                break;

            case "recurring.cycle.paid":
                response = await handleCyclePaid(conn, payload.data || payload);
                break;

            case "recurring.cycle.failed":
                response = await handleCycleFailed(conn, payload.data || payload);
                break;

            case "recurring.cycle.created":
                response = await handleCycleCreated(conn, payload.data || payload);
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