
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get("tenant_id");

    if (!tenant_id) {
        return NextResponse.json({ message: "tenant_id is required" }, { status: 400 });
    }

    try {
        const [rows] = await db.query(
            `
      SELECT 
        la.agreement_id,
        la.start_date,
        la.end_date,
        la.status,
        u.unit_name,
        p.property_name
      FROM LeaseAgreement la
      JOIN Unit u ON la.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE la.tenant_id = ?
      ORDER BY la.created_at DESC
      `,
            [tenant_id]
        );

        return NextResponse.json({ history: rows });
    } catch (error) {
        console.error("Error fetching tenant unit history:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
