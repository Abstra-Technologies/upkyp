/* -------------------------------------------------------------------------- */
/* XENDIT INVOICE.PAID WEBHOOK (WITH TRANSFER TO SUBACCOUNT)                  */
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
    XENDIT_SECRET_KEY, // 🔥 added for transfer
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
/* FETCH TRANSACTION                                                          */
/* -------------------------------------------------------------------------- */

// async function fetchTransactionDetails(
//     transactionId: string,
//     subAccountId: string
// ) {
//     const response = await fetch(
//         `https://api.xendit.co/transactions?product_id=${transactionId}`,
//         {
//             method: "GET",
//             headers: {
//                 Authorization:
//                     "Basic " +
//                     Buffer.from(`${XENDIT_TRANSBAL_KEY}:`).toString("base64"),
//                 "for-user-id": subAccountId,
//             },
//         }
//     );
//
//     if (!response.ok) {
//         const errText = await response.text();
//         throw new Error(`Transaction API error: ${errText}`);
//     }
//
//     const tx = await response.json();
//
//     return {
//         gatewayFee: Number(tx.fee?.xendit_fee || 0),
//         gatewayVAT: Number(tx.fee?.value_added_tax || 0),
//         netAmount: Number(tx.net_amount || 0),
//     };
// }

async function fetchTransactionDetails(
    transactionId: string
) {
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

    return {
        gatewayFee: Number(tx.fee?.xendit_fee || 0),
        gatewayVAT: Number(tx.fee?.value_added_tax || 0),
        netAmount: Number(tx.net_amount || 0),
    };
}



/* -------------------------------------------------------------------------- */
/* 🔥 TRANSFER FUNCTION                                                       */
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
                Buffer.from(`${process.env.XENDIT_SECRET_KEY}:`).toString("base64"),
        },
        body: JSON.stringify({
            reference,
            amount,

            // 🔥 REQUIRED NOW
            source_user_id: process.env.XENDIT_MAIN_ACCOUNT_ID,
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
            user_id,
            paid_amount,
            amount,
            id: invoice_id,
            payment_channel,
            ewallet_type,
            payment_method,
            payment_method_id,
            description,
        } = payload;

        if (!payment_id || !user_id) {
            throw new Error("Missing payment_id or user_id");
        }

        if (!external_id || !external_id.startsWith("billing-")) {
            throw new Error("Invalid external_id");
        }

        const billing_id = external_id.replace("billing-", "");
        const paidAmount = Number(paid_amount || amount);
        const paidAt = new Date(paid_at);

        /* ---------------- FETCH TRANSACTION DETAILS ---------------- */

        const { gatewayFee, gatewayVAT, netAmount } =
            await fetchTransactionDetails(payment_id, user_id);

        /* ---------------- DB TRANSACTION ---------------- */

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
                l.xendit_account_id, -- 🔥 added
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

        const destinationUserId = billing.xendit_account_id;

        if (!destinationUserId) {
            throw new Error("Missing landlord subaccount ID");
        }

        /* ---------------- DECRYPT TENANT NAME ---------------- */

        const decryptedFirstName = safeDecrypt(billing.tenant_first_name);
        const decryptedLastName = safeDecrypt(billing.tenant_last_name);

        const tenantFullName = `${decryptedFirstName} ${decryptedLastName}`;

        /* ---------------- PREVENT DUPLICATE ---------------- */

        const [existing]: any = await conn.execute(
            `SELECT payment_id FROM Payment WHERE gateway_transaction_ref = ? LIMIT 1`,
            [payment_id]
        );

        if (existing.length) {
            await conn.rollback();
            return NextResponse.json({ message: "Already processed" });
        }

        /* ---------------- UPDATE BILLING ---------------- */

        await conn.execute(
            `UPDATE Billing SET status='paid', paid_at=? WHERE billing_id=?`,
            [paidAt, billing_id]
        );

        /* ---------------- INSERT PAYMENT ---------------- */

        const paymentType = JSON.stringify({
            payment_channel: payment_channel || null,
            ewallet_type: ewallet_type || null,
            payment_method: payment_method || null,
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

        /* ---------------- 🔥 TRANSFER TO SUBACCOUNT ---------------- */

        await transferToSubaccount({
            amount: paidAmount,
            destinationUserId,
            reference: `transfer-bill-id-${billing_id}`,
        });

        /* ---------------- NOTIFICATION ---------------- */

        await sendUserNotification({
            userId: billing.landlord_user_id,
            title: "💰 Rent Payment Received",
            body: `${tenantFullName} from ${billing.property_name} - ${billing.unit_name} paid ₱${paidAmount.toLocaleString(
                "en-PH",
                { minimumFractionDigits: 2 }
            )}.`,
            url: `/pages/landlord/properties/${billing.property_id}/payments?id=${billing.property_id}`,
            conn,
        });

        await conn.commit();

        return NextResponse.json({
            message: "Invoice reconciliation + transfer complete",
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