/* -------------------------------------------------------------------------- */
/* XENDIT USAGE-BASED SUBSCRIPTION WEBHOOK (Payment Request v3)               */
/* -------------------------------------------------------------------------- */
/* Handles usage-based billing with Recurring Automatic (no upfront charge):  */
/* - payment_token.activated: Payment method saved                            */
/* - recurring.plan.activated: Subscription activated                         */
/* - recurring.cycle.created: New cycle - calculate usage & update amount     */
/* - recurring.cycle.succeeded: Cycle payment succeeded                       */
/* - recurring.cycle.failed: Cycle payment failed                             */
/* - recurring.cycle.retrying: Cycle retrying                                 */
/* - recurring.plan.inactivated: Subscription cancelled                       */
/* -------------------------------------------------------------------------- */

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
    XENDIT_TEXT_SECRET_KEY,
} = process.env;

const XENDIT_UPDATE_CYCLE = "https://api.xendit.co/recurring/plans";
const CURRENCY = "PHP";
const API_VERSION = "2026-01-01";

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                     */
/* -------------------------------------------------------------------------- */

async function getDbConnection() {
    return mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
    });
}

function getXenditHeaders(idempotencyKey?: string): Record<string, string> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${XENDIT_TEXT_SECRET_KEY}:`).toString("base64"),
        "api-version": API_VERSION,
    };
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    return headers;
}

/* -------------------------------------------------------------------------- */
/* USAGE CALCULATION                                                           */
/* -------------------------------------------------------------------------- */

async function calculateUsageAndCharge(conn: mysql.Connection, landlordId: string, planId: number) {
    const [unitPriceRows]: any = await conn.execute(
        `SELECT property_type, unit_price FROM PlanUnitPriceByPropertyType WHERE plan_id = ?`,
        [planId]
    );

    const unitPricesByType: Record<string, number> = {};
    unitPriceRows.forEach((row: any) => {
        unitPricesByType[row.property_type] = Number(row.unit_price);
    });

    const [properties]: any = await conn.execute(
        `SELECT p.property_type, COUNT(u.unit_id) AS unit_count
         FROM Property p
         LEFT JOIN Unit u ON p.property_id = u.property_id
         WHERE p.landlord_id = ?
         GROUP BY p.property_type`,
        [landlordId]
    );

    let totalUnits = 0;
    let totalUnitCost = 0;
    const unitItems: { type: string; count: number; price: number; subtotal: number }[] = [];

    properties.forEach((row: any) => {
        const type = row.property_type || "residential";
        const count = Number(row.unit_count) || 0;
        const price = Number(unitPricesByType[type]) || 0;
        const subtotal = count * price;
        totalUnits += count;
        totalUnitCost += subtotal;
        unitItems.push({ type, count, price, subtotal });
    });

    const [planRows]: any = await conn.execute(
        `SELECT price FROM Plan WHERE plan_id = ? LIMIT 1`,
        [planId]
    );
    const floorPrice = planRows.length > 0 ? Number(planRows[0].price) : 0;
    const totalComputed = totalUnitCost;
    const finalCharge = Math.max(floorPrice, totalComputed);
    const chargeBasis = finalCharge === floorPrice ? "floor_price" : "unit_based";

    return { totalUnits, totalUnitCost, floorPrice, finalCharge, chargeBasis, unitItems };
}

async function updateCycleAmount(recurringPlanId: string, cycleId: string, amount: number) {
    const url = `${XENDIT_UPDATE_CYCLE}/${recurringPlanId}/cycles/${cycleId}`;
    const payload = { amount, currency: CURRENCY };

    console.log("[WEBHOOK] Updating cycle amount:", { recurringPlanId, cycleId, amount });

    const res = await fetch(url, {
        method: "PATCH",
        headers: getXenditHeaders(`update-cycle-${cycleId}-${Date.now()}`),
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
        console.error("[WEBHOOK] Update cycle error:", JSON.stringify(data, null, 2));
        throw new Error(data.message || "Failed to update cycle amount");
    }

    return data;
}

/* -------------------------------------------------------------------------- */
/* WEBHOOK HANDLERS                                                            */
/* -------------------------------------------------------------------------- */

/**
 * payment.capture.completed
 * Initial payment succeeded. Sets: payment_token_id, payment_status, last_payment_date, subscription_status
 */
async function handlePaymentCaptureCompleted(conn: mysql.Connection, data: any) {
    const {
        id,
        reference_id,
        customer_id,
        payment_request_id,
        payment_method_id,
        payment_method_type,
        card_last4,
        amount,
        currency,
        status,
    } = data;

    console.log("[WEBHOOK] Payment capture completed:", { id, reference_id, customer_id, amount, status });

    if (!customer_id) return { processed: false, message: "No customer_id provided" };

    // Update Landlord with payment method details
    const landlordUpdateFields: string[] = [];
    const landlordParams: any[] = [];

    if (payment_method_id) { landlordUpdateFields.push("payment_token_id = ?"); landlordParams.push(payment_method_id); }
    if (payment_method_type) { landlordUpdateFields.push("payment_method_type = ?"); landlordParams.push(payment_method_type); }
    if (card_last4) { landlordUpdateFields.push("payment_method_last4 = ?"); landlordParams.push(card_last4); }

    if (landlordUpdateFields.length > 0) {
        await conn.execute(
            `UPDATE Landlord SET ${landlordUpdateFields.join(", ")} WHERE xendit_customer_id = ?`,
            [...landlordParams, customer_id]
        );
    }

    // Find and update subscription
    if (reference_id) {
        const [subs] = await conn.execute(
            `SELECT subscription_id, landlord_id FROM Subscription WHERE request_reference_number = ? LIMIT 1`,
            [reference_id]
        ) as any;

        if (subs.length > 0) {
            const sub = subs[0];
            const paidDate = new Date();

            await conn.execute(
                `UPDATE Subscription
                 SET payment_status = 'paid',
                     subscription_status = 'active',
                     payment_token_id = COALESCE(?, payment_token_id),
                     last_payment_date = ?,
                     raw_xendit_payload = JSON_SET(COALESCE(raw_xendit_payload, '{}'), '$.payment_capture', ?)
                 WHERE subscription_id = ?`,
                [payment_method_id, paidDate, JSON.stringify(data), sub.subscription_id]
            );

            await conn.execute(
                `INSERT INTO SubscriptionPayment
                 (subscription_id, landlord_id, xendit_payment_id, xendit_invoice_id, amount, currency, status, paid_at, raw_payload)
                 VALUES (?, ?, ?, ?, ?, ?, 'paid', ?, ?)`,
                [sub.subscription_id, sub.landlord_id, payment_request_id || id, id, amount || 0, currency || "PHP", paidDate, JSON.stringify(data)]
            );

            console.log("[WEBHOOK] Initial payment processed:", { subscription_id: sub.subscription_id, amount });
        }
    }

    return { processed: true, message: "Payment capture recorded", payment_capture_id: id };
}

async function handlePaymentCaptureFailed(conn: mysql.Connection, data: any) {
    const { id, customer_id, failure_reason } = data;

    console.log("[WEBHOOK] Payment capture failed:", { id, customer_id, failure_reason });

    if (customer_id) {
        const [subs] = await conn.execute(
            `SELECT s.subscription_id FROM Subscription s
             JOIN Landlord l ON s.landlord_id = l.landlord_id
             WHERE l.xendit_customer_id = ? AND s.payment_status = 'pending'
             ORDER BY s.created_at DESC LIMIT 1`,
            [customer_id]
        ) as any;

        if (subs.length > 0) {
            await conn.execute(
                `UPDATE Subscription
                 SET payment_status = 'failed',
                     subscription_status = 'past_due',
                     raw_xendit_payload = JSON_SET(COALESCE(raw_xendit_payload, '{}'), '$.capture_failed', ?)
                 WHERE subscription_id = ?`,
                [JSON.stringify(data), subs[0].subscription_id]
            );
        }
    }

    return { processed: true, message: "Payment capture failure logged", failure_reason };
}

/**
 * recurring.plan.activated
 * Subscription activated after payment method linked.
 * Payload fields: id (recurring_plan_id), reference_id, customer_id, payment_tokens[], amount
 * Sets: recurring_plan_id, payment_token_id, subscription_status, anchor_day
 */
async function handlePlanActivation(conn: mysql.Connection, data: any) {
    const {
        id,
        customer_id,
        payment_session_id,
        reference_id,
        status,
        subscription,
        amount,
        payment_tokens,
    } = data;

    const recurringPlanId = id || null;
    const subRefId = subscription?.reference_id || reference_id;
    const paymentTokenId = payment_tokens?.[0]?.payment_token_id || null;

    // Extract anchor date from Xendit payload
    const xenditAnchorDate = subscription?.schedule?.anchor_date || data.schedule?.anchor_date;
    const anchorDayDate = xenditAnchorDate ? new Date(xenditAnchorDate).toISOString() : null;

    console.log("[WEBHOOK] Plan activated:", {
        recurring_plan_id: recurringPlanId,
        reference_id: subRefId,
        customer_id,
        payment_token_id: paymentTokenId,
        status,
        amount,
    });

    if (!recurringPlanId && !subRefId) return { processed: false, message: "No identifier provided" };

    const conditions: string[] = [];
    const params: any[] = [];

    if (recurringPlanId) { conditions.push("recurring_plan_id = ?"); params.push(recurringPlanId); }
    if (subRefId) { conditions.push("request_reference_number = ?"); params.push(subRefId); }

    const [subs] = await conn.execute(
        `SELECT subscription_id, landlord_id FROM Subscription WHERE ${conditions.join(" OR ")} LIMIT 1`,
        params
    ) as any;

    if (subs.length === 0) {
        console.log("[WEBHOOK] Subscription not found for activation:", { recurringPlanId, subRefId });
        return { processed: false, message: "Subscription not found" };
    }

    const sub = subs[0];

    // Update Landlord with payment token
    if (paymentTokenId && customer_id) {
        await conn.execute(
            `UPDATE Landlord
             SET payment_token_id = COALESCE(?, payment_token_id),
                 payment_method_type = COALESCE('CARDS', payment_method_type)
             WHERE xendit_customer_id = ?`,
            [paymentTokenId, customer_id]
        );
    }

    // Update Subscription with all fields
    await conn.execute(
        `UPDATE Subscription
         SET recurring_plan_id = COALESCE(?, recurring_plan_id),
             payment_token_id = COALESCE(?, payment_token_id),
             payment_status = 'paid',
             subscription_status = 'active',
             anchor_day = COALESCE(?, anchor_day),
             last_payment_date = COALESCE(last_payment_date, NOW()),
             raw_xendit_payload = JSON_SET(COALESCE(raw_xendit_payload, '{}'), '$.activation', ?)
         WHERE subscription_id = ?`,
        [recurringPlanId, paymentTokenId, anchorDayDate, JSON.stringify(data), sub.subscription_id]
    );

    console.log("[WEBHOOK] Plan activation processed:", {
        subscription_id: sub.subscription_id,
        recurring_plan_id: recurringPlanId,
        payment_token_id: paymentTokenId,
        amount,
    });

    return { processed: true, message: "Plan activated", recurring_plan_id: recurringPlanId, payment_token_id: paymentTokenId };
}

/**
 * payment_session.completed
 * Session completed. Sets: payment_status, subscription_status
 */
async function handleSessionCompleted(conn: mysql.Connection, data: any) {
    const { payment_session_id, customer_id, reference_id, status, amount } = data;

    console.log("[WEBHOOK] Session completed:", { payment_session_id, customer_id, reference_id, status });

    if (!reference_id) return { processed: false, message: "No reference_id provided" };

    const [subs] = await conn.execute(
        `SELECT subscription_id, landlord_id FROM Subscription WHERE request_reference_number = ? LIMIT 1`,
        [reference_id]
    ) as any;

    if (subs.length > 0) {
        const sub = subs[0];

        if (status === "COMPLETED" || status === "SUCCESS" || status === "PAID") {
            await conn.execute(
                `UPDATE Subscription
                 SET payment_status = 'paid',
                     subscription_status = 'active',
                     last_payment_date = COALESCE(last_payment_date, NOW()),
                     raw_xendit_payload = JSON_SET(COALESCE(raw_xendit_payload, '{}'), '$.session_completed', ?)
                 WHERE subscription_id = ?`,
                [JSON.stringify(data), sub.subscription_id]
            );
        }
    }

    return { processed: true, message: "Session completed recorded", payment_session_id };
}

/**
 * payment_token.activated
 * Payment method saved. Sets: payment_token_id on both Landlord and Subscription
 */
async function handlePaymentTokenActivated(conn: mysql.Connection, data: any) {
    const { payment_token_id, customer_id, recurring_plan_id, subscription, id } = data;

    const tokenId = payment_token_id || id || null;
    const planId = recurring_plan_id || null;
    const custId = customer_id || null;

    console.log("[WEBHOOK] Payment token activated:", { payment_token_id: tokenId, customer_id: custId, recurring_plan_id: planId });

    if (!tokenId) return { processed: false, message: "No payment_token_id provided" };

    // Update Landlord
    if (custId) {
        await conn.execute(
            `UPDATE Landlord
             SET payment_token_id = ?,
                 payment_method_type = COALESCE(payment_method_type, 'CARDS')
             WHERE xendit_customer_id = ?`,
            [tokenId, custId]
        );
    }

    // Update Subscription by recurring_plan_id
    if (planId) {
        await conn.execute(
            `UPDATE Subscription
             SET payment_token_id = ?,
                 recurring_plan_id = COALESCE(?, recurring_plan_id),
                 raw_xendit_payload = JSON_SET(COALESCE(raw_xendit_payload, '{}'), '$.token_activated', ?)
             WHERE recurring_plan_id = ?`,
            [tokenId, planId, JSON.stringify(data), planId]
        );
    }

    // Fallback: find by customer_id if no recurring_plan_id
    if (!planId && custId) {
        const [subs] = await conn.execute(
            `SELECT s.subscription_id FROM Subscription s
             JOIN Landlord l ON s.landlord_id = l.landlord_id
             WHERE l.xendit_customer_id = ? AND (s.payment_token_id IS NULL OR s.payment_token_id = '')
             ORDER BY s.created_at DESC LIMIT 1`,
            [custId]
        ) as any;

        if (subs.length > 0) {
            await conn.execute(
                `UPDATE Subscription
                 SET payment_token_id = ?,
                     raw_xendit_payload = JSON_SET(COALESCE(raw_xendit_payload, '{}'), '$.token_activated', ?)
                 WHERE subscription_id = ?`,
                [tokenId, JSON.stringify(data), subs[0].subscription_id]
            );
        }
    }

    return { processed: true, message: "Payment token recorded", payment_token_id: tokenId };
}

/**
 * recurring.plan.inactivated
 * Subscription cancelled. Sets: subscription_status, cancelled_at, cancel_reason
 */
async function handlePlanInactivated(conn: mysql.Connection, data: any) {
    const { recurring_plan_id, reason, id } = data;

    const planId = recurring_plan_id || id || null;

    console.log("[WEBHOOK] Plan inactivated:", { recurring_plan_id: planId, reason });

    if (planId) {
        await conn.execute(
            `UPDATE Subscription
             SET subscription_status = 'cancelled',
                 cancelled_at = NOW(),
                 cancel_reason = ?,
                 raw_xendit_payload = JSON_SET(COALESCE(raw_xendit_payload, '{}'), '$.inactivation', ?)
             WHERE recurring_plan_id = ?`,
            [reason || null, JSON.stringify(data), planId]
        );
    }

    return { processed: true, message: "Plan inactivated", recurring_plan_id: planId };
}

/**
 * recurring.cycle.created
 * New cycle starting. Calculate usage, update cycle amount, create snapshot.
 */
async function handleCycleCreated(conn: mysql.Connection, data: any) {
    const {
        recurring_plan_id,
        cycle_number,
        amount,
        due_date,
        reference_id,
        schedule_timestamp,
        subscription,
        id: cycle_id,
    } = data;
    const subRefId = subscription?.reference_id || reference_id;

    console.log("[WEBHOOK] Cycle created:", { recurring_plan_id, cycle_number, cycle_id, schedule_timestamp });

    const conditions: string[] = [];
    const params: any[] = [];

    if (recurring_plan_id) { conditions.push("recurring_plan_id = ?"); params.push(recurring_plan_id); }
    else if (subRefId) { conditions.push("request_reference_number = ?"); params.push(subRefId); }

    if (conditions.length === 0) return { processed: false, message: "No identifier" };

    const [subs] = await conn.execute(
        `SELECT subscription_id, landlord_id, plan_id FROM Subscription WHERE ${conditions.join(" OR ")} LIMIT 1`,
        params
    ) as any;

    if (subs.length === 0) return { processed: false, message: "Subscription not found" };

    const sub = subs[0];
    const updateDate = due_date || schedule_timestamp;

    // Calculate usage-based charge
    const usage = await calculateUsageAndCharge(conn, sub.landlord_id, sub.plan_id);

    // Update the cycle amount via Xendit API BEFORE the cycle starts
    if (recurring_plan_id && cycle_id) {
        try {
            await updateCycleAmount(recurring_plan_id, cycle_id, usage.finalCharge);
            console.log("[WEBHOOK] Cycle amount updated:", { cycle_id, amount: usage.finalCharge });
        } catch (err: any) {
            console.error("[WEBHOOK] Failed to update cycle amount:", err.message);
        }
    }

    // Create billing snapshot
    const billingMonth = updateDate ? new Date(updateDate) : new Date();
    const billingMonthStart = new Date(billingMonth.getFullYear(), billingMonth.getMonth(), 1);
    const billingMonthEnd = new Date(billingMonth.getFullYear(), billingMonth.getMonth() + 1, 0, 23, 59, 59);
    const billingMonthStr = billingMonthStart.toISOString().split("T")[0];

    const [existingSnapshot]: any = await conn.execute(
        `SELECT snapshot_id FROM SubscriptionMonthlyBillingSnapshot
         WHERE subscription_id = ? AND billing_month = ?`,
        [sub.subscription_id, billingMonthStr]
    );

    let snapshotId: number | null = null;

    if (existingSnapshot.length === 0) {
        const [snapResult] = await conn.execute<mysql.ResultSetHeader>(
            `INSERT INTO SubscriptionMonthlyBillingSnapshot
             (subscription_id, xendit_cycle_id, billing_month, billing_period_start, billing_period_end, cutoff_at,
              applied_floor_price, total_computed, final_charge, charge_basis, sync_status, synced_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', NOW())`,
            [
                sub.subscription_id,
                cycle_id || null,
                billingMonthStr,
                billingMonthStart.toISOString(),
                billingMonthEnd.toISOString(),
                new Date().toISOString(),
                usage.floorPrice,
                usage.totalUnitCost,
                usage.finalCharge,
                usage.chargeBasis,
            ]
        );
        snapshotId = (snapResult as any).insertId;

        for (const item of usage.unitItems) {
            await conn.execute(
                `INSERT INTO SubscriptionMonthlyBillingSnapshotItem
                 (snapshot_id, property_type, units_used, unit_price, computed_amount)
                 VALUES (?, ?, ?, ?, ?)`,
                [snapshotId, item.type, item.count, item.price, item.subtotal]
            );
        }
    } else {
        snapshotId = existingSnapshot[0].snapshot_id;
    }

    // Update subscription with cycle info
    await conn.execute(
        `UPDATE Subscription
         SET payment_status = 'pending',
             raw_xendit_payload = JSON_SET(COALESCE(raw_xendit_payload, '{}'), '$.next_cycle', ?)
         WHERE subscription_id = ?`,
        [JSON.stringify(data), sub.subscription_id]
    );

    console.log("[WEBHOOK] Cycle processed with usage:", {
        subId: sub.subscription_id,
        snapshotId,
        totalUnits: usage.totalUnits,
        floorPrice: usage.floorPrice,
        finalCharge: usage.finalCharge,
        chargeBasis: usage.chargeBasis,
    });

    return { processed: true, message: "Cycle created with usage-based charge", cycle_number, finalCharge: usage.finalCharge };
}

