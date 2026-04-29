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
    const { recurring_plan_id, customer_id, payment_session_id, reference_id, status, subscription, amount } = data;
    const subRefId = subscription?.reference_id || reference_id;
    const amountPaid = subscription?.amount || amount;
    console.log("[SUBSCRIPTION WEBHOOK] Activating plan:", { recurring_plan_id, reference_id: subRefId, status, subscription });

    if (!recurring_plan_id && !subRefId) {
        return { processed: false, message: "No identifier provided" };
    }

    // Build conditions
    const conditions: string[] = [];
    const params: any[] = [];

    if (recurring_plan_id) {
        conditions.push("recurring_plan_id = ?");
        params.push(recurring_plan_id);
    }

    if (subRefId) {
        conditions.push("request_reference_number = ?");
        params.push(subRefId);
    }

    const whereClause = conditions.join(" OR ");

    // Get subscription_id for payment record
    const [subs] = await conn.execute(
        `SELECT subscription_id, landlord_id FROM Subscription WHERE ${whereClause} LIMIT 1`,
        params
    ) as any;

    if (subs.length > 0) {
        const sub = subs[0];

        // Update subscription status
        if (recurring_plan_id) {
            await conn.execute(
                `UPDATE Subscription SET recurring_plan_id = ?, payment_status = 'paid', subscription_status = 'active', is_active = 1 WHERE subscription_id = ?`,
                [recurring_plan_id, sub.subscription_id]
            );
        } else {
            await conn.execute(
                `UPDATE Subscription SET payment_status = 'paid', subscription_status = 'active', is_active = 1 WHERE subscription_id = ?`,
                [sub.subscription_id]
            );
        }

        // Insert payment record as paid
        await conn.execute(
            `INSERT INTO SubscriptionPayment (subscription_id, landlord_id, amount, status, paid_at, raw_payload)
             VALUES (?, ?, ?, 'paid', NOW(), ?)`,
            [sub.subscription_id, sub.landlord_id, amountPaid || 0, JSON.stringify(data)]
        );
    }

    return { processed: true, message: "Plan activated", recurring_plan_id };
}

async function handleSessionCompleted(conn: mysql.Connection, data: any) {
    const { payment_session_id, customer_id, reference_id, status, amount } = data;
    console.log("[SUBSCRIPTION WEBHOOK] Session completed:", { payment_session_id, customer_id, reference_id, status });

    if (!payment_session_id && !reference_id) {
        return { processed: false, message: "No identifier provided" };
    }

    // Build conditions and params for SELECT/UPDATE
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

    const whereClause = conditions.join(" OR ");

    // Get subscription for payment record
    const [subs] = await conn.execute(
        `SELECT subscription_id, landlord_id FROM Subscription WHERE ${whereClause} LIMIT 1`,
        params
    ) as any;

    if (subs.length > 0) {
        const sub = subs[0];

        // Update session ID if payment_session_id provided
        if (payment_session_id) {
            await conn.execute(
                `UPDATE Subscription SET payment_session_id = ? WHERE subscription_id = ?`,
                [payment_session_id, sub.subscription_id]
            );
        }

        // If payment_session.completed indicates successful payment, record it
        if (status === "COMPLETED" || status === "SUCCESS" || status === "PAID") {
            await conn.execute(
                `UPDATE Subscription SET payment_status = 'paid', subscription_status = 'active', is_active = 1 WHERE subscription_id = ?`,
                [sub.subscription_id]
            );

            await conn.execute(
                `INSERT INTO SubscriptionPayment (subscription_id, landlord_id, xendit_invoice_id, amount, status, paid_at, raw_payload)
                 VALUES (?, ?, ?, ?, 'paid', NOW(), ?)`,
                [sub.subscription_id, sub.landlord_id, payment_session_id, amount || 0, JSON.stringify(data)]
            );
        }
    }

    return { processed: true, message: "Session completed recorded", payment_session_id };
}

