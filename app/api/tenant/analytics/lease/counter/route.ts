import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
        return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    try {
        const [rows]: any = await db.execute(
            `
      SELECT 
        SUM(status = 'active')     AS active_count,
        SUM(status = 'expired')    AS expired_count,
        SUM(status = 'pending')    AS pending_count,
        SUM(status = 'cancelled')  AS cancelled_count
      FROM LeaseAgreement
      WHERE tenant_id = ?;
      `,
            [tenantId]
        );

        return NextResponse.json(rows[0]);
    } catch (err: any) {
        console.error("Error fetching lease counters:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
