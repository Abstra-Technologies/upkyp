import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHmac, timingSafeEqual } from "crypto";

function verifyWebhookSignature(payload: string, signature: string): boolean {
    const secret = process.env.DIDDIT_WEBHOOK_TOKEN;
    if (!secret) {
        console.warn("[DIDIT_WEBHOOK] DIDDIT_WEBHOOK_TOKEN not configured");
        return false;
    }

    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== signatureBuffer.length) {
        return false;
    }

    return timingSafeEqual(expectedBuffer, signatureBuffer);
}

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get("x-didit-signature") || req.headers.get("x-signature");

        if (!signature) {
            console.warn("[DIDIT_WEBHOOK] Missing signature header");
            return NextResponse.json({ error: "Missing signature" }, { status: 401 });
        }

        if (!verifyWebhookSignature(rawBody, signature)) {
            console.warn("[DIDIT_WEBHOOK] Invalid signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
        }

        const body = JSON.parse(rawBody);
        console.log("[DIDIT_WEBHOOK]", JSON.stringify(body, null, 2));

        const { session_id, status, vendor_data } = body;

        if (!session_id || !vendor_data) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const landlord_id = vendor_data;

        let dbStatus: string;
        switch (status) {
            case "approved":
            case "passed":
            case "completed":
                dbStatus = "approved";
                break;
            case "rejected":
            case "failed":
            case "denied":
                dbStatus = "rejected";
                break;
            case "pending":
            case "processing":
                dbStatus = "pending";
                break;
            default:
                dbStatus = "rejected";
        }

        await db.query(
            `
            UPDATE LandlordVerification
            SET status = ?, updated_at = NOW()
            WHERE didit_session_id = ? AND landlord_id = ?
            `,
            [dbStatus, session_id, landlord_id]
        );

        if (dbStatus === "approved") {
            await db.query(
                `UPDATE Landlord SET is_verified = 1 WHERE landlord_id = ?`,
                [landlord_id]
            );
        }

        console.log(`[DIDIT_WEBHOOK] Updated landlord ${landlord_id} to ${dbStatus}`);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[DIDIT_WEBHOOK_ERROR]", err);
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }
}
