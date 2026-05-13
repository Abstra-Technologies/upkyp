import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
        return NextResponse.json(
            { error: "Missing tenantId" },
            { status: 400 }
        );
    }

    try {
        const [rows]: any = await db.query(
            `
      SELECT 
        b.status,
        b.due_date
      FROM Billing b
      INNER JOIN LeaseAgreement la ON la.unit_id = b.unit_id
      WHERE la.tenant_id = ?
      `,
            [tenantId]
        );

        let active_count = 0;
        let past_count = 0;
        let overdue_count = 0;

        const today = new Date();

        rows.forEach((bill: any) => {
            if (bill.status === "paid") {
                past_count++;
            } else if (bill.status === "unpaid") {
                const dueDate = new Date(bill.due_date);
                if (dueDate < today) {
                    overdue_count++;
                } else {
                    active_count++;
                }
            } else if (bill.status === "overdue") {
                overdue_count++;
            }
        });

        return NextResponse.json({
            active_count,
            past_count,
            overdue_count,
        });
    } catch (error: any) {
        console.error("Billing counter API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
