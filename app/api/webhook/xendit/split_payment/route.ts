/* -------------------------------------------------------------------------- */
/* XENDIT SPLIT.PAYMENT WEBHOOK (FULL DEBUG VERSION)                         */
/* Uses List Transactions API by reference_id                                */
/* -------------------------------------------------------------------------- */

import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

/* -------------------------------------------------------------------------- */
/* ENV                                                                        */
/* -------------------------------------------------------------------------- */

const {
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    XENDIT_TEXT_WEBHOOK_TOKEN,
    XENDIT_TEST_TRANSBAL,
    XENDIT_TRANSBAL_KEY
} = process.env;

/* -------------------------------------------------------------------------- */
/* DEBUG HELPER                                                               */
/* -------------------------------------------------------------------------- */

function debug(stage: string, data?: any) {
    console.log(`\n==================== ${stage} ====================`);
    if (data !== undefined) {
        console.log(JSON.stringify(data, null, 2));
    }
}

/* -------------------------------------------------------------------------- */
/* DB CONNECTION                                                              */
/* -------------------------------------------------------------------------- */

async function getDbConnection() {
    debug("DB CONNECTING");
    const conn = await mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
    });
    debug("DB CONNECTED");
    return conn;
}

/* -------------------------------------------------------------------------- */
/* SPLIT WEBHOOK                                                              */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
    let conn: mysql.Connection | null = null;

    try {
        debug("WEBHOOK START");

        /* ---------------- VERIFY TOKEN ---------------- */
        const token = req.headers.get("x-callback-token");
        debug("TOKEN RECEIVED", token);

        if (token !== XENDIT_TEXT_WEBHOOK_TOKEN) {
            debug("TOKEN INVALID");
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        debug("TOKEN VERIFIED");

        /* ---------------- PARSE BODY ---------------- */
        const payload = await req.json();
        debug("PAYLOAD RECEIVED", payload);

        if (payload.event !== "split.payment") {
            debug("NOT split.payment EVENT");
            return NextResponse.json({ message: "Ignored" });
        }

        const splitData = payload.data;
        debug("SPLIT DATA", splitData);

        if (!splitData || splitData.reference_id !== "platform") {
            debug("NOT PLATFORM SPLIT");
            return NextResponse.json({ message: "Ignored (not platform split)" });
        }

        const commissionAmount = Number(splitData.amount);
        const billingReference = splitData.payment_reference_id;
        const billing_id = billingReference.replace("billing-", "");

        debug("EXTRACTED VALUES", {
            commissionAmount,
            billingReference,
            billing_id,
        });

        /* ------------------------------------------------------------------
           1️⃣ Fetch Transaction by reference_id
        ------------------------------------------------------------------ */

        debug("CALLING TRANSACTIONS API");

        /* ------------------------------------------------------------------
   Fetch PAYMENT transaction from landlord account
------------------------------------------------------------------ */

        const txResp = await fetch(
            `https://api.xendit.co/transactions?product_id=${splitData.payment_id}`,
            {
                headers: {
                    Authorization:
                        "Basic " +
                        Buffer.from(`${XENDIT_TRANSBAL_KEY}:`).toString("base64"),
                    "for-user-id": splitData.source_account_id,
                },
            }
        );

        if (!txResp.ok) {
            const errText = await txResp.text();
            throw new Error(`Transaction API error: ${errText}`);
        }

        const txData = await txResp.json();

        if (!Array.isArray(txData.data) || txData.data.length === 0) {
            throw new Error("No PAYMENT transaction found");
        }

        const mainTransaction =
            txData.data.find((tx: any) => tx.type === "PAYMENT") ||
            txData.data[0];

        const gatewayFee = Number(mainTransaction.fee?.xendit_fee || 0);
        const gatewayVAT = Number(mainTransaction.fee?.value_added_tax || 0);
        const netAfterGateway = Number(mainTransaction.net_amount || 0);
        const finalNet = netAfterGateway - commissionAmount;

        debug("COMPUTED VALUES", {
            gatewayFee,
            gatewayVAT,
            platformFee: commissionAmount,
            netAfterGateway,
            finalNet,
        });

        /* ------------------------------------------------------------------
           2️⃣ Update Payment Table
        ------------------------------------------------------------------ */

        conn = await getDbConnection();
        await conn.beginTransaction();
        debug("DB TRANSACTION STARTED");

        const [rows]: any = await conn.execute(
            `
            SELECT payment_id
            FROM Payment
            WHERE bill_id = ?
            ORDER BY payment_id DESC
            LIMIT 1
            `,
            [billing_id]
        );

        debug("PAYMENT QUERY RESULT", rows);

        if (!rows.length) {
            debug("NO PAYMENT ROW FOUND");
            await conn.rollback();
            return NextResponse.json({ message: "Payment not found" }, { status: 404 });
        }

        const paymentId = rows[0].payment_id;
        debug("PAYMENT ID TO UPDATE", paymentId);

        const [updateResult]: any = await conn.execute(
            `
            UPDATE Payment
            SET 
                platform_fee = ?,
                gateway_fee = ?,
                gateway_vat = ?,
                net_amount = ?
            WHERE payment_id = ?
            `,
            [
                commissionAmount,
                gatewayFee,
                gatewayVAT,
                finalNet,
                paymentId,
            ]
        );

        debug("UPDATE RESULT", updateResult);

        await conn.commit();
        debug("DB TRANSACTION COMMITTED");

        return NextResponse.json({
            message: "Split + reconciliation complete",
        });

    } catch (err: any) {
        debug("ERROR OCCURRED", {
            message: err.message,
            stack: err.stack,
        });

        if (conn) {
            await conn.rollback();
            debug("DB TRANSACTION ROLLED BACK");
        }

        return NextResponse.json(
            { message: "Split webhook failed", error: err.message },
            { status: 500 }
        );

    } finally {
        if (conn) {
            await conn.end();
            debug("DB CONNECTION CLOSED");
        }

        debug("WEBHOOK END");
    }
}
