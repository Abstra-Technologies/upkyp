import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    let agreementId = searchParams.get("agreement_id");
    const userId = searchParams.get("user_id");

    if (!userId) {
        return NextResponse.json(
            { error: "user_id is required" },
            { status: 400 }
        );
    }

    try {
        /* ------------------ 1️⃣ TENANT LOOKUP ------------------ */
        const [tenantRows]: any = await db.query(
            `SELECT tenant_id FROM Tenant WHERE user_id = ? LIMIT 1`,
            [userId]
        );

        const tenantId = tenantRows?.[0]?.tenant_id;
        if (!tenantId) {
            return NextResponse.json({ bills: [] }, { status: 200 });
        }

        /* ------------------ 2️⃣ AGREEMENT FALLBACK ------------------ */
        if (!agreementId) {
            const [leaseRows]: any = await db.query(
                `
        SELECT agreement_id
        FROM LeaseAgreement
        WHERE tenant_id = ?
          AND status = 'active'
        ORDER BY start_date DESC
        LIMIT 1
        `,
                [tenantId]
            );

            agreementId = leaseRows?.[0]?.agreement_id || null;
        }

        if (!agreementId) {
            return NextResponse.json({ bills: [] }, { status: 200 });
        }

        /* ------------------ 3️⃣ OVERDUE BILLING (GRACE-AWARE) ------------------ */
        const [rows]: any = await db.query(
            `
      SELECT
        b.billing_id,
        b.billing_period,
        b.due_date,
        b.total_amount_due,
        b.status,

        /* grace period from property config */
        pc.gracePeriodDays AS grace_period_days,

        /* post-grace overdue days (THIS IS WHAT YOU WANT) */
        GREATEST(
          DATEDIFF(CURRENT_DATE(), b.due_date) - pc.gracePeriodDays,
          0
        ) AS days_overdue

      FROM Billing b
      JOIN LeaseAgreement la ON b.lease_id = la.agreement_id
      JOIN Unit u ON b.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      JOIN PropertyConfiguration pc ON pc.property_id = p.property_id

      WHERE
        b.lease_id = ?
        AND b.status IN ('unpaid', 'overdue')
        AND b.due_date < CURRENT_DATE()
        AND b.total_amount_due > 0

      ORDER BY b.due_date ASC
      `,
            [agreementId]
        );

        console.log("overdue api (post-grace days):", rows);

        return NextResponse.json(
            { bills: rows || [] },
            { status: 200 }
        );
    } catch (error) {
        console.error("❌ Overdue billing fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch overdue bills" },
            { status: 500 }
        );
    }
}
