/* -------------------------------------------------------------------------- */
/* XENDIT INVOICE.PAID WEBHOOK (TRANSACTION-BASED SETTLEMENT + TRANSFER)      */
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
    XENDIT_TRANSBAL_KEY,
    XENDIT_SECRET_KEY,
    XENDIT_MAIN_ACCOUNT_ID,
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
/* FETCH TRANSACTION (UPDATED BASED ON YOUR SAMPLE)                            */
/* -------------------------------------------------------------------------- */

async function fetchTransactionDetails(transactionId: string, grossAmount: number) {
    const response = await fetch(
        `https://api.xendit.co/transactions?product_id=${transactionId}`,
        {
            method: "GET",
            headers: {
                Authorization:
                    "Basic " +
                    Buffer.from(`${XENDIT_TRANSBAL_KEY}:`).toString("base64"),
            },
        }
    );

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Transaction API error: ${errText}`);
    }

    const tx = await response.json();

    const xenditFee = Number(tx.fee?.xendit_fee || 0);
    const vat = Number(tx.fee?.value_added_tax || 0);
    const withholdingTax = Number(tx.fee?.xendit_withholding_tax || 0);
    const thirdPartyWithholding = Number(tx.fee?.third_party_withholding_tax || 0);
    const totalFees = xenditFee + vat + withholdingTax + thirdPartyWithholding;
    const netAmount = grossAmount - totalFees;

    return {
        grossAmount,
        gatewayFee: xenditFee,
        gatewayVAT: vat,
        gatewayWithholdingTax: withholdingTax,
        gatewayThirdPartyWithholding: thirdPartyWithholding,
        netAmount: netAmount > 0 ? netAmount : 0,
        settlementStatus: tx.settlement_status || "PENDING",
        transactionStatus: tx.status || "UNKNOWN",
    };
}

/* -------------------------------------------------------------------------- */
/* TRANSFER FUNCTION                                                          */
/* -------------------------------------------------------------------------- */

async function transferToSubaccount({
                                        amount,
                                        destinationUserId,
                                        reference,
                                    }: {
    amount: number;
    destinationUserId: string;
    reference: string;
}) {
    const response = await fetch("https://api.xendit.co/transfers", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization:
                "Basic " +
                Buffer.from(`${XENDIT_SECRET_KEY}:`).toString("base64"),
        },
        body: JSON.stringify({
            reference,
            amount,
            source_user_id: XENDIT_MAIN_ACCOUNT_ID,
            destination_user_id: destinationUserId,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Transfer failed: ${JSON.stringify(data)}`);
    }

    return data;
}

/* -------------------------------------------------------------------------- */
/* WEBHOOK HANDLER                                                            */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
    let conn: mysql.Connection | null = null;

    try {
        /* ---------------- VERIFY TOKEN ---------------- */

        const token = req.headers.get("x-callback-token");

        if (token !== XENDIT_WEBHOOK_TOKEN) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        /* ---------------- PARSE PAYLOAD ---------------- */

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

        /* ---------------- FETCH TRANSACTION ---------------- */

        const {
            grossAmount,
            gatewayFee,
            gatewayVAT,
            gatewayWithholdingTax,
            gatewayThirdPartyWithholding,
            netAmount,
            settlementStatus,
            transactionStatus,
        } = await fetchTransactionDetails(payment_id, paidAmount);

        const isSettled = settlementStatus === "SETTLED";

        /* ---------------- DB ---------------- */

        conn = await getDbConnection();
        await conn.beginTransaction();

        const [rows]: any = await conn.execute(
            `
            SELECT 
                b.billing_id,
                b.lease_id,
                p.property_id,
                p.property_name,
                un.unit_name,
                l.xendit_account_id,
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

        /* ---------------- DUPLICATE CHECK ---------------- */

        const [existing]: any = await conn.execute(
            `SELECT transfer_reference_id 
             FROM Payment 
             WHERE gateway_transaction_ref = ? LIMIT 1`,
            [payment_id]
        );

        if (existing.length && existing[0].transfer_reference_id) {
            await conn.rollback();
            return NextResponse.json({ message: "Already transferred" });
        }

        /* ---------------- UPDATE BILLING ---------------- */

        await conn.execute(
            `UPDATE Billing SET status='paid', paid_at=? WHERE billing_id=?`,
            [paidAt, billing_id]
        );

        /* ---------------- INSERT PAYMENT ---------------- */

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
                gross_amount,
                payment_method_id,
                payment_status,
                receipt_reference,
                payment_date,
                raw_gateway_payload,
                gateway_transaction_ref,
                gateway_fee,
                gateway_vat,
                gateway_withholding_tax,
                gateway_third_party_withholding,
                net_amount,
                gateway_settlement_status,
                gateway_settled_at,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NOW(), NOW())
            `,
            [
                billing.lease_id,
                billing_id,
                paymentType,
                paidAmount,
                grossAmount,
                payment_channel || null,
                invoice_id,
                paidAt,
                JSON.stringify(payload),
                payment_id,
                gatewayFee,
                gatewayVAT,
                gatewayWithholdingTax,
                gatewayThirdPartyWithholding,
                netAmount,
                settlementStatus,
            ]
        );

        /* ---------------- CONDITIONAL TRANSFER ---------------- */

        if (isSettled) {
            const transfer = await transferToSubaccount({
                amount: netAmount || paidAmount,
                destinationUserId: billing.xendit_account_id,
                reference: `transfer-${billing_id}`,
            });

            await conn.execute(
                `UPDATE Payment 
                 SET transfer_reference_id = ?, payout_status='paid'
                 WHERE gateway_transaction_ref = ?`,
                [transfer.reference || transfer.id, payment_id]
            );
        } else {
            console.log("⏳ Settlement not ready → skipping transfer");
        }

        /* ---------------- NOTIFICATION ---------------- */

        const first = safeDecrypt(billing.tenant_first_name);
        const last = safeDecrypt(billing.tenant_last_name);

        await sendUserNotification({
            userId: billing.landlord_user_id,
            title: "💰 Rent Payment Received",
            body: `${first} ${last} paid ₱${paidAmount.toLocaleString("en-PH")}`,
            url: `/pages/landlord/properties/${billing.property_id}/payments?id=${billing.property_id}`,
            conn,
        });

        await conn.commit();

        return NextResponse.json({
            message: isSettled
                ? "Payment + transfer completed"
                : "Payment recorded (awaiting settlement)",
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