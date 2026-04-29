/* -------------------------------------------------------------------------- */
/* XENDIT SUBSCRIPTION CHECKOUT API                                           */
/* -------------------------------------------------------------------------- */
/* Flow (per Xendit docs):                                                   */
/*                                                                            */
/* 1. CREATE SUBSCRIPTION PLAN                                                */
/*    - Define recurring terms (amount, frequency, start date)               */
/*    - Set immediate_payment: true to charge customer immediately            */
/*    - Result: Returns payment_link_url or session ID                        */
/*                                                                            */
/* 2. GENERATE PAYMENT LINK                                                  */
/*    - Use the returned payment_link_url to redirect customer                */
/*    - This link triggers the "Pay and Save" (tokenization) process         */
/*                                                                            */
/* 3. CUSTOMER "PAYS AND SAVES"                                               */
/*    - Redirect customer to Xendit-hosted checkout page                       */
/*    - Customer selects payment method and pays initial amount               */
/*    - By completing payment, customer authorizes saving payment details     */
/*                                                                            */
/* 4. WEBHOOKS (The Automation)                                              */
/*    Listen for these events:                                                */
/*    - payment_token.activated: Payment method successfully saved             */
/*    - payment.capture: Initial payment successful                            */
/*    - recurring_plan.activated: Subscription is "Active"                    */
/*                                                                            */
/* 5. FUTURE CYCLES                                                           */
/*    - Xendit auto-processes recurring charges                              */
/*    - You receive recurring.cycle.succeeded webhook for each cycle         */
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
    plan_name?: string;
    plan_code?: string;
    amount?: number;
    description?: string;
    redirectUrl?: RedirectUrls;
    email?: string;
    firstName?: string;
    lastName?: string;
    payment_token_id?: string;
    channel_code?: string;
}

