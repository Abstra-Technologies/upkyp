// /app/api/tenant/profile/route.ts
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const tenant_id = req.nextUrl.searchParams.get("tenant_id");
    if (!tenant_id)
        return NextResponse.json({ error: "Missing tenant_id" }, { status: 400 });

    try {
        const [rows]: any = await db.query(
            `
        SELECT 
          t.tenant_id,
          t.employment_type,
          t.monthly_income,
          u.address,
          u.phoneNumber,
          u.occupation
        FROM Tenant t
        JOIN User u ON t.user_id = u.user_id
        WHERE t.tenant_id = ?
      `,
            [tenant_id]
        );

        if (rows.length === 0)
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

        return NextResponse.json({ tenant: rows[0] });
    } catch (error: any) {
        console.error("Error fetching tenant profile:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
