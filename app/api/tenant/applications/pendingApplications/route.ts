
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get("tenant_id");

    if (!tenant_id) {
        return NextResponse.json(
            { error: "tenant_id is required" },
            { status: 400 }
        );
    }

    try {
        // Count undecided applications:
        // landlord approved, tenant has not proceeded yet
        const [rows] = await db.query(
            `
        SELECT COUNT(*) AS count
        FROM ProspectiveTenant
        WHERE tenant_id = ?
          AND status = 'approved'
          AND proceeded IS NULL
      `,
            [tenant_id]
        );

        // @ts-ignore
        const count = rows[0]?.count || 0;

        return NextResponse.json({ count });
    } catch (error) {
        console.error("Error fetching undecided applications:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
