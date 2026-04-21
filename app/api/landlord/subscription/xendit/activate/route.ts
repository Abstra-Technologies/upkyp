import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import crypto from "crypto";

const XENDIT_INVOICE_API = "https://api.xendit.co/v2/invoices";
const XENDIT_RECURRING_API = "https://api.xendit.co/recurring/plans";

export async function POST(req: NextRequest) {
    let connection;

    try {
        const body = await req.json();

        const {
            landlord_id,
            plan_code,
            plan_name,
            amount,
            payment_token_id,
            customer_id,
            redirectUrl,
        } = body;

        if (!landlord_id) {
            return NextResponse.json({ error: "Missing landlord_id" }, { status: 400 });
        }

        const isLifetime = plan_code === "LIFETIME";

        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        const requestRef = `REF-${Date.now()}`;

        // ---------------------------------------------------------------------
        // 🟣 LIFETIME → INVOICE
        // ---------------------------------------------------------------------
        if (isLifetime) {
            const invoicePayload = {
                external_id: `lifetime-${landlord_id}-${Date.now()}`,
                amount,
                currency: "PHP",
                description: `${plan_name} Lifetime`,
                customer: { customer_id },
                success_redirect_url: redirectUrl.success,
                failure_redirect_url: redirectUrl.failure,
                cancel_redirect_url: redirectUrl.cancel,
            };

            const res = await fetch(XENDIT_INVOICE_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization:
                        "Basic " +
                        Buffer.from(`${process.env.XENDIT_TEXT_SECRET_KEY}:`).toString("base64"),
                },
                body: JSON.stringify(invoicePayload),
            });

            const data = await res.json();

            return NextResponse.json({
                type: "invoice",
                checkoutUrl: data.invoice_url,
            });
        }

        // ---------------------------------------------------------------------
        // 🔵 RECURRING → REQUIRE TOKEN
        // ---------------------------------------------------------------------
        if (!payment_token_id) {
            return NextResponse.json(
                { error: "Missing payment_token_id" },
                { status: 400 }
            );
        }

        const recurringPayload = {
            reference_id: `sub-${landlord_id}-${Date.now()}`,
            customer_id,
            currency: "PHP",
            amount,

            schedule: {
                interval: "MONTH",
                interval_count: 1,
                total_recurrence: 0,
                anchor_date: new Date().toISOString(),
            },

            payment_tokens: [
                {
                    payment_token_id,
                    rank: 1,
                },
            ],

            immediate_payment: true,
            failed_cycle_action: "RESUME",

            metadata: {
                landlord_id,
                plan_code,
            },
        };

        const res = await fetch(XENDIT_RECURRING_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization:
                    "Basic " +
                    Buffer.from(`${process.env.XENDIT_TEXT_SECRET_KEY}:`).toString("base64"),
                "api-version": "2026-01-01",
            },
            body: JSON.stringify(recurringPayload),
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json({ error: data }, { status: 500 });
        }

        return NextResponse.json({
            type: "subscription",
            subscriptionId: data.id,
            status: data.status,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    } finally {
        if (connection) await connection.end();
    }
}