/**
 * recurring.cycle.succeeded
 * Cycle payment succeeded. Sets: last_payment_date, payment_status, subscription_status
 */
async function handleCycleSucceeded(conn: mysql.Connection, data: any) {
    const {
        recurring_plan_id,
        cycle_number,
        amount,
        paid_at,
        action_id,
        reference_id,
        subscription,
        id: cycle_id,
    } = data;
    const subRefId = subscription?.reference_id || reference_id;

    console.log("[WEBHOOK] Cycle succeeded:", { recurring_plan_id, cycle_number, amount, paid_at });

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

    if (subId && landlordId) {
        const paidDate = paid_at ? new Date(paid_at) : new Date();

        await conn.execute(
            `UPDATE Subscription
             SET last_payment_date = ?,
                 payment_status = 'paid',
                 subscription_status = 'active',
                 raw_xendit_payload = JSON_SET(COALESCE(raw_xendit_payload, '{}'), '$.last_cycle', ?)
             WHERE subscription_id = ?`,
            [paidDate, JSON.stringify(data), subId]
        );

        // Find or create snapshot for this billing month
        const billingMonth = new Date(paidDate.getFullYear(), paidDate.getMonth(), 1);
        const billingMonthStr = billingMonth.toISOString().split("T")[0];

        const [snapshotRows]: any = await conn.execute(
            `SELECT snapshot_id FROM SubscriptionMonthlyBillingSnapshot
             WHERE subscription_id = ? AND billing_month = ?`,
            [subId, billingMonthStr]
        );

        let snapshotId: number | null = null;

        if (snapshotRows.length > 0) {
            snapshotId = snapshotRows[0].snapshot_id;
            await conn.execute(
                `UPDATE SubscriptionMonthlyBillingSnapshot
                 SET xendit_cycle_id = COALESCE(?, xendit_cycle_id),
                     sync_status = 'synced',
                     synced_at = NOW()
                 WHERE snapshot_id = ?`,
                [cycle_id || null, snapshotId]
            );
        }

        await conn.execute(
            `INSERT INTO SubscriptionPayment
             (subscription_id, snapshot_id, landlord_id, xendit_payment_id, xendit_invoice_id, amount, currency, status, paid_at, raw_payload)
             VALUES (?, ?, ?, ?, ?, ?, 'PHP', 'paid', ?, ?)`,
            [subId, snapshotId, landlordId, action_id || cycle_id, cycle_id, amount || 0, paidDate, JSON.stringify(data)]
        );

        console.log("[WEBHOOK] Payment recorded:", { subId, snapshotId, amount });
    }

    return { processed: true, message: "Cycle succeeded recorded", cycle_number };
}

