import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cacheLife, cacheTag } from "next/cache";

async function getCachedPaymentSummary(landlord_id: string) {
    "use cache";
    cacheLife("hours");
    cacheTag(`payment-summary-${landlord_id}`);

    const [[collected]]: any = await db.query(
        `
      SELECT COALESCE(SUM(COALESCE(NULLIF(p.net_amount, 0), p.amount_paid)), 0) AS totalCollected
      FROM Payment p
      INNER JOIN LeaseAgreement la ON la.agreement_id = p.agreement_id
      INNER JOIN Unit u ON la.unit_id = u.unit_id
      INNER JOIN Property pr ON pr.property_id = u.property_id
      WHERE pr.landlord_id = ?
        AND p.payment_status = 'confirmed'
        AND YEAR(p.created_at) = YEAR(CURDATE())
      `,
        [landlord_id]
    );

    const [[disbursed]]: any = await db.query(
        `
      SELECT COALESCE(SUM(amount), 0) AS totalDisbursed
      FROM LandlordPayoutHistory
      WHERE landlord_id = ?
        AND status = 'SUCCEEDED'
      `,
        [landlord_id]
    );

    const [[pending]]: any = await db.query(
        `
      SELECT COALESCE(SUM(COALESCE(NULLIF(p.net_amount, 0), p.amount_paid)), 0) AS pendingPayouts
      FROM Payment p
      INNER JOIN LeaseAgreement la ON la.agreement_id = p.agreement_id
      INNER JOIN Unit u ON u.unit_id = la.unit_id
      INNER JOIN Property pr ON pr.property_id = u.property_id
      WHERE pr.landlord_id = ?
        AND p.payment_status = 'confirmed'
        AND p.payout_status IN ('unpaid', 'in_payout')
      `,
        [landlord_id]
    );

    return {
        success: true,
        totalCollected: Number(collected.totalCollected),
        totalDisbursed: Number(disbursed.totalDisbursed),
        pendingPayouts: Number(pending.pendingPayouts),
    };
}

export async function GET(req: NextRequest) {
    try {
        const landlord_id = req.nextUrl.searchParams.get("landlord_id");

        if (!landlord_id) {
            return NextResponse.json(
                { error: "landlord_id is required" },
                { status: 400 }
            );
        }

        const result = await getCachedPaymentSummary(landlord_id);
        return NextResponse.json(result);
    } catch (err) {
        console.error("❌ [PAYMENT SUMMARY] ERROR:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}