interface PlanInfo {
    name: string;
    planCode?: string;
    price: number;
    interval: "DAY" | "WEEK" | "MONTH" | "YEAR";
    intervalCount: number;
    totalRecurrence: number;
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

function isLifetimePlan(planData: SubscriptionData): boolean {
    return planData.isLifetime === true;
}

function getValidAnchorDate(): string {
    const now = new Date();
    const currentDay = now.getUTCDate();
    let anchorDay = currentDay >= 29 ? 28 : currentDay;

    const nextMonth = now.getUTCMonth() + 1;
    const nextYear = nextMonth > 11 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
    const adjustedMonth = nextMonth > 11 ? 0 : nextMonth;

    const anchorDate = new Date(Date.UTC(nextYear, adjustedMonth, anchorDay, 12, 0, 0, 0));

    console.log("[CHECKOUT] Anchor date calculation:", {
        purchaseDate: now.toISOString(),
        purchaseDay: currentDay,
        anchorDay,
        nextMonth,
        nextYear,
        anchorDate: anchorDate.toISOString(),
        anchorDateFormatted: anchorDate.toLocaleDateString("en-US", { timeZone: "UTC" }),
        note: "First charge is IMMEDIATE. anchor_date = next cycle date (same day each month)"
    });
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
 * Step 1 & 2: Create Subscription Plan + Generate Payment Link
 *
 * Uses session_type: "SUBSCRIPTION" with immediate_payment: true
 * This creates the recurring plan AND generates payment_link_url in one call.
 *
 * IMMEDIATE PAYMENT: Customer is charged RIGHT AWAY during checkout.
 * The anchor_date only schedules WHEN THE NEXT CYCLE starts after the immediate charge.
 *
 * Per Xendit docs: https://docs.xendit.co/docs/fixed-amount-subscriptions
 */
async function createSubscriptionPlanWithPaymentLink(
    customerId: string,
    amount: number,
    description: string,
    redirectUrls: RedirectUrls,
    referenceId: string,
    landlordReferenceId: string,
    email?: string,
    firstName?: string,
    lastName?: string,
    interval: string = "MONTH",
    intervalCount: number = 1,
    totalRecurrence: number = 100
) {
    const anchorDate = getValidAnchorDate();

    console.log("[CHECKOUT] Creating subscription payload:", {
        customerId,
        landlordReferenceId,
        referenceId
    });

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
        amount,
        mode: "PAYMENT_LINK" as const,
        country: COUNTRY,
        locale: "en",
        description,
        success_return_url: redirectUrls.success,
        cancel_return_url: redirectUrls.cancel || redirectUrls.failure,
    };

    console.log("[CHECKOUT] Creating subscription with immediate_payment: true", {
        url: XENDIT_SESSIONS,
        immediate_payment_note: "First charge is IMMEDIATE (today). anchor_date is for NEXT cycle only.",
        anchorDate
    });

    const res = await fetch(XENDIT_SESSIONS, {
        method: "POST",
        headers: getXenditHeaders(referenceId),
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("[CHECKOUT] Xendit response", {
        status: res.status,
        ok: res.ok,
        data,
        errors: data.errors,
        payloadCustomerId: payload.customer_id
    });
    if (!res.ok) {
        console.error("[CHECKOUT] Xendit error:", JSON.stringify(data, null, 2));
        throw new Error(data.message || "Subscription plan creation failed");
    }

    return data;
}

/**
 * Step 3: Pay and Save (Tokenization) - Alternative Flow
 *
 * Uses session_type: "PAY" with charge_immediately: true
 * Redirects customer to Xendit hosted checkout where they:
 * 1. Select payment method (Card, E-wallet, etc.)
 * 2. Pay the initial amount
 * 3. Authorize saving their payment details for future use
 *
 * Per Xendit docs: https://docs.xendit.co/docs/pay-and-save-3
 */
async function createPayAndSaveSession(
    customerId: string,
    amount: number,
    description: string,
    redirectUrls: RedirectUrls,
    referenceId: string,
    landlordReferenceId: string,
    email?: string,
    firstName?: string,
    lastName?: string
) {
    const payload = {
        reference_id: referenceId,
        customer: {
            id: customerId,
            reference_id: landlordReferenceId,
            type: "INDIVIDUAL" as const,
            individual_detail: {
                given_names: firstName || "Customer",
                surname: lastName || "",
            },
            email: email || "customer@example.com",
        },
        session_type: "PAY" as const,
        payment_method_options: {
            payment_amount: amount,
            charge_immediately: true,
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

    console.log("[CHECKOUT] Creating Pay-and-Save session:", { customerId, referenceId });

    const res = await fetch(XENDIT_SESSIONS, {
        method: "POST",
        headers: getXenditHeaders(referenceId),
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("[CHECKOUT] Step 3: Xendit response", { status: res.status, ok: res.ok, data });
    if (!res.ok) throw new Error(data.message || "Pay Session creation failed");

    return data;
}

/**
 * Create recurring subscription plan using a saved payment token
 * Used when customer already has a saved payment method
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
        immediate_payment: true,
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
    console.log("[CHECKOUT] Recurring plan response", { status: res.status, ok: res.ok, data });
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
    console.log("[CHECKOUT] Invoice response", { status: res.status, ok: res.ok, data });
    if (!res.ok) throw new Error(data.message || "Invoice creation failed");

    return data;
}

/* -------------------------------------------------------------------------- */
/* DATABASE OPERATIONS                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Get or create Xendit customer
 * Checks Landlord table first for existing xendit_customer_id
 * If found and not empty, returns it. Otherwise creates new one and updates table.
 */
async function getOrCreateCustomer(
    conn: mysql.Connection,
    landlordId: string,
    email?: string,
    firstName?: string,
    lastName?: string
): Promise<string> {
    console.log("[CHECKOUT] Looking up xendit_customer_id for landlord_id:", { landlordId });

    const [rows] = await conn.execute<mysql.RowDataPacket[]>(
        "SELECT xendit_customer_id FROM Landlord WHERE landlord_id = ? LIMIT 1",
        [landlordId]
    );

    console.log("[CHECKOUT] Query result:", { rows, rowCount: rows.length, firstRow: rows[0] });

    const existingCustomerId = rows[0]?.xendit_customer_id;

    if (existingCustomerId && String(existingCustomerId).trim() !== "") {
        console.log("[CHECKOUT] Existing customer ID found in Landlord table:", { landlordId, customerId: existingCustomerId });
        return String(existingCustomerId);
    }

    console.log("[CHECKOUT] No existing customer ID for landlord, creating new:", { landlordId });

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

    console.log("[CHECKOUT] New customer ID saved to Landlord table:", { landlordId, customerId: newCustomerId });
    return newCustomerId;
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
        console.log("═══════════════════════════════════════════════════════════════");
        console.log("[CHECKOUT] STAGE 0: Request received");
        console.log("═══════════════════════════════════════════════════════════════");

        /* ---------------- STAGE 1: VALIDATE REQUEST ---------------- */
        console.log("[CHECKOUT] STAGE 1: Parsing request body...");
        const body: CheckoutBody = await req.json();
        console.log("[CHECKOUT] STAGE 1: Raw request body:", {
            plan_name: body.plan_name,
            plan_code: body.plan_code,
            amount: body.amount,
            landlord_id: body.landlord_id,
            has_email: !!body.email,
            has_firstName: !!body.firstName,
            has_lastName: !!body.lastName,
            has_payment_token_id: !!body.payment_token_id
        });

        const {
            landlord_id: rawLandlordId,
            plan_name,
            plan_code,
            amount,
            redirectUrl,
            email,
            firstName,
            lastName,
            payment_token_id,
            channel_code = "CARDS",
        } = body;

        const landlord_id = sanitizeString(rawLandlordId);
        console.log("[CHECKOUT] STAGE 1: Sanitized landlord_id:", { landlord_id });
        console.log("[CHECKOUT] STAGE 1: Request body:", body);

        if (!landlord_id) {
            return httpError(400, "Missing or invalid landlord_id");
        }

        if (!body.plan_name || !body.amount) {
            return httpError(400, "Missing required fields. Required: plan_name, amount");
        }

        const isLifetime = body.plan_code?.toUpperCase() === "LIFETIME";

        if (!XENDIT_TEXT_SECRET_KEY) {
            return httpError(500, "Server misconfiguration: missing Xendit key");
        }

        /* ---------------- STAGE 2: BUILD PLAN FROM REQUEST BODY ---------------- */
        console.log("[CHECKOUT] STAGE 2: Building plan from request body:", {
            planName: body.plan_name,
            planCode: body.plan_code,
            amount: body.amount,
            isLifetime
        });

        const plan: PlanInfo = {
            name: plan_name!,
            planCode: plan_code,
            price: amount!,
            interval: "MONTH",
            intervalCount: 1,
            totalRecurrence: 100,
            isLifetime: isLifetime,
        };

        if (amount! <= 0) {
            return httpError(400, "Invalid plan price");
        }

        /* ---------------- STAGE 3: SETUP REDIRECT URLs ---------------- */
        console.log("[CHECKOUT] STAGE 3: Setting up redirect URLs...");
        const defaultRedirectUrls: RedirectUrls = {
            success: `${NEXT_PUBLIC_BASE_URL}/payment/subscriptionSuccess`,
            failure: `${NEXT_PUBLIC_BASE_URL}/payment/failure`,
            cancel: `${NEXT_PUBLIC_BASE_URL}/payment/cancelled`,
        };

        const finalRedirectUrls: RedirectUrls = redirectUrl || defaultRedirectUrls;
        console.log("[CHECKOUT] STAGE 3: Redirect URLs:", { finalRedirectUrls });

        /* ---------------- STAGE 4: DATABASE CONNECTION ---------------- */
        console.log("[CHECKOUT] STAGE 4: Connecting to database...");
        connection = await getDbConnection();
        console.log("[CHECKOUT] STAGE 4: Database connected successfully");

        /* ---------------- STAGE 5: GET OR CREATE CUSTOMER ---------------- */
        console.log("[CHECKOUT] STAGE 5: Looking up/creating Xendit customer:", { landlord_id });
        const customerId = await getOrCreateCustomer(
            connection,
            landlord_id,
            email,
            firstName,
            lastName
        );
        console.log("[CHECKOUT] STAGE 5: Customer ID obtained:", { customerId });

        const referenceId = `sub-${landlord_id}-${Date.now()}`;
        console.log("[CHECKOUT] STAGE 5: Reference ID generated:", { referenceId });

        /* ---------------- STAGE 6: ROUTE BY PLAN TYPE ---------------- */
        console.log("[CHECKOUT] STAGE 6: Routing by plan type:", {
            planName: plan.name,
            isLifetime: isLifetime,
            hasPaymentToken: !!payment_token_id
        });

        // === LIFETIME PLAN: Use Invoice ===
        if (isLifetime) {
            console.log("[CHECKOUT] STAGE 6a: Processing LIFETIME plan (one-time payment)...");

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
            console.log("[CHECKOUT] STAGE 6a: Invoice created:", { invoiceId: invoiceData.id, invoiceUrl: invoiceData.invoice_url });

            console.log("[CHECKOUT] STAGE 6a: Saving subscription to database...");
            await saveSubscription(
                connection,
                landlord_id,
                plan,
                amount,
                invoiceData,
                referenceId
            );
            console.log("[CHECKOUT] STAGE 6a: Subscription saved to DB");

            return NextResponse.json({
                type: "invoice",
                checkoutUrl: invoiceData.invoice_url,
                invoiceId: invoiceData.id,
                referenceId: referenceId,
            });
        }

        // === RECURRING PLANS: Pay and Save (Tokenization) ===
        // Step 1: Create Payment Session with immediate_payment: true
        // Step 2: Return payment_link_url to redirect customer
        // Step 3: Customer pays on Xendit page (IMMEDIATE charge)
        // Step 4: Webhooks confirm payment + token saved
        if (!payment_token_id) {
            console.log("[CHECKOUT] STAGE 6b: RECURRING PLAN - Creating Pay and Save session...");
            console.log("[CHECKOUT] STAGE 6b: Customer will be charged IMMEDIATELY on checkout");
            console.log("[CHECKOUT] STAGE 6b: Plan details:", { planName: plan.name, price: amount, interval: plan.interval, intervalCount: plan.intervalCount });
            console.log("[CHECKOUT] STAGE 6b: Using existing customer from DB:", {
                customerId,
                landlord_id,
                landlordReferenceId: `landlord-${landlord_id}`
            });

            const landlordReferenceId = `landlord-${landlord_id}`;

            let finalCustomerId = customerId;

            // STEP A: Verify customer exists in Xendit and matches our DB
            console.log("[CHECKOUT] STAGE 6b: Verifying customer in Xendit by reference_id...");
            const verifyResp = await fetch(
                `https://api.xendit.co/customers?reference_id=${encodeURIComponent(landlordReferenceId)}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Basic " + Buffer.from(`${XENDIT_TEXT_SECRET_KEY}:`).toString("base64"),
                    },
                }
            );
            const verifyData = await verifyResp.json();
            console.log("[CHECKOUT] STAGE 6b: Customer verification response:", {
                status: verifyResp.status,
                data: verifyData.data,
                dbCustomerId: customerId
            });

            if (verifyResp.ok && verifyData.data && verifyData.data.length > 0) {
                const xenditCustomerId = verifyData.data[0].id;
                if (xenditCustomerId === customerId) {
                    console.log("[CHECKOUT] STAGE 6b: Customer verified - Xendit ID matches DB ID:", { customerId });
                    finalCustomerId = customerId;
                } else {
                    console.warn("[CHECKOUT] STAGE 6b: MISMATCH! Xendit has different customer ID than DB:", {
                        dbCustomerId: customerId,
                        xenditCustomerId: xenditCustomerId
                    });
                    // Use Xendit's customer ID since it's the source of truth
                    finalCustomerId = xenditCustomerId;
                    // Update DB to match Xendit
                    await connection.execute(
                        "UPDATE Landlord SET xendit_customer_id = ? WHERE landlord_id = ?",
                        [xenditCustomerId, landlord_id]
                    );
                    console.log("[CHECKOUT] STAGE 6b: Updated DB with Xendit's customer ID");
                }
            } else {
                console.log("[CHECKOUT] STAGE 6b: Customer NOT found in Xendit by reference_id. Creating new customer...");
                const newCustomerId = await createXenditCustomer({
                    referenceId: landlordReferenceId,
                    email,
                    firstName,
                    lastName,
                    secretKey: XENDIT_TEXT_SECRET_KEY!,
                });
                console.log("[CHECKOUT] STAGE 6b: New customer created in Xendit:", { newCustomerId });
                finalCustomerId = newCustomerId;

                // Update DB with new customer ID
                await connection.execute(
                    "UPDATE Landlord SET xendit_customer_id = ? WHERE landlord_id = ?",
                    [newCustomerId, landlord_id]
                );
                console.log("[CHECKOUT] STAGE 6b: Updated DB with new customer ID");
            }

            // STEP B: Create session using the verified/created customer ID
            console.log("[CHECKOUT] STAGE 6b: Creating session with finalCustomerId:", { finalCustomerId });

            const sessionData = await createSubscriptionPlanWithPaymentLink(
                finalCustomerId,
                amount,
                `${plan.name} - ${plan.interval} Subscription`,
                finalRedirectUrls,
                referenceId,
                landlordReferenceId,
                email,
                firstName,
                lastName,
                plan.interval,
                plan.intervalCount,
                plan.totalRecurrence
            );
            console.log("[CHECKOUT] STAGE 6b: Session created - Xendit response:", {
                payment_session_id: sessionData.payment_session_id,
                customer_id: sessionData.customer_id,
                finalCustomerIdUsed: finalCustomerId,
                customerIdMatch: sessionData.customer_id === finalCustomerId
            });

            console.log("[CHECKOUT] STAGE 6b: Saving subscription to database (status: pending)...");
            await saveSubscription(
                connection,
                landlord_id,
                plan,
                amount,
                sessionData,
                referenceId
            );
            console.log("[CHECKOUT] STAGE 6b: Subscription saved to DB (awaiting webhook confirmation)");

            console.log("[CHECKOUT] STAGE 6b: Returning payment link to frontend...");
            console.log("═══════════════════════════════════════════════════════════════");
            console.log("[CHECKOUT] NEXT: Redirect customer to:", sessionData.payment_link_url);
            console.log("[CHECKOUT] Customer will be charged: ₱" + amount + " IMMEDIATELY");
            console.log("[CHECKOUT] STAGE 6b: Complete");
            console.log("═══════════════════════════════════════════════════════════════");

            return NextResponse.json({
                type: "subscription",
                checkoutUrl: sessionData.payment_link_url,
                paymentSessionId: sessionData.payment_session_id,
                recurringPlanId: sessionData.recurring_plan_id,
                customerId: sessionData.customer_id,
                referenceId: referenceId,
                status: sessionData.status,
                message: "Customer will be charged IMMEDIATELY. Redirect to Xendit payment page.",
            });
        }

        // === EXISTING TOKEN: Direct recurring plan creation ===
        // Used when user already has a saved payment token from previous Pay and Save
        if (payment_token_id) {
            console.log("[CHECKOUT] STAGE 6c: Creating recurring plan with EXISTING payment token...");
            console.log("[CHECKOUT] STAGE 6c: Using saved payment_token_id:", { payment_token_id });

            const planData = await createRecurringPlan(
                customerId,
                payment_token_id,
                amount,
                `${plan.name} - Recurring Subscription`,
                referenceId,
                plan.interval,
                plan.intervalCount,
                plan.totalRecurrence
            );
            console.log("[CHECKOUT] STAGE 6c: Recurring plan created:", { recurringPlanId: planData.id, status: planData.status });

            console.log("[CHECKOUT] STAGE 6c: Updating subscription in database...");
            await connection.execute(
                "UPDATE Subscription SET recurring_plan_id = ?, payment_token_id = ?, payment_status = 'active' WHERE request_reference_number = ?",
                [planData.id, payment_token_id, referenceId]
            );
            console.log("[CHECKOUT] STAGE 6c: Subscription updated to active");

            return NextResponse.json({
                type: "recurring_plan",
                recurringPlanId: planData.id,
                status: planData.status,
                referenceId: referenceId,
            });
        }

        return httpError(400, "Invalid payment configuration");

    } catch (err: any) {
        console.error("═══════════════════════════════════════════════════════════════");
        console.error("[CHECKOUT] ERROR:", { message: err.message, code: err.code });
        console.error("[CHECKOUT] Stack:", err.stack);
        console.error("═══════════════════════════════════════════════════════════════");

        return httpError(
            500,
            err.message || "Payment initiation failed",
            { stack: process.env.NODE_ENV === "development" ? err.stack : undefined }
        );
    } finally {
        console.log("[CHECKOUT] STAGE 8: Cleaning up...");
        if (connection) {
            await connection.end();
            console.log("[CHECKOUT] STAGE 8: Database connection closed");
        }
        console.log("═══════════════════════════════════════════════════════════════");
        console.log("[CHECKOUT] Request complete");
        console.log("═══════════════════════════════════════════════════════════════");
    }
}