async function handlePlanInactivated(conn: mysql.Connection, data: any) {
    const { recurring_plan_id, reason } = data;
    console.log("[SUBSCRIPTION WEBHOOK] Plan inactivated:", { recurring_plan_id, reason });

    await conn.execute(
        `UPDATE Subscription
         SET is_active = 0,
             subscription_status = 'cancelled',
             cancelled_at = NOW(),
             raw_xendit_payload = ?
         WHERE recurring_plan_id = ?`,
        [JSON.stringify(data), recurring_plan_id || null]
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
                 recurring_plan_id = COALESCE(?, recurring_plan_id),
                 raw_xendit_payload = COALESCE(raw_xendit_payload, ?)
             WHERE recurring_plan_id = ?`,
            [payment_token_id || null, recurring_plan_id || null, JSON.stringify(data), recurring_plan_id]
        );
    }

    return { processed: true, message: "Payment token recorded", payment_token_id };
}

async function handleCycleSucceeded(conn: mysql.Connection, data: any) {
    const { recurring_plan_id, cycle_number, amount, paid_at, action_id, reference_id, subscription } = data;
    const subRefId = subscription?.reference_id || reference_id;
    console.log("[SUBSCRIPTION WEBHOOK] Cycle succeeded:", { recurring_plan_id, cycle_number, amount, paid_at });

    // Get subscription
    let subId: number | null = null;
    let landlordId: string | null = null;

    if (recurring_plan_id) {
        const [subs] = await conn.execute(
            `SELECT subscription_id, landlord_id FROM Subscription WHERE recurring_plan_id = ? LIMIT 1`,
            [recurring_plan_id]
        ) as any;
        if (subs.length > 0) {
            subId = subs[0].subscription_id;
            landlordId = subs[0].landlord_id;
        }
    } else if (subRefId) {
        const [subs] = await conn.execute(
            `SELECT subscription_id, landlord_id FROM Subscription WHERE request_reference_number = ? LIMIT 1`,
            [subRefId]
        ) as any;
        if (subs.length > 0) {
            subId = subs[0].subscription_id;
            landlordId = subs[0].landlord_id;
        }
    }

    // Update subscription
    if (subId) {
        await conn.execute(
            `UPDATE Subscription
             SET last_payment_date = ?,
                 payment_status = 'paid',
                 subscription_status = 'active',
                 is_active = 1,
                 amount_paid = COALESCE(amount_paid, 0) + ?,
                 raw_xendit_payload = ?
             WHERE subscription_id = ?`,
            [paid_at ? new Date(paid_at) : new Date(), amount || 0, JSON.stringify(data), subId]
        );

        // Insert payment record
        await conn.execute(
            `INSERT INTO SubscriptionPayment (subscription_id, landlord_id, amount, status, paid_at, raw_payload)
             VALUES (?, ?, ?, 'paid', ?, ?)`,
            [subId, landlordId, amount || 0, paid_at ? new Date(paid_at) : new Date(), JSON.stringify(data)]
        );
    }

    return { processed: true, message: "Cycle succeeded recorded", cycle_number };
}

async function handleCycleCreated(conn: mysql.Connection, data: any) {
    const { recurring_plan_id, cycle_number, amount, due_date, reference_id, schedule_timestamp, subscription } = data;
    const subRefId = subscription?.reference_id || reference_id;
    console.log("[SUBSCRIPTION WEBHOOK] Cycle created:", { recurring_plan_id, cycle_number, amount, due_date, reference_id });

    const updateDate = due_date || schedule_timestamp;

    if (recurring_plan_id) {
        await conn.execute(
            `UPDATE Subscription
             SET next_billing_date = ?,
                 payment_status = 'pending',
                 raw_xendit_payload = COALESCE(raw_xendit_payload, ?)
             WHERE recurring_plan_id = ?`,
            [updateDate ? new Date(updateDate) : null, JSON.stringify(data), recurring_plan_id]
        );
    } else if (subRefId) {
        await conn.execute(
            `UPDATE Subscription
             SET next_billing_date = ?,
                 payment_status = 'pending',
                 raw_xendit_payload = COALESCE(raw_xendit_payload, ?)
             WHERE request_reference_number = ?`,
            [updateDate ? new Date(updateDate) : null, JSON.stringify(data), subRefId]
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
             next_billing_date = ?,
             raw_xendit_payload = ?
         WHERE recurring_plan_id = ?`,
        [next_retry_timestamp ? new Date(next_retry_timestamp) : null, JSON.stringify(data), recurring_plan_id || null]
    );

    return { processed: true, message: "Cycle retry scheduled", cycle_number };
}

async function handleCycleFailed(conn: mysql.Connection, data: any) {
    const { recurring_plan_id, cycle_number, failure_reason } = data;
    console.log("[SUBSCRIPTION WEBHOOK] Cycle failed:", { recurring_plan_id, cycle_number, failure_reason });

    // Get subscription for payment record
    let subId: number | null = null;
    let landlordId: string | null = null;

    if (recurring_plan_id) {
        const [subs] = await conn.execute(
            `SELECT subscription_id, landlord_id FROM Subscription WHERE recurring_plan_id = ? LIMIT 1`,
            [recurring_plan_id]
        ) as any;
        if (subs.length > 0) {
            subId = subs[0].subscription_id;
            landlordId = subs[0].landlord_id;
        }
    }

    await conn.execute(
        `UPDATE Subscription
         SET payment_status = 'failed',
             subscription_status = 'past_due',
             raw_xendit_payload = ?
         WHERE recurring_plan_id = ?`,
        [JSON.stringify(data), recurring_plan_id || null]
    );

    // Record failed payment
    if (subId && landlordId) {
        await conn.execute(
            `INSERT INTO SubscriptionPayment (subscription_id, landlord_id, amount, status, raw_payload)
             VALUES (?, ?, 0, 'failed', ?)`,
            [subId, landlordId, JSON.stringify(data)]
        );
    }

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