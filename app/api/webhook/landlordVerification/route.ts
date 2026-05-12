import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

export const runtime = "nodejs"; // ← Important for raw body in Vercel/edge cases

// ────────────────────────────────────────────────
// Helper: stable canonical JSON (Didit style)
function canonicalize(payload: any): string {
    const stableStringify = (obj: any): string => {
        if (obj === null || obj === undefined) return "null";
        if (typeof obj !== "object") return JSON.stringify(obj);

        if (Array.isArray(obj)) {
            return `[${obj.map(stableStringify).join(",")}]`;
        }

        const sortedKeys = Object.keys(obj).sort();
        const parts: string[] = [];
        for (const key of sortedKeys) {
            parts.push(JSON.stringify(key) + ":" + stableStringify(obj[key]));
        }
        return "{" + parts.join(",") + "}";
    };

    return stableStringify(payload);
}

// ────────────────────────────────────────────────
// Simple signature – align closer to Didit demo (includes created_at if present)
function verifySignatureSimple(
    payload: any,
    timestamp: number | string,
    receivedSignature: string,
    secret: string
): boolean {
    // Didit demo often uses: session_id | status | created_at
    // Adjust based on your actual payload fields
    const fields = [
        String(payload.session_id ?? ""),
        String(payload.status ?? ""),
        String(payload.created_at ?? ""), // ← Add this if present in real payload
        // webhook_type is sometimes included — test both variants
    ].filter(Boolean).join("|"); // Didit uses | separator in some examples

    const canonical = `${timestamp}:${fields}`;

    const expected = crypto
        .createHmac("sha256", secret)
        .update(canonical, "utf-8")
        .digest("hex");

    return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(receivedSignature)
    );
}

// ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const rawBody = await req.text(); // keep raw for original signature if needed

    let payload: any;
    try {
        payload = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ ok: true });
    }

    // Quick ack for test webhooks
    if (req.headers.get("x-didit-test-webhook") === "true") {
        console.log("Test webhook acknowledged");
        return NextResponse.json({ ok: true });
    }

    const secret = process.env.DIDIT_WEBHOOK_SECRET_KEY;
    if (!secret) {
        console.error("Missing DIDIT_WEBHOOK_SECRET_KEY in environment");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const timestampStr = req.headers.get("x-timestamp");
    if (!timestampStr) {
        console.warn("Missing x-timestamp header");
        return NextResponse.json({ error: "Unauthorized – missing timestamp" }, { status: 401 });
    }

    const timestamp = Number(timestampStr);
    if (isNaN(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) { // 5 min window
        console.warn("Invalid or stale timestamp");
        return NextResponse.json({ error: "Unauthorized – invalid timestamp" }, { status: 401 });
    }

    // Headers (Didit sends all three)
    const sigSimple   = req.headers.get("x-signature-simple");
    const sigV2       = req.headers.get("x-signature-v2");
    const sigOriginal = req.headers.get("x-signature"); // ← Add this

    let verified = false;

    // Priority: V2 (recommended) → Simple → Original (raw body)
    if (sigV2) {
        const canonical = canonicalize(payload);
        const expected = crypto.createHmac("sha256", secret).update(canonical, "utf-8").digest("hex");
        verified = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sigV2));
    }

    if (!verified && sigSimple) {
        verified = verifySignatureSimple(payload, timestamp, sigSimple, secret);
    }

    if (!verified && sigOriginal) {
        // Raw body HMAC (fragile but sometimes needed)
        const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf-8").digest("hex");
        verified = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sigOriginal));
    }

    if (!verified) {
        console.warn("DIDIT WEBHOOK SIGNATURE VERIFICATION FAILED", {
            receivedSimple: !!sigSimple,
            receivedV2: !!sigV2,
            receivedOriginal: !!sigOriginal,
            timestamp,
        });
        return NextResponse.json({ error: "Unauthorized – invalid signature" }, { status: 401 });
    }

    // ────────────────────────────────────────────────
    // Rest of your logic (payload validation, DB update) remains the same
    // ...
}