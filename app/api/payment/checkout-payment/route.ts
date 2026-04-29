/* -------------------------------------------------------------------------- */
/* XENDIT SUBSCRIPTION CHECKOUT API                                           */
/* -------------------------------------------------------------------------- */
/* Per Xendit docs: https://docs.xendit.co/docs/fixed-amount-subscriptions   */
/*                                                                          */
/* Flow:                                                                    */
/* 1. POST /v2/sessions with session_type: "SUBSCRIPTION"                   */
/* 2. Returns payment_link_url → redirect user to Xendit hosted page        */
/* 3. User links payment method on Xendit page                              */
/* 4. Webhooks: payment_token.activated, recurring_plan.activated           */
/* 5. Xendit auto-processes recurring cycles                                */
/* -------------------------------------------------------------------------- */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { createXenditCustomer } from "@/lib/payments/xenditCustomer";
import { SUBSCRIPTION_PLANS } from "@/constant/subscription/subscriptionPlans";

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
const XENDIT_RECURRING_PLANS = "https://api.xendit.co/v2/recurring/plans";
const XENDIT_INVOICES = "https://api.xendit.co/v2/invoices";
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
    plan_code: string;
    redirectUrl?: RedirectUrls;
    email?: string;
    firstName?: string;
    lastName?: string;
    payment_token_id?: string;
    channel_code?: string;
}

interface PlanInfo {
    name: string;
    planCode: string;
    price: number;
    isLifetime?: boolean;
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

function getPlan(planCode: string): PlanInfo | undefined {
    return SUBSCRIPTION_PLANS.find(p => p.planCode === planCode);
}

function getValidAnchorDate(): string {
    const now = new Date();
    const currentDay = now.getUTCDate();
    let anchorDay = currentDay >= 29 ? 28 : currentDay;

    const anchorDate = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, anchorDay, 12, 0, 0, 0);

    console.log("[CHECKOUT] getValidAnchorDate:", { now: now.toISOString(), anchorDate: anchorDate.toISOString(), anchorDay });
    return anchorDate.toISOString();
}

