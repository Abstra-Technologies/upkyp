import { NextRequest, NextResponse } from "next/server";
import mysql, { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubscriptionRow = RowDataPacket & {
    subscription_id: number;
    payment_status: string;
    end_date: string;
};

export async function POST(req: NextRequest) {
    let connection: mysql.Connection | null = null;

    try {
        const body = await req.json();
        console.log("📩 Incoming Payment Status:", body);

        const requestReferenceNumber = String(body?.requestReferenceNumber || "").trim();
        const landlord_id = String(body?.landlord_id || "").trim();
        const plan_name = String(body?.plan_name || "").trim();
        const plan_code = String(body?.plan_code || plan_name.toUpperCase()).trim();
        const amount = Number(body?.amount ?? 0);
        const status = String(body?.status || "success").toLowerCase();

        if (!requestReferenceNumber || !landlord_id || !plan_name || !Number.isFinite(amount)) {
            return NextResponse.json(
                { error: "Missing or invalid parameters." },
                { status: 400 }
            );
        }

        const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
        connection = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME,
        });

        await connection.execute("SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE");
        await connection.beginTransaction();

        // 🔹 Check for idempotency
        const [existing] = await connection.execute<SubscriptionRow[]>(
            "SELECT subscription_id, payment_status FROM Subscription WHERE request_reference_number = ? LIMIT 1 FOR UPDATE",
            [requestReferenceNumber]
        );

        if (existing.length > 0) {
            await connection.commit();
            return NextResponse.json(
                {
                    message: `Subscription payment already processed (${existing[0].payment_status}).`,
                    requestReferenceNumber,
                    payment_status: existing[0].payment_status,
                },
                { status: 200 }
            );
        }

        // 🔹 Fetch the current active plan (if any)
        const [activeSubs] = await connection.execute<SubscriptionRow[]>(
            "SELECT subscription_id, end_date FROM Subscription WHERE landlord_id = ? AND is_active = 1 LIMIT 1 FOR UPDATE",
            [landlord_id]
        );

        const hasActivePlan = activeSubs.length > 0;
        const currentActiveId = hasActivePlan ? activeSubs[0].subscription_id : null;
        const currentEndDate = hasActivePlan ? new Date(activeSubs[0].end_date) : null;

        // 🔹 Determine validity of current active plan
        const now = new Date();
        const isCurrentPlanStillValid = currentEndDate ? currentEndDate >= now : false;

        // 🔹 Determine new subscription flags
        let payment_status = "paid";
        let is_active = 1;
        let message = "";

        switch (status) {
            case "failed":
                payment_status = "failed";
                is_active = 0;
                message = `Payment for ${plan_name} failed.`;
                break;
            case "cancelled":
                payment_status = "cancelled";
                is_active = 0;
                message = `Your payment for ${plan_name} was cancelled.`;
                break;
            default:
                payment_status = "paid";
                is_active = 1;
                message = `Subscription for ${plan_name} activated successfully.`;
                break;
        }

        // 🔹 Compute subscription dates
        const start_date = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .split("T")[0];
        const end = new Date(now);
        end.setMonth(end.getMonth() + 1);
        const end_date = new Date(end.getTime() - end.getTimezoneOffset() * 60000)
            .toISOString()
            .split("T")[0];

        // 🔹 Only deactivate old plan if payment succeeded
        if (status === "success") {
            await connection.execute(
                "UPDATE Subscription SET is_active = 0 WHERE landlord_id = ? AND is_active = 1",
                [landlord_id]
            );
        }

        // 🔹 Insert new subscription record (always record attempt)
        await connection.execute(
            `INSERT INTO Subscription
       (landlord_id, plan_name, plan_code, start_date, end_date, payment_status, created_at,
        request_reference_number, is_trial, amount_paid, is_active)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, 0, ?, ?)`,
            [
                landlord_id,
                plan_name,
                plan_code,
                start_date,
                end_date,
                payment_status,
                requestReferenceNumber,
                amount,
                is_active,
            ]
        );

        // 🔹 Maintain valid current plan if failed/cancelled
        if ((status === "failed" || status === "cancelled") && hasActivePlan && isCurrentPlanStillValid) {
            await connection.execute(
                "UPDATE Subscription SET is_active = 1 WHERE subscription_id = ?",
                [currentActiveId]
            );
            message += " Your existing active subscription remains valid.";
        }

        await connection.commit();

        return NextResponse.json(
            {
                message,
                requestReferenceNumber,
                status: payment_status,
            },
            { status: 200 }
        );
    } catch (err: any) {
        console.error("❌ Payment status API error:", err);
        if (connection) {
            try {
                await connection.rollback();
            } catch {}
        }
        const msg = err?.message || String(err);
        return NextResponse.json(
            { error: "Failed to process payment status.", details: msg },
            { status: 500 }
        );
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch {}
        }
    }
}

export async function GET() {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
