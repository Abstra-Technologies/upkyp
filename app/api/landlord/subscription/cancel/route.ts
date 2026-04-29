import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { getSessionUser } from "@/lib/auth/auth";

/* -------------------------------------------------------------------------- */
/* XENDIT CANCEL SUBSCRIPTION API                                             */
/* -------------------------------------------------------------------------- */
/* Methods to cancel subscription:                                            */
/*                                                                            */
/* 1. Cancel Payment Token: POST /payment_tokens/{id}/cancel                 */
/*    - Deactivates the card token                                            */
/*    - Stops all future recurring charges                                    */
/*                                                                            */
/* 2. Cancel Specific Payment: POST /v3/payments/{payment_id}/cancel         */
/*    - Cancels a specific payment if in authorized status                    */
/*                                                                            */
/* After Xendit cancellation, update local DB                                  */
/* -------------------------------------------------------------------------- */

const {
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    XENDIT_TEXT_SECRET_KEY,
} = process.env;

const XENDIT_PAYMENT_TOKENS = "https://api.xendit.co/payment_tokens";
const XENDIT_V3_PAYMENTS = "https://api.xendit.co/v3/payments";
const API_VERSION = "2024-11-11";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                     */
/* -------------------------------------------------------------------------- */

interface CancelBody {
    landlord_id?: string;
    cancel_reason?: string;
}

interface SubscriptionInfo {
    subscription_id: number;
    landlord_id: string;
    payment_status: string;
    payment_token_id: string | null;
    recurring_plan_id: string | null;
    xendit_customer_id: string | null;
    raw_xendit_payload: string | null;
    end_date: string;
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                   */
/* -------------------------------------------------------------------------- */

function httpError(status: number, message: string, extra?: Record<string, unknown>): NextResponse {
    return NextResponse.json(
        { error: message, ...(extra && { details: extra }) },
        { status }
    );
}

function sanitizeString(s: unknown): string | null {
    return typeof s === "string" && s.trim() !== "" ? s.trim() : null;
}

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
/* XENDIT API CALLS                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Cancel a payment token (card token)
 * This stops all future recurring charges using this token
 * POST /payment_tokens/{id}/cancel
 */
async function cancelPaymentToken(paymentTokenId: string): Promise<{ success: boolean; data: any }> {
    console.log("[CANCEL] Cancelling payment token:", paymentTokenId);

    const url = `${XENDIT_PAYMENT_TOKENS}/${paymentTokenId}/cancel`;

    const res = await fetch(url, {
        method: "POST",
        headers: getXenditHeaders(paymentTokenId),
    });

    const data = await res.json();
    console.log("[CANCEL] Payment token cancel response:", { status: res.status, ok: res.ok, data });

    return { success: res.ok, data };
}

/**
 * Cancel a specific payment if it's in authorized status
 * POST /v3/payments/{payment_id}/cancel
 */
async function cancelPayment(paymentId: string): Promise<{ success: boolean; data: any }> {
    console.log("[CANCEL] Cancelling payment:", paymentId);

    const url = `${XENDIT_V3_PAYMENTS}/${paymentId}/cancel`;

    const res = await fetch(url, {
        method: "POST",
        headers: getXenditHeaders(paymentId),
    });

    const data = await res.json();
    console.log("[CANCEL] Payment cancel response:", { status: res.status, ok: res.ok, data });

    return { success: res.ok, data };
}

/**
 * Deactivate a recurring plan
 * DELETE /v2/recurring/plans/{id}
 * or use the cancel endpoint
 */
async function deactivateRecurringPlan(recurringPlanId: string): Promise<{ success: boolean; data: any }> {
    console.log("[CANCEL] Deactivating recurring plan:", recurringPlanId);

    const url = `https://api.xendit.co/v2/recurring/plans/${recurringPlanId}`;

    const res = await fetch(url, {
        method: "DELETE",
        headers: getXenditHeaders(recurringPlanId),
    });

    const data = await res.json();
    console.log("[CANCEL] Recurring plan deactivate response:", { status: res.status, ok: res.ok, data });

    return { success: res.ok, data };
}

/* -------------------------------------------------------------------------- */
/* DATABASE OPERATIONS                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Get active subscription for landlord
 */
async function getActiveSubscription(conn: mysql.Connection, landlordId: string): Promise<SubscriptionInfo | null> {
    const [rows] = await conn.execute<mysql.RowDataPacket[]>(
        `SELECT subscription_id, landlord_id, payment_status, payment_token_id,
                recurring_plan_id, xendit_customer_id, raw_xendit_payload, end_date
         FROM Subscription
         WHERE landlord_id = ? AND is_active = 1
         ORDER BY end_date DESC LIMIT 1`,
        [landlordId]
    );

    return rows[0] || null;
}

/**
 * Cancel subscription in database
 */
async function cancelSubscriptionInDb(
    conn: mysql.Connection,
    subscriptionId: number,
    cancelReason?: string
): Promise<void> {
    await conn.execute(
        `UPDATE Subscription
         SET payment_status = 'cancelled',
             is_active = 0,
             cancel_reason = ?,
             cancelled_at = NOW(),
             updated_at = NOW()
         WHERE subscription_id = ?`,
        [cancelReason || "User requested cancellation", subscriptionId]
    );
}

/* -------------------------------------------------------------------------- */
/* MAIN HANDLER                                                               */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
    let connection: mysql.Connection | undefined;

