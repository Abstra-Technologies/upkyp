/* -------------------------------------------------------------------------- */
/* XENDIT INVOICE.PAID WEBHOOK (BILLING UPDATE ONLY)                          */
/* -------------------------------------------------------------------------- */

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
/* DB CONNECTION                                                              */
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
/* WEBHOOK HANDLER                                                            */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
    let conn: mysql.Connection | null = null;

    try {
        const token = req.headers.get("x-callback-token");

        if (token !== XENDIT_WEBHOOK_TOKEN) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const payload = await req.json();

        if (payload.status !== "PAID") {
            return NextResponse.json({ message: "Ignored" });
        }

        const {
            external_id,
            paid_at,
            payment_id,
            paid_amount,
            amount,
            id: invoice_id,
            payment_channel,
            ewallet_type,
            payment_method,
        } = payload;

        if (!payment_id) throw new Error("Missing payment_id");
        if (!external_id?.startsWith("billing-")) throw new Error("Invalid external_id");

        const billing_id = external_id.replace("billing-", "");
        const paidAmount = Number(paid_amount || amount);
        const paidAt = new Date(paid_at);

        conn = await getDbConnection();
        await conn.beginTransaction();

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
            await conn.rollback();
            throw new Error("Billing not found");
        }

        const billing = rows[0];

        const [existing]: any = await conn.execute(
            `SELECT payment_id 
             FROM Payment 
             WHERE gateway_transaction_ref = ? LIMIT 1`,
            [payment_id]
        );

        if (existing.length) {
            await conn.rollback();
            return NextResponse.json({ message: "Already processed" });
        }

        await conn.execute(
            `UPDATE Billing SET status='paid', paid_at=? WHERE billing_id=?`,
            [paidAt, billing_id]
        );

        const paymentType = JSON.stringify({
            payment_channel,
            ewallet_type,
            payment_method,
        });

        await conn.execute(
            `
            INSERT INTO Payment (
                agreement_id,
                bill_id,
                payment_type,
                amount_paid,
                payment_method_id,
                payment_status,
                receipt_reference,
                payment_date,
                raw_gateway_payload,
                gateway_transaction_ref,
                created_at,
                updated_at
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
                JSON.stringify(payload),
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

        await conn.commit();

        return NextResponse.json({
            message: "Payment recorded successfully",
        });

    } catch (err: any) {
        if (conn) await conn.rollback();

        return NextResponse.json(
            { message: "Webhook failed", error: err.message },
            { status: 500 }
        );
    } finally {
        if (conn) await conn.end();
    }
}
