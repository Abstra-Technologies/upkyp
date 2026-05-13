import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const landlord_id = req.nextUrl.searchParams.get("landlord_id");

    if (!landlord_id) {
        return NextResponse.json(
            { error: "Missing landlord_id" },
            { status: 400 }
        );
    }

    try {
        /* ------------------------------------------------------------------
           1. FETCH COMPLETED PAYOUT HISTORY
        ------------------------------------------------------------------ */
        const [payouts]: any = await db.query(
            `
      SELECT 
        payout_id,
        landlord_id,
        amount,
        payout_method,
        account_name,
        account_number,
        bank_name,
        status,
        included_payments,
        receipt_url,
        DATE_FORMAT(created_at, '%b %d, %Y') AS date
      FROM LandlordPayoutHistory
      WHERE landlord_id = ?
      ORDER BY payout_id DESC
      `,
            [landlord_id]
        );

        /* ------------------------------------------------------------------
           2. FETCH UNPAID PAYMENTS (ELIGIBLE FOR PAYOUT)
        ------------------------------------------------------------------ */
        const [pendingPayments]: any = await db.query(
            `
      SELECT
        p.payment_id,
        p.agreement_id,
        p.bill_id,
        p.payment_type,
        p.amount_paid,
        p.payment_method_id,
        p.receipt_reference,
        p.payment_date,
        p.created_at,
        p.payout_status,
        
        p.net_amount,
        

        u.unit_name,
        pr.property_name,
        t.tenant_id

      FROM Payment p
      LEFT JOIN Billing b ON p.bill_id = b.billing_id
      LEFT JOIN LeaseAgreement la ON p.agreement_id = la.agreement_id
      LEFT JOIN Unit u ON COALESCE(b.unit_id, la.unit_id) = u.unit_id
      LEFT JOIN Property pr ON u.property_id = pr.property_id
      LEFT JOIN Tenant t ON la.tenant_id = t.tenant_id

      WHERE pr.landlord_id = ?
        AND p.payment_status = 'confirmed'
        AND p.payout_status = 'unpaid'

      ORDER BY p.created_at DESC
      `,
            [landlord_id]
        );

        return NextResponse.json({
            payouts,
            pending_payments: pendingPayments,
            pending_total: pendingPayments.reduce(
                (sum: number, p: any) => sum + Number(p.net_amount || 0),
                0
            ),
        });

    } catch (err: any) {
        console.error("❌ Error fetching landlord payouts:", err);

        return NextResponse.json(
            { error: "Server error", details: err.message },
            { status: 500 }
        );
    }
}
