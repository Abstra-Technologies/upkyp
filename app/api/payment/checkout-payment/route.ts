/* -------------------------------------------------------------------------- */
/* XENDIT USAGE-BASED SUBSCRIPTION CHECKOUT API                               */
/* -------------------------------------------------------------------------- */
/* Usage-based pricing with floor price + Pay and Save:                       */
/* - Immediate payment on checkout (first charge = floor price)               */
/* - Payment method is saved for future recurring charges                     */
/* - Each billing cycle: amount is calculated based on usage                  */
/* - Floor price = plan base price (minimum charge)                           */
/* - Update Cycle API sets the actual charge before cycle starts              */
/* -------------------------------------------------------------------------- */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { createXenditCustomer } from "@/lib/payments/xenditCustomer";

/* -------------------------------------------------------------------------- */
/* ENV & CONSTANTS                                                           */
/* -------------------------------------------------------------------------- */

const {
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    XENDIT_TEXT_SECRET_KEY,
    NEXT_PUBLIC_BASE_URL,
} = process.env;

const XENDIT_SESSIONS = "https://api.xendit.co/sessions";
const XENDIT_UPDATE_CYCLE = "https://api.xendit.co/v2/recurring/plans";
const CURRENCY = "PHP";
const COUNTRY = "PH";
const API_VERSION = "2024-11-11";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                   */
/* -------------------------------------------------------------------------- */

interface RedirectUrls {
    success: string;
    failure: string;
    cancel?: string;
}

interface CheckoutBody {
    landlord_id?: string;
    plan_code?: string;
    redirectUrl?: RedirectUrls;
    email?: string;
    firstName?: string;
    lastName?: string;
}

