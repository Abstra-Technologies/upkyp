/* -------------------------------------------------------------------------- */
/* XENDIT INVOICE PAID WEBHOOK (BILLING & SUBSCRIPTION)                        */
/* -------------------------------------------------------------------------- */
/* Handles both billing and subscription payments based on external_id        */

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { sendUserNotification } from "@/lib/notifications/sendUserNotification";
import { safeDecrypt } from "@/utils/decrypt/safeDecrypt";

/* -------------------------------------------------------------------------- */
/* ENV                                                                        */
/* -------------------------------------------------------------------------- */

const {
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    XENDIT_WEBHOOK_TOKEN,
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

function extractIdFromExternalId(externalId: string, prefix: string): string {
    return externalId.replace(prefix, "");
}

/* -------------------------------------------------------------------------- */
/* BILLING PAYMENT HANDLER                                                    */
/* -------------------------------------------------------------------------- */

async function handleBillingPayment(conn: mysql.Connection, billing_id: string, payment: any) {
    const { payment_id, paid_amount, amount, paid_at, id: invoice_id, payment_channel, ewallet_type, payment_method, external_id } = payment;
    const paidAmount = Number(paid_amount || amount);
    const paidAt = new Date(paid_at);

    const [existing]: any = await conn.execute(
        `SELECT payment_id FROM Payment WHERE gateway_transaction_ref = ? LIMIT 1`,
        [payment_id]
    );

    if (existing.length) {
        return { processed: true, message: "Already processed" };
    }

    const [rows]: any = await conn.execute(
        `
        SELECT 
            b.billing_id,
            b.lease_id,
            p.property_id,
            landlordUser.user_id AS landlord_user_id,
            tenantUser.firstName AS tenant_first_name,
            tenantUser.lastName AS tenant_last_name
        FROM Billing b
        JOIN LeaseAgreement la ON b.lease_id = la.agreement_id
        JOIN Unit un ON la.unit_id = un.unit_id
        JOIN Property p ON un.property_id = p.property_id
        JOIN Landlord l ON p.landlord_id = l.landlord_id
        JOIN User landlordUser ON l.user_id = landlordUser.user_id
        JOIN Tenant t ON la.tenant_id = t.tenant_id
        JOIN User tenantUser ON t.user_id = tenantUser.user_id
        WHERE b.billing_id = ?
        LIMIT 1
        `,
        [billing_id]
    );

    if (!rows.length) {
        throw new Error(`Billing ${billing_id} not found`);
    }

    const billing = rows[0];

    await conn.execute(
        `UPDATE Billing SET status = 'paid', paid_at = ? WHERE billing_id = ?`,
        [paidAt, billing_id]
    );

    const paymentType = JSON.stringify({ payment_channel, ewallet_type, payment_method });

    await conn.execute(
        `
        INSERT INTO Payment (
            agreement_id, bill_id, payment_type, amount_paid, payment_method_id,
            payment_status, receipt_reference, payment_date, raw_gateway_payload,
            gateway_transaction_ref, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, NOW(), NOW())
        `,
        [
            billing.lease_id,
            billing_id,
            paymentType,
            paidAmount,
            payment_channel || null,
            invoice_id,
            paidAt,
            JSON.stringify(payment),
            payment_id,
        ]
    );

    const first = safeDecrypt(billing.tenant_first_name);
    const last = safeDecrypt(billing.tenant_last_name);

    await sendUserNotification({
        userId: billing.landlord_user_id,
        title: "💰 Rent Payment Received",
        body: `${first} ${last} paid ₱${paidAmount.toLocaleString("en-PH")}`,
        url: `/landlord/properties/${billing.property_id}/payments?id=${billing.property_id}`,
        conn,
    });

    return { processed: true, message: "Billing payment recorded", landlord_user_id: billing.landlord_user_id };
}

/* -------------------------------------------------------------------------- */
/* SUBSCRIPTION PAYMENT HANDLER                                                */
/* -------------------------------------------------------------------------- */

async function handleSubscriptionPayment(conn: mysql.Connection, landlord_id: string, payment: any) {
    const { payment_id, paid_amount, amount, external_id } = payment;
    const paidAmount = Number(paid_amount || amount);

    const [rows]: any = await conn.execute(
        `SELECT subscription_id FROM Subscription 
         WHERE landlord_id = ? AND payment_status = 'pending' 
         ORDER BY subscription_id DESC LIMIT 1`,
        [landlord_id]
    );

    if (!rows.length) {
        throw new Error(`No pending subscription for landlord ${landlord_id}`);
    }

    const subscription_id = rows[0].subscription_id;

    await conn.execute(
        `UPDATE Subscription 
         SET payment_status = 'paid', is_active = 1, amount_paid = ? 
         WHERE subscription_id = ?`,
        [paidAmount, subscription_id]
    );

    return { processed: true, message: "Subscription payment recorded", subscription_id };
}

/* -------------------------------------------------------------------------- */
/* WEBHOOK HANDLER                                                            */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
    let conn: mysql.Connection | null = null;

    try {
        const token = req.headers.get("x-callback-token");

        if (!token || token !== XENDIT_WEBHOOK_TOKEN) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const payload = await req.json();

        if (payload.status !== "PAID") {
            return NextResponse.json({ message: "Ignored - not a paid status" });
        }

        const {
            external_id,
            payment_id,
            paid_amount,
            amount,
        } = payload;

        if (!payment_id) {
            throw new Error("Missing payment_id in webhook payload");
        }

        if (!external_id || !external_id.includes("-")) {
            throw new Error("Invalid external_id format");
        }

        const paidAmount = Number(paid_amount || amount);
        const prefix = external_id.split("-")[0];
        const isBilling = prefix === "billing";
        const isSubscription = prefix === "subscription";

        if (!isBilling && !isSubscription) {
            throw new Error(`Unknown payment type: ${prefix}`);
        }

        conn = await getDbConnection();
        await conn.beginTransaction();

        let response: any;

        if (isBilling) {
            const billing_id = extractIdFromExternalId(external_id, "billing-");
            response = await handleBillingPayment(conn, billing_id, {
                ...payload,
                paidAmount,
            });
        } else if (isSubscription) {
            const landlord_id = external_id.replace("subscription-", "");
            response = await handleSubscriptionPayment(conn, landlord_id, payload);
        }

        await conn.commit();

        return NextResponse.json({
            message: response.message || "Payment recorded successfully",
            type: isBilling ? "billing" : "subscription",
        });

    } catch (err: any) {
        if (conn) await conn.rollback();

        console.error("Webhook error:", err.message);

        return NextResponse.json(
            { message: "Webhook failed", error: err.message },
            { status: 500 }
        );
    } finally {
        if (conn) await conn.end();
    }
}
