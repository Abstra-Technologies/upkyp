import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

export const dynamic = "force-dynamic";

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

/**
 * @route app/api/leaseAgreement/getDetailedLeaseInfo/[agreement_id]
 */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ agreement_id: string }> }
) {
    const params = await context.params;
    const agreement_id = params.agreement_id;

    if (!agreement_id) {
        return NextResponse.json(
            { message: "Lease ID is required" },
            { status: 400 }
        );
    }

    try {
        /* ---------------- MAIN LEASE + PROPERTY CONFIG ---------------- */
        const [leaseRows]: any = await db.execute(
            `
      SELECT
        la.agreement_id AS lease_id,
        la.tenant_id,
        la.start_date,
        la.end_date,
        la.status AS lease_status,
        la.agreement_url,

        la.security_deposit_amount,
        la.advance_payment_amount,
        la.rent_amount AS lease_rent_amount,

        p.property_id,
        p.property_name,

        u.unit_name,
        u.rent_amount AS unit_default_rent_amount,

        usr.firstName AS enc_firstName,
        usr.lastName AS enc_lastName,
        usr.email AS enc_email,
        usr.phoneNumber AS enc_phoneNumber,

        -- FROM PropertyConfiguration
        pc.billingDueDay   AS billing_due_day,
        pc.gracePeriodDays AS grace_period_days,
        pc.lateFeeAmount   AS late_penalty_amount,
        pc.lateFeeType     AS late_fee_type

      FROM LeaseAgreement la
        JOIN Unit u ON la.unit_id = u.unit_id
        JOIN Property p ON u.property_id = p.property_id
        LEFT JOIN Tenant t ON la.tenant_id = t.tenant_id
        LEFT JOIN User usr ON t.user_id = usr.user_id
        LEFT JOIN PropertyConfiguration pc
          ON pc.property_id = p.property_id
      WHERE la.agreement_id = ?
      LIMIT 1;
      `,
            [agreement_id]
        );

        if (!leaseRows?.length) {
            return NextResponse.json(
                { message: "Lease not found" },
                { status: 404 }
            );
        }

        const lease = leaseRows[0];

        /* ---------------- SECURITY DEPOSIT ---------------- */
        const [[securityDeposit]]: any = await db.execute(
            `
      SELECT
        deposit_id,
        amount,
        status,
        received_at,
        refunded_at,
        proof_of_payment,
        refund_reason,
        notes,
        created_at
      FROM SecurityDeposit
      WHERE lease_id = ?
      ORDER BY created_at DESC
      LIMIT 1;
      `,
            [agreement_id]
        );

        /* ---------------- ADVANCE PAYMENT ---------------- */
        const [[advancePayment]]: any = await db.execute(
            `
      SELECT
        advance_id,
        amount,
        months_covered,
        status,
        received_at,
        proof_of_payment,
        applied_to_billing_id,
        notes,
        created_at
      FROM AdvancePayment
      WHERE lease_id = ?
      ORDER BY created_at DESC
      LIMIT 1;
      `,
            [agreement_id]
        );

        /* ---------------- HELPERS ---------------- */
        const safeDecrypt = (val?: string) => {
            try {
                return val ? decryptData(JSON.parse(val), SECRET_KEY) : "";
            } catch {
                return "";
            }
        };

        let agreementUrl: string | null = null;
        try {
            agreementUrl = lease.agreement_url
                ? decryptData(JSON.parse(lease.agreement_url), SECRET_KEY)
                : null;
        } catch {
            agreementUrl = null;
        }

        const rent_amount =
            lease.lease_rent_amount > 0
                ? lease.lease_rent_amount
                : lease.unit_default_rent_amount;

        /* ---------------- RESPONSE ---------------- */
        return NextResponse.json(
            {
                lease_id: lease.lease_id,
                property_id: lease.property_id,
                property_name: lease.property_name,
                unit_name: lease.unit_name,

                tenant_id: lease.tenant_id,
                tenant_name: `${safeDecrypt(lease.enc_firstName)} ${safeDecrypt(
                    lease.enc_lastName
                )}`,
                email: safeDecrypt(lease.enc_email),
                phoneNumber: safeDecrypt(lease.enc_phoneNumber),

                start_date: lease.start_date,
                end_date: lease.end_date,
                lease_status: lease.lease_status,
                agreement_url: agreementUrl,

                rent_amount,
                default_rent_amount: lease.unit_default_rent_amount,

                security_deposit_amount: lease.security_deposit_amount,
                advance_payment_amount: lease.advance_payment_amount,

                security_deposit_details: securityDeposit || null,
                advance_payment_details: advancePayment || null,

        billing_due_day: lease.billing_due_day ?? 30,
            grace_period_days: lease.grace_period_days ?? 3,
            late_penalty_amount: lease.late_penalty_amount ?? 0,
            late_fee_type: lease.late_fee_type ?? "fixed",
    },
        { status: 200 }
    );
    } catch (error) {
        console.error("❌ Lease details error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
