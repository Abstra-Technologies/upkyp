//  used in the total payables widgte feed pages.

// used in the total payables widget feed pages

import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const tenant_id = req.nextUrl.searchParams.get("tenant_id");

    if (!tenant_id) {
        return NextResponse.json(
            { error: "tenant_id is required" },
            { status: 400 }
        );
    }

    try {
        /* -------------------------------------------------
           1️⃣ GET ACTIVE LEASES
        ------------------------------------------------- */
        const [leases]: any[] = await db.query(
            `
            SELECT
                la.agreement_id,
                la.unit_id,
                u.unit_name,
                p.property_id,
                p.property_name
            FROM LeaseAgreement la
            JOIN Unit u ON la.unit_id = u.unit_id
            JOIN Property p ON u.property_id = p.property_id
            WHERE la.tenant_id = ?
              AND la.status = 'active'
            `,
            [tenant_id]
        );

        if (!leases.length) {
            return NextResponse.json({ total: 0, details: [] }, { status: 200 });
        }

        /* -------------------------------------------------
           2️⃣ BUILD PAYABLE DETAILS PER LEASE
        ------------------------------------------------- */
        const details = await Promise.all(
            leases.map(async (lease: any) => {
                let total_due = 0;

                /* ---------- PROPERTY CONFIG ---------- */
                const [configRows]: any[] = await db.query(
                    `
                    SELECT billingDueDay, lateFeeType, lateFeeAmount, gracePeriodDays
                    FROM PropertyConfiguration
                    WHERE property_id = ?
                    LIMIT 1
                    `,
                    [lease.property_id]
                );

                const config = configRows?.[0] || {};
                const billingDueDay = Number(config.billingDueDay || 1);

                /* ---------- MONTHLY BILLINGS ---------- */
                const [billings]: any[] = await db.query(
                    `
                    SELECT billing_id, billing_period, total_amount_due, status
                    FROM Billing
                    WHERE lease_id = ?
                      AND status IN ('unpaid', 'overdue')
                    ORDER BY billing_period DESC
                    `,
                    [lease.agreement_id]
                );

                const billing_details = billings.map((b: any) => {
                    const period = new Date(b.billing_period);
                    const dueDate = new Date(
                        period.getFullYear(),
                        period.getMonth(),
                        billingDueDay
                    );

                    total_due += Number(b.total_amount_due || 0);

                    return {
                        billing_id: b.billing_id,
                        billing_period: b.billing_period,
                        billing_due_date: dueDate.toLocaleDateString("en-CA"),
                        amount: Number(b.total_amount_due || 0),
                        type: "billing",
                        status: b.status,
                    };
                });

                /* ---------- SECURITY DEPOSIT ---------- */
                const [securityDeposits]: any[] = await db.query(
                    `
                    SELECT deposit_id, amount, status
                    FROM SecurityDeposit
                    WHERE lease_id = ?
                      AND status IN ('unpaid', 'partially_paid')
                    `,
                    [lease.agreement_id]
                );

                const security_details = securityDeposits.map((d: any) => {
                    total_due += Number(d.amount || 0);
                    return {
                        deposit_id: d.deposit_id,
                        amount: Number(d.amount || 0),
                        type: "security_deposit",
                        status: d.status,
                    };
                });

                /* ---------- ADVANCE PAYMENT ---------- */
                let advance_details: any[] = [];
                try {
                    const [advancePayments]: any[] = await db.query(
                        `
                        SELECT advance_id, amount, months_covered, status
                        FROM AdvancePayment
                        WHERE lease_id = ?
                          AND status IN ('unpaid', 'partially_paid')
                        `,
                        [lease.agreement_id]
                    );

                    advance_details = advancePayments.map((a: any) => {
                        total_due += Number(a.amount || 0);
                        return {
                            advance_id: a.advance_id,
                            amount: Number(a.amount || 0),
                            months_covered: a.months_covered,
                            type: "advance_payment",
                            status: a.status,
                        };
                    });
                } catch {
                    // AdvancePayment table may not exist in older schemas
                    advance_details = [];
                }

                return {
                    agreement_id: lease.agreement_id,

                    property_id: lease.property_id,
                    property_name: lease.property_name,
                    unit_id: lease.unit_id,
                    unit_name: lease.unit_name,
                    total_due,
                    billings: billing_details,
                    security_deposits: security_details,
                    advance_payments: advance_details,
                };
            })
        );

        const total = details.reduce(
            (sum, unit) => sum + Number(unit.total_due || 0),
            0
        );

        return NextResponse.json({ total, details }, { status: 200 });
    } catch (error: any) {
        console.error("❌ Error fetching tenant payables:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
