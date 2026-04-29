/* -------------------------------------------------------------------------- */
/* XENDIT PAYMENT CAPTURE WEBHOOK (Payment Request v3)                        */
/* -------------------------------------------------------------------------- */
/* Handles:                                                                    */
/* - payment.capture.completed: Payment captured successfully                 */
/* - payment.capture.failed: Payment capture failed                           */

export const runtime = "nodejs";

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
} = process.env;

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                     */
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
/* EVENT HANDLERS                                                             */
/* -------------------------------------------------------------------------- */

async function handlePaymentCaptureCompleted(conn: mysql.Connection, data: any) {
    const {
        id,
        reference_id,
        customer_id,
        payment_request_id,
        payment_method_id,
        payment_method_type,
        card_last4,
        card_exp_month,
        card_exp_year,
        amount,
        currency,
        status,
    } = data;

    console.log("[PAYMENT CAPTURE WEBHOOK] Payment captured:", {
        id,
        reference_id,
        customer_id,
        payment_method_id,
        payment_method_type,
        card_last4,
        amount,
        status
    });

    // Find landlord by xendit_customer_id
    if (!customer_id) {
        console.log("[PAYMENT CAPTURE WEBHOOK] No customer_id provided");
        return { processed: false, message: "No customer_id provided" };
    }

    // Update Landlord with payment method details
    const updateFields: string[] = [];
    const params: any[] = [];

    if (payment_method_id) {
        updateFields.push("payment_token_id = ?");
        params.push(payment_method_id);
    }

    if (payment_method_type) {
        updateFields.push("payment_method_type = ?");
        params.push(payment_method_type);
    }

    if (card_last4) {
        updateFields.push("payment_method_last4 = ?");
        params.push(card_last4);
    }

    if (updateFields.length === 0) {
        return { processed: false, message: "No payment method data to update" };
    }

    // Update Landlord
    const [result] = await conn.execute<mysql.ResultSetHeader>(
        `UPDATE Landlord SET ${updateFields.join(", ")} WHERE xendit_customer_id = ?`,
        [...params, customer_id]
    );

    console.log("[PAYMENT CAPTURE WEBHOOK] Landlord updated:", { affectedRows: result.affectedRows });

    return {
        processed: true,
        message: "Payment capture recorded",
        payment_capture_id: id,
        updated: result.affectedRows > 0
    };
}

async function handlePaymentCaptureFailed(conn: mysql.Connection, data: any) {
    const { id, customer_id, failure_reason } = data;

    console.log("[PAYMENT CAPTURE WEBHOOK] Payment capture failed:", {
        id,
        customer_id,
        failure_reason
    });

    // Log the failure but don't update payment method
    // Could optionally mark something in landlord if needed

    return {
        processed: true,
        message: "Payment capture failure logged",
        payment_capture_id: id,
        failure_reason
    };
}

/* -------------------------------------------------------------------------- */
/* WEBHOOK HANDLER                                                            */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
    let conn: mysql.Connection | null = null;

    try {
        const token = req.headers.get("x-callback-token");

        if (!token || token !== XENDIT_TEXT_WEBHOOK_TOKEN) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const payload = await req.json();
        const eventType = payload.event;

        console.log("[PAYMENT CAPTURE WEBHOOK] Received event:", eventType, payload);

        conn = await getDbConnection();
        await conn.beginTransaction();

        let response: any;

        switch (eventType) {
            case "payment.capture.completed":
                response = await handlePaymentCaptureCompleted(conn, payload.data || payload);
                break;

            case "payment.capture.failed":
                response = await handlePaymentCaptureFailed(conn, payload.data || payload);
                break;

            default:
                console.log("[PAYMENT CAPTURE WEBHOOK] Ignored event type:", eventType);
                await conn.commit();
                return NextResponse.json({ message: "Ignored event type", event: eventType });
        }

        await conn.commit();

        return NextResponse.json({
            message: response.message || "Event processed successfully",
            event: eventType,
            ...response,
        });

    } catch (err: any) {
        if (conn) await conn.rollback();

        console.error("[PAYMENT CAPTURE WEBHOOK] Error:", err.message);

        return NextResponse.json(
            { message: "Webhook failed", error: err.message },
            { status: 500 }
        );
    } finally {
        if (conn) await conn.end();
    }
}