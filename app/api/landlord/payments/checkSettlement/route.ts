export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";
import crypto from "crypto";

const XENDIT_SECRET = process.env.XENDIT_TEST_TRANSBAL || process.env.XENDIT_API_KEY;

/**
 * 🔐 Fetch transaction by ID from Xendit
 */
async function fetchTransactionById(transactionId: string, forUserId?: string) {
    const headers: Record<string, string> = {
        Authorization: "Basic " + Buffer.from(`${XENDIT_SECRET}:`).toString("base64"),
    };

    if (forUserId) {
        headers["for-user-id"] = forUserId;
    }

    const res = await fetch(
        `https://api.xendit.co/transactions/${transactionId}`,
        {
            method: "GET",
            headers,
        }
    );

    if (!res.ok) {
        const text = await res.text();
        console.log("[XENDIT] Error:", res.status, text.substring(0, 300));
        return null;
    }

    const tx = await res.json();
    console.log("[XENDIT] Found TX:", tx.id, "Status:", tx.status);

    return {
        status: tx.status,
        amount: Number(tx.amount || 0),
        fee: tx.fee || {},
    };
}

/**
 * 🔐 Ledger key
 */
function generateLedgerKey(paymentId: number, landlordId: string) {
    return crypto
        .createHash("sha256")
        .update(`ledger-${landlordId}-payment-${paymentId}`)
        .digest("hex");
}

/**
 * ✅ MAIN API
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getSessionUser();
        if (!session || session.userType !== "landlord") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const landlord_id = session.landlord_id;
        if (!landlord_id) {
            return NextResponse.json({ error: "Missing landlord context" }, { status: 400 });
        }

        /**
         * 🔐 Get landlord xendit_account_id
         */
        const [landlordRows]: any = await db.query(
            `SELECT landlord_id, xendit_account_id FROM Landlord WHERE landlord_id = ?`,
            [landlord_id]
        );

        if (!landlordRows.length) {
            return NextResponse.json({ error: "Landlord not found" }, { status: 404 });
        }

        const landlord = landlordRows[0];

        /**
         * 🔐 Get payments pending settlement
         */
        const [payments]: any = await db.query(
            `
            SELECT 
                p.payment_id,
                p.transaction_id,
                p.gateway_transaction_ref,
                p.gateway_settlement_status,
                p.amount_paid
            FROM Payment p
            JOIN LeaseAgreement la ON p.agreement_id = la.agreement_id
            JOIN Unit u ON la.unit_id = u.unit_id
            JOIN Property prop ON u.property_id = prop.property_id
            WHERE prop.landlord_id = ?
              AND p.payment_status = 'confirmed'
              AND (p.gateway_settlement_status IS NULL 
                   OR p.gateway_settlement_status != 'settled')
              AND (p.transaction_id IS NOT NULL OR p.gateway_transaction_ref IS NOT NULL)
            `,
            [landlord_id]
        );

        console.log("[SETTLEMENT] Payments found:", payments.length);

        const results = [];
        let total = 0;

        for (const p of payments) {
            console.log("--------------------------------------------------");
            console.log("[SETTLEMENT] Processing payment:", p.payment_id);

            try {
                /**
                 * 🔐 Check gateway_settlement_status first (skip API call if already known)
                 */
                if (p.gateway_settlement_status === "settled") {
                    results.push({
                        payment_id: p.payment_id,
                        status: "already_settled",
                    });
                    continue;
                }

                const idsToTry = [
                    { source: "transaction_id", value: p.transaction_id },
                    { source: "gateway_transaction_ref", value: p.gateway_transaction_ref },
                ].filter(id => id.value && id.value.startsWith("txn_"));

                if (idsToTry.length === 0) {
                    console.log("[SETTLEMENT] No valid Xendit transaction ID found");
                    results.push({
                        payment_id: p.payment_id,
                        status: "missing_id",
                    });
                    continue;
                }

                let tx = null;
                let usedId = null;

                for (const idObj of idsToTry) {
                    console.log(`[SETTLEMENT] Trying ${idObj.source}: ${idObj.value}`);
                    try {
                        tx = await fetchTransactionById(idObj.value, landlord.xendit_account_id);
                        if (tx) {
                            usedId = idObj.value;
                            break;
                        }
                    } catch (err) {
                        console.log(`[SETTLEMENT] Failed with ${idObj.source}:`, err.message);
                    }
                }

                if (!tx) {
                    console.log("[SETTLEMENT] Transaction not found in Xendit with any available ID");
                    results.push({
                        payment_id: p.payment_id,
                        status: "not_found",
                    });
                    continue;
                }

                console.log("[SETTLEMENT] Xendit status:", tx.status, "(using ID:", usedId, ")");

                if (tx.status !== "SETTLED") {
                    results.push({
                        payment_id: p.payment_id,
                        status: "pending",
                        xendit_status: tx.status,
                    });
                    continue;
                }

                /**
                 * 🔐 Compute net
                 */
                const fees =
                    (tx.fee?.xendit_fee || 0) +
                    (tx.fee?.value_added_tax || 0) +
                    (tx.fee?.xendit_withholding_tax || 0) +
                    (tx.fee?.third_party_withholding_tax || 0);

                const net = Math.max(tx.amount - fees, 0);

                console.log("[SETTLEMENT] Amount:", tx.amount, "Fees:", fees, "Net:", net);

                if (net <= 0) {
                    results.push({
                        payment_id: p.payment_id,
                        status: "invalid_amount",
                    });
                    continue;
                }

                /**
                 * 🔐 Wallet
                 */
                let [walletRows]: any = await db.query(
                    `SELECT * FROM LandlordWallet WHERE landlord_id = ?`,
                    [landlord_id]
                );

                let wallet = walletRows[0];

                if (!wallet) {
                    const [insert]: any = await db.query(
                        `INSERT INTO LandlordWallet (landlord_id, available_balance) VALUES (?, 0)`,
                        [landlord_id]
                    );
                    wallet = { wallet_id: insert.insertId, available_balance: 0 };
                }

                const before = Number(wallet.available_balance);
                const after = before + net;

                /**
                 * 🔐 Ledger
                 */
                const key = generateLedgerKey(p.payment_id, landlord_id);

                await db.query(
                    `
                    INSERT INTO LandlordWalletLedger
                    (wallet_id, type, amount, balance_before, balance_after, reference_type, reference_id, idempotency_key)
                    VALUES (?, 'credit', ?, ?, ?, 'payment', ?, ?)
                    `,
                    [wallet.wallet_id, net, before, after, p.payment_id, key]
                );

                await db.query(
                    `UPDATE LandlordWallet SET available_balance = ? WHERE wallet_id = ?`,
                    [after, wallet.wallet_id]
                );

                /**
                 * 🔐 Update Payment
                 */
                await db.query(
                    `
                    UPDATE Payment
                    SET 
                        gateway_settlement_status = 'settled',
                        gateway_settled_at = NOW(),
                        net_amount = ?
                    WHERE payment_id = ?
                    `,
                    [net, p.payment_id]
                );

                total += net;

                results.push({
                    payment_id: p.payment_id,
                    status: "settled",
                    net,
                    balance_after: after,
                });

            } catch (err: any) {
                console.error("[ERROR] Payment failed:", err.message);

                results.push({
                    payment_id: p.payment_id,
                    status: "error",
                    error: err.message,
                });
            }
        }

        console.log("[SETTLEMENT] DONE. Total credited:", total);

        return NextResponse.json({
            success: true,
            total_credited: total,
            results,
        });

    } catch (err: any) {
        console.error("[FATAL ERROR]:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}