import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth/adminAuth";

export async function POST(request: NextRequest) {
    try {
        // 🔐 Verify Admin (optional for now)
        // const auth = await verifyAdmin(request);
        // if ("error" in auth) {
        //     return NextResponse.json(
        //         { success: false, message: auth.error },
        //         { status: auth.status }
        //     );
        // }

        const body = await request.json();

        const {
            plan_code,
            name,
            price,
            billing_cycle,
            is_active
        } = body;

        // 🧪 Basic Validation
        if (!plan_code || !name || price == null || !billing_cycle) {
            return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            );
        }

        // 🛑 Check duplicate plan_code
        const [existing]: any = await db.query(
            `SELECT plan_id FROM Plan WHERE plan_code = ?`,
            [plan_code]
        );

        if (existing.length > 0) {
            return NextResponse.json(
                { success: false, message: "Plan code already exists" },
                { status: 409 }
            );
        }

        // 💾 Insert Plan
        const [result]: any = await db.query(
            `
            INSERT INTO Plan 
            (plan_code, name, price, billing_cycle, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            `,
            [
                plan_code,
                name,
                price,
                billing_cycle,
                is_active ?? 1
            ]
        );

        return NextResponse.json({
            success: true,
            message: "Plan created successfully",
            plan_id: result.insertId
        });

    } catch (error) {
        console.error("ADMIN CREATE PLAN ERROR:", error);

        return NextResponse.json(
            { success: false, message: "Failed to create plan" },
            { status: 500 }
        );
    }
}