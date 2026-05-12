import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    let agreementId = searchParams.get("agreement_id");
    const userId = searchParams.get("user_id");

    try {
        // ✅ 1. Get the latest agreement if none provided
        if (!agreementId && userId) {
            const [agreements]: any = await db.query(
                `
                    SELECT agreement_id
                    FROM LeaseAgreement
                    WHERE tenant_id = ?
                    ORDER BY start_date DESC
                    LIMIT 1
                `,
                [userId]
            );

            if (!agreements.length) {
                return NextResponse.json(
                    { message: "No lease agreement found for user." },
                    { status: 404 }
                );
            }

            agreementId = agreements[0].agreement_id;
        }

        if (!agreementId) {
            return NextResponse.json(
                { message: "Agreement ID or User ID is required" },
                { status: 400 }
            );
        }

        // ✅ 2. Fetch the current lease (including renewal linkage)
        const [leaseRows]: any = await db.query(
            `
                SELECT agreement_id, unit_id, is_renewal_of
                FROM LeaseAgreement
                WHERE agreement_id = ?
            `,
            [agreementId]
        );

        if (!leaseRows.length) {
            return NextResponse.json(
                { message: "Lease agreement not found" },
                { status: 404 }
            );
        }

        const lease = leaseRows[0];

        // ✅ 3. Build full renewal chain — include current + all previous renewals
        const leaseIds: string[] = [lease.agreement_id];
        let currentRenewalId = lease.is_renewal_of;

        while (currentRenewalId) {
            const [prevLeaseRows]: any = await db.query(
                `
          SELECT agreement_id, is_renewal_of
          FROM LeaseAgreement
          WHERE agreement_id = ?
        `,
                [currentRenewalId]
            );

            if (!prevLeaseRows.length) break;
            const prevLease = prevLeaseRows[0];
            leaseIds.push(prevLease.agreement_id);
            currentRenewalId = prevLease.is_renewal_of;
        }

        // ✅ 4. Fetch billing records using correct JOIN (via lease_id)
        const [billingRows]: any = await db.query(
            `
        SELECT DISTINCT
          b.billing_id,
          b.lease_id,
          b.unit_id,
          b.billing_period,
          b.total_amount_due,
          b.status,
          b.due_date,
          la.agreement_id,
          la.start_date,
          la.end_date
        FROM Billing b
        JOIN LeaseAgreement la ON b.lease_id = la.agreement_id
        WHERE b.lease_id IN (?)
          AND (
            YEAR(b.billing_period) < YEAR(CURRENT_DATE())
            OR (
              YEAR(b.billing_period) = YEAR(CURRENT_DATE())
              AND MONTH(b.billing_period) < MONTH(CURRENT_DATE())
            )
          )
        ORDER BY b.billing_period DESC
      `,
            [leaseIds]
        );

        // ✅ 5. Remove duplicates by billing_id (if any)
        const uniqueBillings = billingRows.filter(
            (bill: any, index: number, self: any[]) =>
                index === self.findIndex((b) => b.billing_id === bill.billing_id)
        );

        // ✅ 6. Response
        return NextResponse.json(
            {
                billings: uniqueBillings,
                included_leases: leaseIds,
                message:
                    uniqueBillings.length > 0
                        ? "Previous billing records retrieved successfully."
                        : "No previous billing records found.",
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("❌ Previous billing route error:", error);
        return NextResponse.json(
            { message: "Internal server error", error: error.message },
            { status: 500 }
        );
    }
}
