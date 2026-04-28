import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const session_id = searchParams.get("session_id");
        const status = searchParams.get("status");
        const vendor_data = searchParams.get("vendor_data");

        console.log("[DIDIT_CALLBACK]", { session_id, status, vendor_data });

        if (!session_id || !vendor_data) {
            console.error("[DIDIT_CALLBACK] Missing required params");
            return NextResponse.redirect(
                new URL("/landlord/verification?error=invalid_callback", req.url)
            );
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

        console.log(`[DIDIT_CALLBACK] Updated landlord ${landlord_id} to ${dbStatus}`);

        const redirectUrl = dbStatus === "approved"
            ? "/landlord/verification?status=approved"
            : dbStatus === "pending"
                ? "/landlord/verification?status=pending"
                : "/landlord/verification?status=rejected";

        return NextResponse.redirect(new URL(redirectUrl, req.url));
    } catch (err) {
        console.error("[DIDIT_CALLBACK_ERROR]", err);
        return NextResponse.redirect(
            new URL("/landlord/verification?error=callback_failed", req.url)
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
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
