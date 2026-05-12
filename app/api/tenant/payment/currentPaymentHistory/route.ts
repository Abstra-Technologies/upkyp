import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const agreementId = searchParams.get("agreement_id");

    if (!agreementId || agreementId.trim() === "") {
        return NextResponse.json(
            { error: "agreement_id is required" },
            { status: 400 }
        );
    }

    try {
        /* ======================================
           1️⃣ Fetch base lease agreement
        ====================================== */
        const [leaseRows]: any = await db.query(
            `
            SELECT
                agreement_id,
                is_renewal_of,
                tenant_id,
                unit_id,
                status
            FROM LeaseAgreement
            WHERE agreement_id = ?
            LIMIT 1
            `,
            [agreementId]
        );

        const lease = leaseRows[0];

        if (!lease) {
            return NextResponse.json(
                { error: "Lease not found" },
                { status: 404 }
            );
        }

        /* ======================================
           2️⃣ Resolve related lease IDs
        ====================================== */
        const leaseIds: string[] = [lease.agreement_id];

        if (lease.is_renewal_of) {
            leaseIds.push(lease.is_renewal_of);
        } else {
            const [renewedRows]: any = await db.query(
                `
                SELECT agreement_id
                FROM LeaseAgreement
                WHERE is_renewal_of = ?
                `,
                [lease.agreement_id]
            );

            renewedRows.forEach((r: any) =>
                leaseIds.push(r.agreement_id)
            );
        }

        /* ======================================
           3️⃣ Fetch payments WITH billing info
           (Billing period formatted in SQL)
        ====================================== */

        const [payments]: any = await db.query(
            `
            SELECT
                p.payment_id,
                p.bill_id,
                p.agreement_id,
                p.payment_type,
                p.amount_paid,
                p.payment_status,
                p.payment_date,
                p.receipt_reference,
p.gateway_transaction_ref,
                b.billing_period,
                DATE_FORMAT(b.billing_period, '%M %Y') AS billing_period_label,
                b.due_date,
                b.total_amount_due,
                b.status AS billing_status

            FROM Payment p
            LEFT JOIN Billing b 
                ON p.bill_id = b.billing_id

            WHERE p.agreement_id IN (?)
              AND p.payment_status IN ('confirmed', 'failed', 'cancelled')

            ORDER BY p.payment_date DESC
            `,
            [leaseIds]
        );

        /* ======================================
           4️⃣ Group payments by agreement
        ====================================== */

        const groupedPayments = leaseIds.reduce((acc, id) => {
            acc[id] = payments.filter(
                (p: any) => p.agreement_id === id
            );
            return acc;
        }, {} as Record<string, any[]>);

        /* ======================================
           5️⃣ Response
        ====================================== */

        return NextResponse.json({
            leaseAgreement: lease,
            leaseIds,
            payments,
            groupedPayments,
        });

    } catch (error: any) {
        console.error("🔥 PAYMENT HISTORY ERROR:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}