import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth/adminAuth";

export async function GET(request: NextRequest) {
    try {
        // 🔐 Verify Admin
        // const auth = await verifyAdmin(request);
        //
        // if ("error" in auth) {
        //     return NextResponse.json(
        //         { success: false, message: auth.error },
        //         { status: auth.status }
        //     );
        // }

        // Optional: role restriction
        // if (auth.role !== "super_admin") {
        //   return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        // }

        // 📦 Fetch Plans with Limits and Features
        const [plans]: any = await db.query(`
        SELECT 
            p.plan_id,
            p.plan_code,
            p.name,
            p.price,
            p.billing_cycle,
            p.is_active,
            p.created_at,
            p.updated_at,
            p.platform_fee,
            p.fee_type,
            pl.max_storage,
            pl.max_assets_per_property,
            pl.financial_history_years
        FROM Plan p
        LEFT JOIN PlanLimits pl ON p.plan_id = pl.plan_id
        ORDER BY p.created_at DESC
    `);

        return NextResponse.json(plans);

    } catch (error) {
        console.error("ADMIN GET PLANS ERROR:", error);

        return NextResponse.json(
            { success: false, message: "Failed to fetch plans" },
            { status: 500 }
        );
    }
}