function isLifetimePlan(planCode: string): boolean {
    return planCode === "LIFETIME";
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
 * Create a Payment Session for fixed-amount subscription
 * Uses session_type: "SUBSCRIPTION" with embedded schedule
 * Returns payment_link_url for Xendit hosted checkout page
 * 
 * Per Xendit docs: https://docs.xendit.co/docs/fixed-amount-subscriptions
 * Option 2: If you need Xendit Hosted Page via Payment Session
 */
async function createSubscriptionSession(
    customerId: string,
    amount: number,
    description: string,
    redirectUrls: RedirectUrls,
    referenceId: string,
    email?: string,
    firstName?: string,
    lastName?: string,
    interval: string = "MONTH",
    intervalCount: number = 1,
    totalRecurrence: number = 100
) {
    const anchorDate = getValidAnchorDate();

    const payload = {
        reference_id: referenceId,
        customer: {
            reference_id: `landlord-${referenceId}`,
            type: "INDIVIDUAL" as const,
            individual_detail: {
                given_names: firstName || "Customer",
                surname: lastName || "",
            },
            email: email || "customer@example.com",
        },
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
            immediate_payment: false,
            failed_cycle_action: "RESUME" as const,
        },
        currency: CURRENCY,
        amount,
        mode: "PAYMENT_LINK" as const,
        country: COUNTRY,
        locale: "en",
        description,
        success_return_url: redirectUrls.success,
        cancel_return_url: redirectUrls.cancel || redirectUrls.failure,
    };

    console.log("[CHECKOUT] Stage 6b: Sending request to Xendit sessions API", { url: XENDIT_SESSIONS, payload });

    const res = await fetch(XENDIT_SESSIONS, {
        method: "POST",
        headers: getXenditHeaders(referenceId),
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("[CHECKOUT] Stage 6b: Xendit response", { status: res.status, ok: res.ok, data, requestAnchorDate: payload.subscription.schedule.anchor_date });
    if (!res.ok) throw new Error(data.message || "Subscription Session creation failed");

    return data;
}

/**
 * Create a recurring subscription plan using a saved payment token
 */
async function createRecurringPlan(
    customerId: string,
    paymentTokenId: string,
    amount: number,
    description: string,
    referenceId: string,
    interval: string = "MONTH",
    intervalCount: number = 1,
    totalRecurrence: number = 100
) {
    const anchorDate = getValidAnchorDate();

    const payload = {
        reference_id: referenceId,
        customer_id: customerId,
        currency: CURRENCY,
        amount,
        payment_tokens: [
            {
                payment_token_id: paymentTokenId,
                rank: 1,
            },
        ],
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
        immediate_payment: false,
        failed_cycle_action: "RESUME" as const,
        notification_channels: ["EMAIL" as const],
        locale: "en",
        payment_link_for_failed_attempt: true,
        description,
        metadata: {
            source: "subscription_checkout",
        },
    };

    const res = await fetch(XENDIT_RECURRING_PLANS, {
        method: "POST",
        headers: getXenditHeaders(referenceId),
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("[CHECKOUT] Stage 6c: Xendit response", { status: res.status, ok: res.ok, data });
    if (!res.ok) throw new Error(data.message || "Recurring Plan creation failed");

    return data;
}

/**
 * Create a one-time invoice payment (for LIFETIME plans)
 */
async function createInvoicePayment(
    customerId: string,
    amount: number,
    description: string,
    redirectUrls: RedirectUrls,
    referenceId: string,
    email?: string,
    firstName?: string,
    lastName?: string
) {
    const payload = {
        external_id: referenceId,
        amount,
        currency: CURRENCY,
        description,
        customer: {
            customer_id: customerId,
            email: email || undefined,
            given_names: firstName || undefined,
            surname: lastName || undefined,
        },
        success_redirect_url: redirectUrls.success,
        failure_redirect_url: redirectUrls.failure,
        should_send_email: false,
    };

    const res = await fetch(XENDIT_INVOICES, {
        method: "POST",
        headers: getXenditHeaders(referenceId),
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("[CHECKOUT] Stage 6a: Xendit invoice response", { status: res.status, ok: res.ok, data });
    if (!res.ok) throw new Error(data.message || "Invoice creation failed");

    return data;
}

/* -------------------------------------------------------------------------- */
/* DATABASE OPERATIONS                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Get or create Xendit customer
 */
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

    let customerId = rows[0]?.xendit_customer_id;

    if (!customerId) {
        customerId = await createXenditCustomer({
            referenceId: `landlord-${landlordId}`,
            email,
            firstName,
            lastName,
            secretKey: XENDIT_TEXT_SECRET_KEY!,
        });

        await conn.execute(
            "UPDATE Landlord SET xendit_customer_id = ? WHERE landlord_id = ?",
            [customerId, landlordId]
        );
    }

    return customerId;
}

/**
 * Save subscription record
 */
async function saveSubscription(
    conn: mysql.Connection,
    landlordId: string,
    plan: PlanInfo,
    amount: number,
    xenditData: Record<string, unknown>,
    referenceId: string
): Promise<number> {
    const startDate = new Date().toISOString().split("T")[0];
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const [result] = await conn.execute<mysql.ResultSetHeader>(
        `INSERT INTO Subscription
        (landlord_id, plan_name, plan_code, start_date, end_date, payment_status, created_at,
         request_reference_number, amount_paid, is_active, raw_xendit_payload, payment_session_id, recurring_plan_id)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)`,
        [
            landlordId,
            plan.name,
            plan.planCode,
            startDate,
            endDate,
            "pending",
            referenceId,
            amount,
            1,
            JSON.stringify(xenditData),
            (xenditData as any).payment_session_id || null,
            (xenditData as any).recurring_plan_id || null,
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
        console.log("[CHECKOUT] Stage 1: Request received");

        /* ---------------- VALIDATE REQUEST ---------------- */
        const body: CheckoutBody = await req.json();
        console.log("[CHECKOUT] Stage 1: Request body parsed", { plan_code: body.plan_code, landlord_id: body.landlord_id });

        const {
            landlord_id: rawLandlordId,
            plan_code,
            redirectUrl,
            email,
            firstName,
            lastName,
            payment_token_id,
            channel_code = "CARDS",
        } = body;

        const landlord_id = sanitizeString(rawLandlordId);
        console.log("[CHECKOUT] Stage 1: Validating landlord_id", { landlord_id });
        if (!landlord_id) {
            return httpError(400, "Missing or invalid landlord_id");
        }

        if (!plan_code) {
            return httpError(400, "Missing plan_code");
        }

        if (!XENDIT_TEXT_SECRET_KEY) {
            return httpError(500, "Server misconfiguration: missing Xendit key");
        }

        /* ---------------- GET PLAN ---------------- */
        console.log("[CHECKOUT] Stage 2: Looking up plan", { plan_code });
        const plan = getPlan(plan_code);
        if (!plan) {
            return httpError(400, "Invalid plan_code");
        }
        console.log("[CHECKOUT] Stage 2: Plan found", { planName: plan.name, price: plan.price });

        const amount = plan.price;

        if (amount <= 0) {
            return httpError(400, "Invalid plan price");
        }

        /* ---------------- SETUP REDIRECT URLs ---------------- */
        console.log("[CHECKOUT] Stage 3: Setting up redirect URLs");
        const defaultRedirectUrls: RedirectUrls = {
            success: `${NEXT_PUBLIC_BASE_URL}/payment/subscriptionSuccess`,
            failure: `${NEXT_PUBLIC_BASE_URL}/payment/failure`,
            cancel: `${NEXT_PUBLIC_BASE_URL}/payment/cancelled`,
        };

        const finalRedirectUrls: RedirectUrls = redirectUrl || defaultRedirectUrls;
        console.log("[CHECKOUT] Stage 3: Redirect URLs configured", { finalRedirectUrls });

        /* ---------------- DATABASE CONNECTION ---------------- */
        console.log("[CHECKOUT] Stage 4: Connecting to database");
        connection = await getDbConnection();
        console.log("[CHECKOUT] Stage 4: Database connected");

        /* ---------------- GET CUSTOMER ---------------- */
        console.log("[CHECKOUT] Stage 5: Getting or creating customer", { landlord_id });
        const customerId = await getOrCreateCustomer(
            connection,
            landlord_id,
            email,
            firstName,
            lastName
        );
        console.log("[CHECKOUT] Stage 5: Customer ID obtained", { customerId });

        const referenceId = `sub-${landlord_id}-${Date.now()}`;
        console.log("[CHECKOUT] Stage 5: Reference ID generated", { referenceId });

        /* ---------------- ROUTE BY PLAN TYPE ---------------- */
        console.log("[CHECKOUT] Stage 6: Routing by plan type", { plan_code, isLifetime: isLifetimePlan(plan_code), hasPaymentToken: !!payment_token_id });
        
        // === LIFETIME PLAN: Use Invoice ===
        if (isLifetimePlan(plan_code)) {
            console.log("[CHECKOUT] Stage 6a: Creating invoice for LIFETIME plan");

            const invoiceData = await createInvoicePayment(
                customerId,
                amount,
                `${plan.name} - Lifetime Subscription`,
                finalRedirectUrls,
                referenceId,
                email,
                firstName,
                lastName
            );
            console.log("[CHECKOUT] Stage 6a: Invoice created", { invoiceId: invoiceData.id });

            console.log("[CHECKOUT] Stage 6a: Saving subscription to database");
            await saveSubscription(
                connection,
                landlord_id,
                plan,
                amount,
                invoiceData,
                referenceId
            );
            console.log("[CHECKOUT] Stage 6a: Subscription saved");

            console.log("[CHECKOUT] Stage 7: Returning invoice response");
            return NextResponse.json({
                type: "invoice",
                checkoutUrl: invoiceData.invoice_url,
                invoiceId: invoiceData.id,
                referenceId: referenceId,
            });
        }

        // === RECURRING PLANS: Fixed-Amount Subscription via Payment Session ===
        // Per Xendit docs: https://docs.xendit.co/docs/fixed-amount-subscriptions
        // Option 2: Xendit Hosted Page via Payment Session
        // Returns payment_link_url for user to link payment method on Xendit hosted page
        if (!payment_token_id) {
            console.log("[CHECKOUT] Stage 6b: Creating subscription session (no payment token)");

            const sessionData = await createSubscriptionSession(
                customerId,
                amount,
                `${plan.name} - Monthly Subscription`,
                finalRedirectUrls,
                referenceId,
                email,
                firstName,
                lastName,
                "MONTH",
                1,
                100
            );
            console.log("[CHECKOUT] Stage 6b: Subscription session created", { paymentSessionId: sessionData.payment_session_id });

            // Save pending subscription record (activated via webhook)
            console.log("[CHECKOUT] Stage 6b: Saving subscription to database");
            await saveSubscription(
                connection,
                landlord_id,
                plan,
                amount,
                sessionData,
                referenceId
            );
            console.log("[CHECKOUT] Stage 6b: Subscription saved");

            console.log("[CHECKOUT] Stage 7: Returning subscription session response");
            return NextResponse.json({
                type: "subscription_session",
                checkoutUrl: sessionData.payment_link_url,
                paymentSessionId: sessionData.payment_session_id,
                recurringPlanId: sessionData.recurring_plan_id,
                customerId: sessionData.customer_id,
                referenceId: referenceId,
                status: sessionData.status,
            });
        }

        // === EXISTING TOKEN: Direct recurring plan creation ===
        // Used when user already has a saved payment token
        if (payment_token_id) {
            console.log("[CHECKOUT] Stage 6c: Creating recurring plan (with payment token)", { payment_token_id });

            const planData = await createRecurringPlan(
                customerId,
                payment_token_id,
                amount,
                `${plan.name} - Recurring Subscription`,
                referenceId,
                "MONTH",
                1,
                100
            );
            console.log("[CHECKOUT] Stage 6c: Recurring plan created", { recurringPlanId: planData.id });

            console.log("[CHECKOUT] Stage 6c: Updating subscription in database");
            await connection.execute(
                "UPDATE Subscription SET recurring_plan_id = ?, payment_token_id = ?, payment_status = 'active' WHERE request_reference_number = ?",
                [planData.id, payment_token_id, referenceId]
            );
            console.log("[CHECKOUT] Stage 6c: Subscription updated");

            console.log("[CHECKOUT] Stage 7: Returning recurring plan response");
            return NextResponse.json({
                type: "recurring_plan",
                recurringPlanId: planData.id,
                status: planData.status,
                referenceId: referenceId,
            });
        }

        return httpError(400, "Invalid payment configuration");

    } catch (err: any) {
        console.error("[CHECKOUT] ERROR:", err);

        return httpError(
            500,
            err.message || "Payment initiation failed",
            { stack: process.env.NODE_ENV === "development" ? err.stack : undefined }
        );
    } finally {
        console.log("[CHECKOUT] Stage 8: Closing database connection");
        if (connection) await connection.end();
        console.log("[CHECKOUT] Stage 8: Database connection closed");
    }
}