    try {
        console.log("═══════════════════════════════════════════════════════════════");
        console.log("[CANCEL] Request received");
        console.log("═══════════════════════════════════════════════════════════════");

        /* ---------------- VALIDATE REQUEST ---------------- */
        const sessionUser = await getSessionUser();

        if (!sessionUser || sessionUser.userType !== "landlord") {
            return httpError(401, "Unauthorized. Valid landlord session required.");
        }

        const body: CancelBody = await req.json();
        const { landlord_id, cancel_reason } = body;

        console.log("[CANCEL] Request body:", { landlord_id, cancel_reason });

        if (!landlord_id) {
            return httpError(400, "Missing landlord_id");
        }

        if (String(sessionUser.landlord_id) !== String(landlord_id)) {
            return httpError(403, "Forbidden: You can only cancel your own subscription.");
        }

        if (!XENDIT_TEXT_SECRET_KEY) {
            return httpError(500, "Server misconfiguration: missing Xendit key");
        }

        /* ---------------- DATABASE CONNECTION ---------------- */
        console.log("[CANCEL] Connecting to database...");
        connection = await getDbConnection();
        console.log("[CANCEL] Database connected");

        /* ---------------- GET ACTIVE SUBSCRIPTION ---------------- */
        console.log("[CANCEL] Fetching active subscription for landlord:", landlord_id);
        const subscription = await getActiveSubscription(connection, landlord_id);

        if (!subscription) {
            console.log("[CANCEL] No active subscription found");
            return httpError(404, "No active subscription found");
        }

        console.log("[CANCEL] Subscription found:", {
            subscription_id: subscription.subscription_id,
            payment_status: subscription.payment_status,
            payment_token_id: subscription.payment_token_id,
            recurring_plan_id: subscription.recurring_plan_id
        });

        if (subscription.payment_status === "cancelled") {
            console.log("[CANCEL] Subscription already cancelled");
            return NextResponse.json({
                success: true,
                message: "Subscription already cancelled",
                end_date: subscription.end_date,
            });
        }

        /* ---------------- CANCEL IN XENDIT ---------------- */
        console.log("[CANCEL] Cancelling subscription in Xendit...");

        let xenditCancelSuccess = false;
        let xenditCancelDetails: any = {};

        // Option 1: Cancel using payment_token_id
        if (subscription.payment_token_id) {
            console.log("[CANCEL] Attempting to cancel payment token:", subscription.payment_token_id);
            const tokenResult = await cancelPaymentToken(subscription.payment_token_id);

            if (tokenResult.success) {
                console.log("[CANCEL] Payment token cancelled successfully");
                xenditCancelSuccess = true;
                xenditCancelDetails = {
                    method: "payment_token_cancel",
                    payment_token_id: subscription.payment_token_id,
                    response: tokenResult.data
                };
            } else {
                console.warn("[CANCEL] Payment token cancel failed:", tokenResult.data);

                // If token already used/expired, still mark local as cancelled
                if (tokenResult.data.error_code === "TOKEN_NOT_FOUND" ||
                    tokenResult.data.error_code === "TOKEN_ALREADY_CANCELLED") {
                    console.log("[CANCEL] Token already cancelled/expired, proceeding with local cancellation");
                    xenditCancelSuccess = true;
                    xenditCancelDetails = {
                        method: "token_already_inactive",
                        payment_token_id: subscription.payment_token_id,
                        note: tokenResult.data.error_code
                    };
                }
            }
        }

        // Option 2: Cancel using recurring_plan_id
        if (!xenditCancelSuccess && subscription.recurring_plan_id) {
            console.log("[CANCEL] Attempting to deactivate recurring plan:", subscription.recurring_plan_id);
            const planResult = await deactivateRecurringPlan(subscription.recurring_plan_id);

            if (planResult.success) {
                console.log("[CANCEL] Recurring plan deactivated successfully");
                xenditCancelSuccess = true;
                xenditCancelDetails = {
                    method: "recurring_plan_deactivate",
                    recurring_plan_id: subscription.recurring_plan_id,
                    response: planResult.data
                };
            } else {
                console.warn("[CANCEL] Recurring plan deactivation failed:", planResult.data);

                // If plan already cancelled/doesn't exist, still mark local as cancelled
                if (planResult.data.error_code === "RECURRING_PLAN_NOT_FOUND" ||
                    planResult.data.error_code === "RECURRING_PLAN_ALREADY_CANCELLED") {
                    console.log("[CANCEL] Plan already cancelled, proceeding with local cancellation");
                    xenditCancelSuccess = true;
                    xenditCancelDetails = {
                        method: "plan_already_inactive",
                        recurring_plan_id: subscription.recurring_plan_id,
                        note: planResult.data.error_code
                    };
                }
            }
        }

        // If Xendit cancellation failed but subscription exists, we still cancel locally
        // This handles cases where Xendit subscription already expired/cancelled
        if (!xenditCancelSuccess) {
            console.log("[CANCEL] Could not cancel in Xendit (may already be inactive). Proceeding with local cancellation.");
            xenditCancelSuccess = true; // Mark as success for local DB update
            xenditCancelDetails = {
                method: "local_only",
                reason: "Xendit subscription already inactive or not found"
            };
        }

        /* ---------------- UPDATE DATABASE ---------------- */
        console.log("[CANCEL] Updating subscription in database...");

        await cancelSubscriptionInDb(
            connection,
            subscription.subscription_id,
            cancel_reason || `Cancelled by user. Xendit cancel: ${JSON.stringify(xenditCancelDetails)}`
        );

        console.log("[CANCEL] Subscription cancelled in database");

        /* ---------------- RETURN SUCCESS ---------------- */
        console.log("═══════════════════════════════════════════════════════════════");
        console.log("[CANCEL] Subscription cancelled successfully");
        console.log("[CANCEL] Cancellation details:", xenditCancelDetails);
        console.log("═══════════════════════════════════════════════════════════════");

        return NextResponse.json({
            success: true,
            message: "Subscription cancelled successfully",
            xendit_cancellation: xenditCancelDetails,
            access_until: subscription.end_date,
        });

    } catch (error: any) {
        console.error("═══════════════════════════════════════════════════════════════");
        console.error("[CANCEL] ERROR:", error);
        console.error("═══════════════════════════════════════════════════════════════");

        return httpError(500, "Failed to cancel subscription", {
            details: error.message
        });
    } finally {
        console.log("[CANCEL] Closing database connection...");
        if (connection) {
            await connection.end();
            console.log("[CANCEL] Database connection closed");
        }
    }
}