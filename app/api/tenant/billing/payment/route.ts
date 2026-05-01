export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import crypto from "crypto";

const {
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    XENDIT_TEXT_SECRET_KEY,
} = process.env;

const XENDIT_API_URL = "https://api.xendit.co/v2/invoices";
const CURRENCY = "PHP";

function debug(label: string, data?: any) {
    if (data) console.log(JSON.stringify(data, null, 2));
}

function httpError(status: number, message: string, extra?: any) {
    debug("HTTP ERROR", { status, message, extra });

    return NextResponse.json(
        { error: message, ...(extra ? { details: extra } : {}) },
        { status }
    );
}

async function getDbConnection() {
    return mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
    });
}

function formatBillingPeriod(date: string | Date) {
    return new Date(date).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
}

export async function POST(req: NextRequest) {
    let conn: mysql.Connection | null = null;

    try {
        const body = await req.json();

        const {
            amount,
            billing_id,
            redirectUrl,
        } = body;

        if (!amount || !billing_id) {
            return httpError(400, "Missing required fields.");
        }

        if (!redirectUrl?.success || !redirectUrl?.failure) {
            return httpError(400, "Missing redirect URLs.");
        }

        if (!XENDIT_TEXT_SECRET_KEY) {
            return httpError(500, "Xendit secret key not configured.");
        }

        conn = await getDbConnection();

        const [rows]: any = await conn.execute(
            `
        SELECT
            b.billing_id,
            b.lease_id AS agreement_id,
            b.billing_period,
            b.total_amount_due,
            u.unit_name,
            p.property_name,
            l.landlord_id,
            l.xendit_account_id
        FROM Billing b
        JOIN LeaseAgreement la ON b.lease_id = la.agreement_id
        JOIN Unit u ON la.unit_id = u.unit_id
        JOIN Property p ON u.property_id = p.property_id
        JOIN Landlord l ON p.landlord_id = l.landlord_id
        WHERE b.billing_id = ?
        LIMIT 1
      `,
            [billing_id]
        );

        if (!rows.length) {
            return httpError(404, "Billing not found.");
        }

        const billing = rows[0];

        if (!billing.xendit_account_id) {
            return httpError(400, "Landlord subaccount not configured.");
        }

        const [leaseRows]: any = await conn.execute(
            `SELECT xendit_customer_id FROM LeaseAgreement WHERE agreement_id = ? LIMIT 1`,
            [billing.agreement_id]
        );

        const xenditCustomerId = leaseRows?.[0]?.xendit_customer_id ?? null;

        if (!xenditCustomerId) {
            return httpError(400, "Tenant Xendit customer not found.");
        }

        const idempotencyKey = crypto
            .createHash("sha256")
            .update(`billing-${billing.billing_id}`)
            .digest("hex");

        const successRedirectUrl =
            `${redirectUrl.success}?billing_id=${billing.billing_id}`;

        const failureRedirectUrl =
            `${redirectUrl.failure}?billing_id=${billing.billing_id}`;

        const invoicePayload = {
            external_id: `billing-${billing.billing_id}`,
            amount: Number(amount),
            currency: CURRENCY,
            description: `Billing for ${billing.property_name} - ${billing.unit_name}
Billing Period: ${formatBillingPeriod(billing.billing_period)}`,
            customer: {
                customer_id: xenditCustomerId,
            },
            success_redirect_url: successRedirectUrl,
            failure_redirect_url: failureRedirectUrl,
        };

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            Authorization:
                "Basic " +
                Buffer.from(`${XENDIT_TEXT_SECRET_KEY}:`).toString("base64"),
            "Idempotency-Key": idempotencyKey,
            "for-user-id": billing.xendit_account_id,
        };

        const response = await fetch(XENDIT_API_URL, {
            method: "POST",
            headers,
            body: JSON.stringify(invoicePayload),
        });

        const rawText = await response.text();

        let responseData: any;
        try {
            responseData = JSON.parse(rawText);
        } catch {
            responseData = rawText;
        }

        if (!response.ok) {
            return httpError(
                response.status,
                "Xendit invoice creation failed.",
                responseData
            );
        }

        return NextResponse.json({
            success: true,
            checkoutUrl: responseData.invoice_url,
            invoiceId: responseData.id,
            billing_id: billing.billing_id,
            agreement_id: billing.agreement_id,
        });

    } catch (err: any) {
        return httpError(500, "Payment initialization failed.", err?.message);
    } finally {
        if (conn) await conn.end().catch(() => {});
    }
}