export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { db } from "@/lib/db";

const {
    XENDIT_TRANSBAL_KEY,
    XENDIT_SECRET_KEY,
    XENDIT_MAIN_ACCOUNT_ID,
} = process.env;

async function getDbConnection() {
    return mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
}

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

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");

    if (!landlord_id) {
        return NextResponse.json({ message: "landlord_id required" }, { status: 400 });
    }

    let conn: mysql.Connection | null = null;

    try {
        conn = await getDbConnection();

        const [rows]: any = await conn.execute(
            `
            SELECT 
                p.payment_id,
                p.gateway_transaction_ref,
                p.gross_amount,
                p.net_amount,
                p.gateway_settlement_status,
                p.transfer_reference_id,
                p.payout_status,
                l.xendit_account_id,
                b.billing_id
            FROM Payment p
            JOIN Billing b ON p.bill_id = b.billing_id
            JOIN LeaseAgreement la ON p.agreement_id = la.agreement_id
            JOIN Unit un ON la.unit_id = un.unit_id
            JOIN Property prop ON un.property_id = prop.property_id
            JOIN Landlord l ON prop.landlord_id = l.landlord_id
            WHERE l.landlord_id = ?
            AND p.gateway_settlement_status != 'SETTLED'
            AND p.payment_status = 'confirmed'
            AND (p.transfer_reference_id IS NULL OR p.payout_status != 'paid')
            ORDER BY p.created_at DESC
            LIMIT 20
            `,
            [landlord_id]
        );

        const results = [];

        for (const payment of rows) {
            try {
                const grossAmount = Number(payment.gross_amount || payment.net_amount || 0);
                const txDetails = await fetchTransactionDetails(payment.gateway_transaction_ref, grossAmount);
                const isSettled = txDetails.settlementStatus === "SETTLED";

                if (isSettled && !payment.transfer_reference_id) {
                    const transfer = await transferToSubaccount({
                        amount: txDetails.netAmount,
                        destinationUserId: payment.xendit_account_id,
                        reference: `transfer-${payment.billing_id}`,
                    });

                    await conn.execute(
                        `UPDATE Payment 
                         SET transfer_reference_id = ?, 
                             payout_status = 'paid', 
                             gateway_settlement_status = 'SETTLED',
                             gross_amount = ?,
                             gateway_fee = ?,
                             gateway_vat = ?,
                             gateway_withholding_tax = ?,
                             gateway_third_party_withholding = ?,
                             net_amount = ?
                         WHERE payment_id = ?`,
                        [
                            transfer.reference || transfer.id,
                            txDetails.grossAmount,
                            txDetails.gatewayFee,
                            txDetails.gatewayVAT,
                            txDetails.gatewayWithholdingTax,
                            txDetails.gatewayThirdPartyWithholding,
                            txDetails.netAmount,
                            payment.payment_id
                        ]
                    );

                    results.push({
                        payment_id: payment.payment_id,
                        status: "transferred",
                        settlement_status: "SETTLED",
                    });
                } else {
                    await conn.execute(
                        `UPDATE Payment 
                         SET gateway_settlement_status = ?,
                             gross_amount = ?,
                             gateway_fee = ?,
                             gateway_vat = ?,
                             gateway_withholding_tax = ?,
                             gateway_third_party_withholding = ?,
                             net_amount = ?
                         WHERE payment_id = ?`,
                        [
                            txDetails.settlementStatus,
                            txDetails.grossAmount,
                            txDetails.gatewayFee,
                            txDetails.gatewayVAT,
                            txDetails.gatewayWithholdingTax,
                            txDetails.gatewayThirdPartyWithholding,
                            txDetails.netAmount,
                            payment.payment_id
                        ]
                    );

                    results.push({
                        payment_id: payment.payment_id,
                        status: "pending",
                        settlement_status: txDetails.settlementStatus,
                    });
                }
            } catch (err: any) {
                results.push({
                    payment_id: payment.payment_id,
                    status: "error",
                    error: err.message,
                });
            }
        }

        return NextResponse.json({ results });

    } catch (err: any) {
        console.error("Settlement check error:", err);
        return NextResponse.json({ message: "Error checking settlement", error: err.message }, { status: 500 });
    } finally {
        if (conn) await conn.end();
    }
}
