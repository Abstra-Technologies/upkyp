
// /api/tenant/analytics/applications/counter/route.ts
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
        return NextResponse.json(
            { message: "tenantId is required" },
            { status: 400 }
        );
    }

    try {
        const [rows]: any = await db.query(
            `SELECT 
          SUM(status = 'pending')       AS pending_count,
          SUM(status = 'approved')      AS approved_count,
          SUM(status = 'disapproved')   AS disapproved_count
       FROM ProspectiveTenant
       WHERE tenant_id = ?`,
            [tenantId]
        );

        return NextResponse.json(rows[0]);
    } catch (error: any) {
        console.error("❌ [Applications Counter] Error:", error);
        return NextResponse.json(
            { message: "Failed to fetch application counters", error: error.message },
            { status: 500 }
        );
    }
}
