/* -------------------------------------------------------------------------- */
/* XENDIT SUBSCRIPTION CHECKOUT API (Enterprise Grade)                             */
/* -------------------------------------------------------------------------- */
/* Supports:                                                               */
/* - PAY_AND_SAVE: First payment + save card for recurring                                */
/* - PAY_With_Token: Recurring payments using saved token                           */
/* - INVOICE: One-time/lifetime payments                                        */
/* -------------------------------------------------------------------------- */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import crypto from "crypto";
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
    XENDIT_SECRET_KEY,
    NEXT_PUBLIC_BASE_URL,
} = process.env;

const XENDIT_PAYMENT_REQUESTS = "https://api.xendit.co/v3/payment_requests";
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
    card_details?: {
        card_number: string;
        expiry_month: string;
        expiry_year: string;
        cvn?: string;
    };
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
        Authorization: "Basic " + Buffer.from(`${XENDIT_SECRET_KEY}:`).toString("base64"),
        "api-version": API_VERSION,
    };
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    return headers;
}

/* -------------------------------------------------------------------------- */
/* XENDIT API CALLS                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Create a one-time invoice payment (for LIFETIME plans)
 */
async function createInvoicePayment(
    customerId: string,
    amount: number,
    description: string,
    redirectUrls: RedirectUrls,
    referenceId: string
) {
    const payload = {
        external_id: referenceId,
        amount,
        currency: CURRENCY,
        description,
        customer: { customer_id: customerId },
        success_redirect_url: redirectUrls.success,
        failure_redirect_url: redirectUrls.failure,
        cancel_redirect_url: redirectUrls.cancel,
    };

    const res = await fetch(XENDIT_INVOICES, {
        method: "POST",
        headers: getXenditHeaders(referenceId),
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Invoice creation failed");

    return data;
}

/**
 * Create PAY_AND_SAVE payment (first payment + save card)
 */
async function createPayAndSavePayment(
    customerId: string,
    amount: number,
    description: string,
    redirectUrls: RedirectUrls,
    referenceId: string,
    channelCode: string,
    cardDetails?: {
        card_number: string;
        expiry_month: string;
        expiry_year: string;
        cvn?: string;
    },
    email?: string,
    firstName?: string,
    lastName?: string
) {
    const customer = {
        reference_id: `cust-${referenceId}`,
        type: "INDIVIDUAL" as const,
        individual_detail: {
            given_names: firstName || "Customer",
            surname: lastName || "",
        },
        email: email || "customer@example.com",
    };

    const channelProperties: Record<string, unknown> = {
        failure_return_url: redirectUrls.failure,
        success_return_url: redirectUrls.success,
    };

    if (cardDetails) {
        Object.assign(channelProperties, {
            card_details: {
                ...cardDetails,
                cardholder_email: email,
                cardholder_first_name: firstName,
                cardholder_last_name: lastName,
            },
        });
    }

    const payload = {
        reference_id: referenceId,
        customer,
        type: "PAY_AND_SAVE",
        country: COUNTRY,
        currency: CURRENCY,
        request_amount: amount,
        capture_method: "AUTOMATIC",
        channel_code: channelCode,
        channel_properties: channelProperties,
        description,
        metadata: { source: "subscription_checkout" },
    };

    const res = await fetch(XENDIT_PAYMENT_REQUESTS, {
        method: "POST",
        headers: getXenditHeaders(referenceId),
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "PAY_AND_SAVE failed");

    return data;
}

/**
 * Create payment with saved token (recurring payments)
 */
async function createPaymentWithToken(
    paymentTokenId: string,
    amount: number,
    description: string,
    redirectUrls: RedirectUrls,
    referenceId: string,
    customerId?: string
) {
    const payload: Record<string, unknown> = {
        reference_id: referenceId,
        payment_token_id: paymentTokenId,
        type: "PAY",
        country: COUNTRY,
        currency: CURRENCY,
        request_amount: amount,
        capture_method: "AUTOMATIC",
        channel_code: "CARDS",
        channel_properties: {
            card_on_file_type: "RECURRING",
            success_return_url: redirectUrls.success,
            failure_return_url: redirectUrls.failure,
        },
        description,
    };

    if (customerId) {
        payload.customer_id = customerId;
    }

    const res = await fetch(XENDIT_PAYMENT_REQUESTS, {
        method: "POST",
        headers: getXenditHeaders(referenceId),
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Payment with token failed");

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
            secretKey: XENDIT_SECRET_KEY!,
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
         request_reference_number, amount_paid, is_active, raw_xendit_payload) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, 1, ?)`,
        [
            landlordId,
            plan.name,
            plan.planCode,
            startDate,
            endDate,
            "pending",
            referenceId,
            amount,
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
        /* ---------------- VALIDATE REQUEST ---------------- */
        const body: CheckoutBody = await req.json();

        const {
            landlord_id: rawLandlordId,
            plan_code,
            redirectUrl,
            email,
            firstName,
            lastName,
            payment_token_id,
            channel_code = "CARDS",
            card_details,
        } = body;

        const landlord_id = sanitizeString(rawLandlordId);
        if (!landlord_id) {
            return httpError(400, "Missing or invalid landlord_id");
        }

        if (!plan_code) {
            return httpError(400, "Missing plan_code");
        }

        if (!XENDIT_SECRET_KEY) {
            return httpError(500, "Server misconfiguration: missing Xendit key");
        }

        /* ---------------- GET PLAN ---------------- */
        const plan = getPlan(plan_code);
        if (!plan) {
            return httpError(400, "Invalid plan_code");
        }

        const amount = plan.price;

        if (amount <= 0) {
            return httpError(400, "Invalid plan price");
        }

        /* ---------------- SETUP REDIRECT URLs ---------------- */
        const defaultRedirectUrls: RedirectUrls = {
            success: `${NEXT_PUBLIC_BASE_URL}/payment/subscriptionSuccess`,
            failure: `${NEXT_PUBLIC_BASE_URL}/payment/failure`,
            cancel: `${NEXT_PUBLIC_BASE_URL}/payment/cancelled`,
        };

        const finalRedirectUrls: RedirectUrls = redirectUrl || defaultRedirectUrls;

        /* ---------------- DATABASE CONNECTION ---------------- */
        connection = await getDbConnection();

        /* ---------------- GET CUSTOMER ---------------- */
        const customerId = await getOrCreateCustomer(
            connection,
            landlord_id,
            email,
            firstName,
            lastName
        );

        const referenceId = `sub-${landlord_id}-${Date.now()}`;

        /* ---------------- ROUTE BY PLAN TYPE ---------------- */
        
        // === LIFETIME PLAN: Use Invoice ===
        if (isLifetimePlan(plan_code)) {
            const invoiceData = await createInvoicePayment(
                customerId,
                amount,
                `${plan.name} - Lifetime Subscription`,
                finalRedirectUrls,
                referenceId
            );

            await saveSubscription(
                connection,
                landlord_id,
                plan,
                amount,
                invoiceData,
                referenceId
            );

            return NextResponse.json({
                type: "invoice",
                checkoutUrl: invoiceData.invoice_url,
                invoiceId: invoiceData.id,
            });
        }

        // === RECURRING PLANS ===

        // First payment: Require PAY_AND_SAVE or card details
        if (!payment_token_id && !card_details) {
            const payAndSaveData = await createPayAndSavePayment(
                customerId,
                amount,
                `${plan.name} - Initial Payment`,
                finalRedirectUrls,
                referenceId,
                channel_code,
                card_details,
                email,
                firstName,
                lastName
            );

            await saveSubscription(
                connection,
                landlord_id,
                plan,
                amount,
                payAndSaveData,
                referenceId
            );

            return NextResponse.json({
                type: "PAY_AND_SAVE",
                paymentRequestId: payAndSaveData.payment_request_id,
                customerId: payAndSaveData.customer_id,
                actions: payAndSaveData.actions,
                status: payAndSaveData.status,
                requiresAction: payAndSaveData.status === "REQUIRES_ACTION",
            });
        }

        // Subsequent payment: Use saved token
        if (payment_token_id) {
            const tokenPaymentData = await createPaymentWithToken(
                payment_token_id,
                amount,
                `${plan.name} - Recurring Payment`,
                finalRedirectUrls,
                referenceId,
                customerId
            );

            await saveSubscription(
                connection,
                landlord_id,
                plan,
                amount,
                tokenPaymentData,
                referenceId
            );

            return NextResponse.json({
                type: "PAY_WITH_TOKEN",
                paymentRequestId: tokenPaymentData.payment_request_id,
                status: tokenPaymentData.status,
                requiresAction: tokenPaymentData.status === "REQUIRES_ACTION",
                actions: tokenPaymentData.actions,
            });
        }

        return httpError(400, "Invalid payment configuration");

    } catch (err: any) {
        console.error("Checkout error:", err);

        return httpError(
            500,
            err.message || "Payment initiation failed",
            { stack: process.env.NODE_ENV === "development" ? err.stack : undefined }
        );
    } finally {
        if (connection) await connection.end();
    }
}