interface PlanInfo {
    plan_id: number;
    plan_code: string;
    name: string;
    price: number;
    billing_cycle: string;
    interval: "DAY" | "WEEK" | "MONTH" | "YEAR";
    intervalCount: number;
    totalRecurrence: number;
    isLifetime: boolean;
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

function getValidAnchorDate(): string {
    const now = new Date();
    const currentDay = now.getUTCDate();
    let anchorDay = currentDay >= 29 ? 28 : currentDay;

    const nextMonth = now.getUTCMonth() + 1;
    const nextYear = nextMonth > 11 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
    const adjustedMonth = nextMonth > 11 ? 0 : nextMonth;

    const anchorDate = new Date(Date.UTC(nextYear, adjustedMonth, anchorDay, 12, 0, 0, 0));
    return anchorDate.toISOString();
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
/* XENDIT API CALLS                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Create subscription session with immediate_payment: true (Pay and Save)
 * Customer is charged immediately (floor price) AND payment method is saved.
 * Future cycles will be usage-based via Update Cycle API.
 */
async function createSubscriptionSession(
    customerId: string,
    floorPrice: number,
    description: string,
    redirectUrls: RedirectUrls,
    referenceId: string,
    interval: string = "MONTH",
    intervalCount: number = 1,
    totalRecurrence: number = 100
) {
    const anchorDate = getValidAnchorDate();

    const payload = {
        reference_id: referenceId,
        customer_id: customerId,
        session_type: "SUBSCRIPTION" as const,
        subscription: {
            schedule: {
                interval: interval as "DAY" | "WEEK" | "MONTH" | "YEAR",
                interval_count: intervalCount,
                anchor_date: anchorDate,
                total_recurrence: totalRecurrence,
                retry_interval: "DAY" as const,
                retry_interval_count: 5,
                total_retry: 7,
                failed_attempt_notifications: [1, 3, 5],
            },
            immediate_payment: true,
            failed_cycle_action: "RESUME" as const,
        },
        currency: CURRENCY,
        amount: floorPrice,
        mode: "PAYMENT_LINK" as const,
        country: COUNTRY,
        locale: "en",
        description,
        success_return_url: redirectUrls.success,
        cancel_return_url: redirectUrls.cancel || redirectUrls.failure,
    };

    console.log("[CHECKOUT] Creating usage-based subscription (Pay and Save):", {
        referenceId,
        customerId,
        floorPrice,
        immediate_payment: true,
        anchor_date: anchorDate,
    });

    const res = await fetch(XENDIT_SESSIONS, {
        method: "POST",
        headers: getXenditHeaders(referenceId),
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
        console.error("[CHECKOUT] Xendit error:", JSON.stringify(data, null, 2));
        throw new Error(data.message || "Subscription session creation failed");
    }

    return data;
}

/**
 * Update cycle amount before the cycle starts.
 * Must be called BEFORE scheduled_timestamp of the cycle.
 * Sets the usage-based charge amount for the upcoming cycle.
 */
async function updateCycleAmount(
    recurringPlanId: string,
    cycleId: string,
    amount: number
) {
    const url = `${XENDIT_UPDATE_CYCLE}/${recurringPlanId}/cycles/${cycleId}`;

    const payload = {
        amount,
        currency: CURRENCY,
    };

    console.log("[CHECKOUT] Updating cycle amount:", {
        recurringPlanId,
        cycleId,
        amount,
        url,
    });

    const res = await fetch(url, {
        method: "PATCH",
        headers: getXenditHeaders(`update-cycle-${cycleId}-${Date.now()}`),
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
        console.error("[CHECKOUT] Update cycle error:", JSON.stringify(data, null, 2));
        throw new Error(data.message || "Failed to update cycle amount");
    }

    return data;
}

/* -------------------------------------------------------------------------- */
/* DATABASE OPERATIONS                                                       */
/* -------------------------------------------------------------------------- */

async function getOrCreateCustomer(
    conn: mysql.Connection,
    landlordId: string,
    email?: string,
    firstName?: string,
    lastName?: string
): Promise<string> {
    const [rows] = await conn.execute<mysql.RowDataPacket[]>(
        "SELECT xendit_customer_id FROM Landlord WHERE landlord_id = ? LIMIT 1",
        [landlordId]
    );

    const existingCustomerId = rows[0]?.xendit_customer_id;

    if (existingCustomerId && String(existingCustomerId).trim() !== "") {
        return String(existingCustomerId);
    }

    const newCustomerId = await createXenditCustomer({
        referenceId: `landlord-${landlordId}`,
        email,
        firstName,
        lastName,
        secretKey: XENDIT_TEXT_SECRET_KEY!,
    });

    await conn.execute(
        "UPDATE Landlord SET xendit_customer_id = ? WHERE landlord_id = ?",
        [newCustomerId, landlordId]
    );

    return newCustomerId;
}

async function getPlanByCode(conn: mysql.Connection, planCode: string): Promise<PlanInfo | null> {
    const [rows] = await conn.execute<mysql.RowDataPacket[]>(
        "SELECT plan_id, plan_code, name, price, billing_cycle FROM Plan WHERE plan_code = ? AND is_active = 1 LIMIT 1",
        [planCode]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    const isLifetime = row.billing_cycle === "lifetime";

    return {
        plan_id: row.plan_id,
        plan_code: row.plan_code,
        name: row.name,
        price: Number(row.price),
        billing_cycle: row.billing_cycle,
        interval: "MONTH",
        intervalCount: 1,
        totalRecurrence: isLifetime ? 1 : 100,
        isLifetime,
    };
}

async function saveSubscription(
    conn: mysql.Connection,
    landlordId: string,
    plan: PlanInfo,
    floorPrice: number,
    xenditData: Record<string, unknown>,
    referenceId: string
): Promise<number> {
    const startDate = new Date().toISOString().split("T")[0];
    const endDate = plan.isLifetime
        ? new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const xenditSubId = (xenditData as any).id || null;
    const paymentSessionId = (xenditData as any).payment_session_id || null;
    const recurringPlanId = (xenditData as any).recurring_plan_id || null;
    const customerId = (xenditData as any).customer_id || null;
    const paymentLinkUrl = (xenditData as any).payment_link_url || null;
    const expiresAt = (xenditData as any).expires_at || null;

    const [result] = await conn.execute<mysql.ResultSetHeader>(
        `INSERT INTO Subscription
        (landlord_id, plan_id, request_reference_number,
         xendit_subscription_id, payment_session_id, recurring_plan_id,
         customer_id, payment_link_url, expires_at,
         start_date, end_date, next_billing_date,
         payment_status, subscription_status, is_active, is_trial,
         amount_paid, raw_xendit_payload)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            landlordId,
            plan.plan_id,
            referenceId,
            xenditSubId,
            paymentSessionId,
            recurringPlanId,
            customerId,
            paymentLinkUrl,
            expiresAt,
            startDate,
            endDate,
            getValidAnchorDate(),
            "pending",
            "active",
            1,
            0,
            0,
            JSON.stringify(xenditData),
        ]
    );

    return result.insertId;
}

/* -------------------------------------------------------------------------- */
/* MAIN HANDLER                                                            */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
    let connection: mysql.Connection | undefined;

    try {
        console.log("[CHECKOUT] Usage-based subscription request received");

        const body: CheckoutBody = await req.json();

        const {
            landlord_id: rawLandlordId,
            plan_code,
            redirectUrl,
            email,
            firstName,
            lastName,
        } = body;

        const landlord_id = sanitizeString(rawLandlordId);

        if (!landlord_id) return httpError(400, "Missing or invalid landlord_id");
        if (!plan_code) return httpError(400, "Missing plan_code");
        if (!XENDIT_TEXT_SECRET_KEY) return httpError(500, "Server misconfiguration: missing Xendit key");

        const defaultRedirectUrls: RedirectUrls = {
            success: `${NEXT_PUBLIC_BASE_URL}/payment/subscriptionSuccess`,
            failure: `${NEXT_PUBLIC_BASE_URL}/payment/failure`,
            cancel: `${NEXT_PUBLIC_BASE_URL}/payment/cancelled`,
        };

        const finalRedirectUrls: RedirectUrls = redirectUrl || defaultRedirectUrls;

        connection = await getDbConnection();

        const plan = await getPlanByCode(connection, plan_code);
        if (!plan) return httpError(404, `Plan not found: ${plan_code}`);

        if (plan.isLifetime) {
            return httpError(400, "Lifetime plans cannot use usage-based billing");
        }

        const floorPrice = plan.price;

        const customerId = await getOrCreateCustomer(connection, landlord_id, email, firstName, lastName);
        const referenceId = `sub-${landlord_id}-${Date.now()}`;

        const sessionData = await createSubscriptionSession(
            customerId,
            floorPrice,
            `${plan.name} - Usage-Based Subscription`,
            finalRedirectUrls,
            referenceId,
            plan.interval,
            plan.intervalCount,
            plan.totalRecurrence
        );

        await saveSubscription(connection, landlord_id, plan, floorPrice, sessionData, referenceId);

        console.log("[CHECKOUT] Session created - immediate charge + payment method saved:", {
            payment_session_id: sessionData.payment_session_id,
            recurring_plan_id: sessionData.recurring_plan_id,
            floorPrice,
            payment_link_url: sessionData.payment_link_url,
        });

        return NextResponse.json({
            type: "subscription",
            checkoutUrl: sessionData.payment_link_url,
            paymentSessionId: sessionData.payment_session_id,
            recurringPlanId: sessionData.recurring_plan_id,
            customerId: sessionData.customer_id,
            referenceId,
            status: sessionData.status,
            floorPrice,
            message: "Pay and Save: You will be charged immediately (floor price). Payment method is saved for future usage-based billing.",
        });

    } catch (err: any) {
        console.error("[CHECKOUT] ERROR:", err.message);

        return httpError(
            500,
            err.message || "Payment initiation failed",
            { stack: process.env.NODE_ENV === "development" ? err.stack : undefined }
        );
    } finally {
        if (connection) await connection.end();
    }
}
