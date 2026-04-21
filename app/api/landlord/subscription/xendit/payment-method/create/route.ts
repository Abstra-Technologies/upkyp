import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// for recurring subscription except for onetime/lifetime.

const XENDIT_PAYMENT_REQUEST_API = "https://api.xendit.co/v3/payment_requests";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const {
            landlord_id,
            amount,
            plan_code,
            success_url,
            failure_url,
            customer_id,
        } = body;

        if (!landlord_id || !amount || !customer_id) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const referenceId = `pay-save-${landlord_id}-${Date.now()}`;

        const payload = {
            reference_id: referenceId,
            type: "PAY_AND_SAVE",
            currency: "PHP",
            request_amount: Number(amount),
            customer_id,

            channel_code: "CARD",

            channel_properties: {
                success_return_url: success_url,
                failure_return_url: failure_url,
            },

            metadata: {
                landlord_id,
                plan_code,
            },
        };

        const response = await fetch(XENDIT_PAYMENT_REQUEST_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization:
                    "Basic " +
                    Buffer.from(`${process.env.XENDIT_TEXT_SECRET_KEY}:`).toString("base64"),
                "api-version": "2024-11-11",
                "Idempotency-Key": crypto.randomUUID(),
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data }, { status: 500 });
        }

        return NextResponse.json({
            checkoutUrl: data.actions?.[0]?.url,
            payment_request_id: data.payment_request_id,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}