/**
 * recurring.cycle.failed
 * Cycle payment failed. Sets: payment_status, subscription_status
 */
async function handleCycleFailed(conn: mysql.Connection, data: any) {
    const { recurring_plan_id, cycle_number, failure_reason, id: cycle_id } = data;

    console.log("[WEBHOOK] Cycle failed:", { recurring_plan_id, cycle_number, failure_reason });

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
             raw_xendit_payload = JSON_SET(COALESCE(raw_xendit_payload, '{}'), '$.cycle_failed', ?)
         WHERE recurring_plan_id = ?`,
        [JSON.stringify(data), recurring_plan_id || null]
    );

    if (subId && landlordId) {
        await conn.execute(
            `INSERT INTO SubscriptionPayment
             (subscription_id, landlord_id, xendit_payment_id, amount, status, raw_payload)
             VALUES (?, ?, ?, 0, 'failed', ?)`,
            [subId, landlordId, cycle_id, JSON.stringify(data)]
        );
    }

    return { processed: true, message: "Cycle failure recorded", cycle_number };
}

/**
 * recurring.cycle.retrying
 * Cycle retrying. Sets: payment_status, subscription_status
 */
async function handleCycleRetrying(conn: mysql.Connection, data: any) {
    const { recurring_plan_id, cycle_number, next_retry_timestamp, failure_reason } = data;

    console.log("[WEBHOOK] Cycle retrying:", { recurring_plan_id, cycle_number, failure_reason });

    await conn.execute(
        `UPDATE Subscription
         SET payment_status = 'failed',
             subscription_status = 'past_due',
             raw_xendit_payload = JSON_SET(COALESCE(raw_xendit_payload, '{}'), '$.retry', ?)
         WHERE recurring_plan_id = ?`,
        [JSON.stringify(data), recurring_plan_id || null]
    );

    return { processed: true, message: "Cycle retry scheduled", cycle_number };
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

        console.log("[WEBHOOK] Received event:", eventType);

        conn = await getDbConnection();
        await conn.beginTransaction();

        let response: any;

        switch (eventType) {
            case "payment.capture.completed":
                response = await handlePaymentCaptureCompleted(conn, payload.data || payload);
                break;

            case "payment.capture.failed":
                response = await handlePaymentCaptureFailed(conn, payload.data || payload);
                break;

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
                console.log("[WEBHOOK] Ignored event type:", eventType);
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

        console.error("[WEBHOOK] Error:", err.message);

        return NextResponse.json(
            { message: "Webhook failed", error: err.message },
            { status: 500 }
        );
    } finally {
        if (conn) await conn.end();
    }
}
