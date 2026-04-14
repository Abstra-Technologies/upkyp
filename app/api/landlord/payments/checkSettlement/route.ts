export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import crypto from "crypto";

const { XENDIT_TRANSBAL_KEY } = process.env;

/**
 * 🔐 DB Connection
 */
async function getDbConnection() {
    console.log("[STAGE 1] Connecting to DB...");
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
    console.log("[STAGE 1] DB connected");
    return conn;
}

/**
 * 🔐 Fetch transaction
 */
async function fetchTransaction({
                                    reference,
                                    forUserId,
                                }: {
    reference: string;
    forUserId: string;
}) {
    console.log("[XENDIT] Fetching reference:", reference);
    console.log("[XENDIT] for-user-id:", forUserId);

    const res = await fetch(
        `https://api.xendit.co/transactions?product_id=${reference}`,
        {
            method: "GET",
            headers: {
                Authorization:
                    "Basic " +
                    Buffer.from(`${XENDIT_TRANSBAL_KEY}:`).toString("base64"),
                "for-user-id": forUserId,
            },
        }
    );

    const text = await res.text();

    console.log("[XENDIT] Status:", res.status);
    console.log("[XENDIT] Raw:", text.substring(0, 300));

    if (!res.ok) {
        throw new Error(`Xendit error: ${res.status}`);
    }

    const parsed = JSON.parse(text);
    const tx = parsed.data?.[0];

    if (!tx) {
        console.log("[XENDIT] No transaction found");
        return { status: "PENDING", amount: 0, fee: {} };
    }

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
    let conn: mysql.Connection | null = null;

    try {
        const { searchParams } = new URL(req.url);
        const landlord_id = searchParams.get("landlord_id");

        console.log("[STAGE 0] landlord_id:", landlord_id);

        if (!landlord_id) {
            return NextResponse.json({ message: "Missing landlord_id" }, { status: 400 });
        }

        conn = await getDbConnection();

        /**
         * 🔐 Get landlord
         */
        console.log("[STAGE 2] Fetching landlord...");
        const [landlordRows]: any = await conn.execute(
            `SELECT * FROM Landlord WHERE landlord_id = ?`,
            [landlord_id]
        );

        if (!landlordRows.length) throw new Error("Landlord not found");

        const landlord = landlordRows[0];

        console.log("[STAGE 2] Landlord:", landlord.landlord_id);
        console.log("[STAGE 2] Xendit account:", landlord.xendit_account_id);

        /**
         * 🔐 Get payments
         */
        console.log("[STAGE 3] Fetching payments...");
        const [payments]: any = await conn.execute(
            `
            SELECT 
                p.payment_id,
                p.gateway_transaction_ref
            FROM Payment p
            JOIN LeaseAgreement la ON p.agreement_id = la.agreement_id
            JOIN Unit u ON la.unit_id = u.unit_id
            JOIN Property prop ON u.property_id = prop.property_id
            WHERE prop.landlord_id = ?
              AND p.payment_status = 'confirmed'
              AND (p.gateway_settlement_status IS NULL 
                   OR p.gateway_settlement_status != 'settled')
              AND p.gateway_transaction_ref IS NOT NULL
            `,
            [landlord_id]
        );

        console.log("[STAGE 3] Payments found:", payments.length);

        const results = [];
        let total = 0;

        for (const p of payments) {
            console.log("--------------------------------------------------");
            console.log("[STAGE 4] Processing payment:", p.payment_id);
            console.log("[STAGE 4] Reference:", p.gateway_transaction_ref);

            try {
                /**
                 * 🔐 Fetch Xendit
                 */
                const tx = await fetchTransaction({
                    reference: p.gateway_transaction_ref,
                    forUserId: landlord.xendit_account_id,
                });

                console.log("[STAGE 5] Settlement status:", tx.status);

                if (tx.status !== "SETTLED") {
                    console.log("[STAGE 5] Not settled, skipping");
                    results.push({
                        payment_id: p.payment_id,
                        status: "pending",
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

                console.log("[STAGE 6] Amount:", tx.amount);
                console.log("[STAGE 6] Fees:", fees);
                console.log("[STAGE 6] Net:", net);

                if (net <= 0) {
                    console.log("[STAGE 6] Invalid net amount");
                    results.push({
                        payment_id: p.payment_id,
                        status: "invalid_amount",
                    });
                    continue;
                }

                /**
                 * 🔐 Wallet
                 */
                console.log("[STAGE 7] Fetching wallet...");
                let [walletRows]: any = await conn.execute(
                    `SELECT * FROM LandlordWallet WHERE landlord_id = ?`,
                    [landlord_id]
                );

                let wallet = walletRows[0];

                if (!wallet) {
                    console.log("[STAGE 7] Creating wallet...");
                    const [insert]: any = await conn.execute(
                        `INSERT INTO LandlordWallet (landlord_id, available_balance) VALUES (?, 0)`,
                        [landlord_id]
                    );
                    wallet = { wallet_id: insert.insertId, available_balance: 0 };
                }

                const before = Number(wallet.available_balance);
                const after = before + net;

                console.log("[STAGE 7] Balance before:", before);
                console.log("[STAGE 7] Balance after:", after);

                /**
                 * 🔐 Ledger
                 */
                const key = generateLedgerKey(p.payment_id, landlord_id);

                console.log("[STAGE 8] Ledger key:", key);

                await conn.execute(
                    `
                    INSERT INTO LandlordWalletLedger
                    (wallet_id, type, amount, balance_before, balance_after, reference_type, reference_id, idempotency_key)
                    VALUES (?, 'credit', ?, ?, ?, 'payment', ?, ?)
                    `,
                    [wallet.wallet_id, net, before, after, p.payment_id, key]
                );

                await conn.execute(
                    `UPDATE LandlordWallet SET available_balance = ? WHERE wallet_id = ?`,
                    [after, wallet.wallet_id]
                );

                /**
                 * 🔐 Update Payment
                 */
                console.log("[STAGE 9] Updating payment...");
                await conn.execute(
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

                console.log("[STAGE 9] SUCCESS");

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

        console.log("[STAGE 10] DONE");
        console.log("[STAGE 10] Total credited:", total);

        return NextResponse.json({
            success: true,
            total_credited: total,
            results,
        });

    } catch (err: any) {
        console.error("[FATAL ERROR]:", err.message);
        return NextResponse.json({ message: err.message }, { status: 500 });
    } finally {
        if (conn) await conn.end();
    }
}