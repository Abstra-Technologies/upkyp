import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth/adminAuth";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    try {
        if (!id) {
            return NextResponse.json(
                { success: false, message: "Plan ID required" },
                { status: 400 }
            );
        }

        // Optional: Enable auth
        // const auth = await verifyAdmin(request);
        // if ("error" in auth) {
        //     return NextResponse.json(
        //         { success: false, message: auth.error },
        //         { status: auth.status }
        //     );
        // }

        const [planRows]: any = await db.query(
            `
            SELECT 
                plan_id,
                plan_code,
                name,
                price,
                billing_cycle,
                platform_fee,
                fee_type,
                is_active
            FROM Plan
            WHERE plan_id = ?
            LIMIT 1
            `,
            [id]
        );

        if (!planRows.length) {
            return NextResponse.json(
                { success: false, message: "Plan not found" },
                { status: 404 }
            );
        }

        const plan = planRows[0];

        const [limitRows]: any = await db.query(
            `SELECT max_storage, max_assets_per_property, financial_history_years FROM PlanLimits WHERE plan_id = ? LIMIT 1`,
            [id]
        );

        const limits = limitRows.length ? limitRows[0] : {};

        const [featureRows]: any = await db.query(
            `SELECT * FROM PlanFeatures WHERE plan_id = ? LIMIT 1`,
            [id]
        );

        const features = featureRows.length ? featureRows[0] : {};

        return NextResponse.json({
            success: true,
            plan,
            limits,
            features,
        });

    } catch (error) {
        console.error("GET PLAN ERROR:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch plan details" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const connection = await db.getConnection();

    // 🔐 Helper: Prevent NaN
    const toSafeNumber = (value: any, fallback = 0) => {
        const num = Number(value);
        return isNaN(num) ? fallback : num;
    };

    try {
        if (!id) {
            return NextResponse.json(
                { success: false, message: "Plan ID required" },
                { status: 400 }
            );
        }

        // 🔐 Verify Admin
        const auth = await verifyAdmin(request);
        if ("error" in auth) {
            return NextResponse.json(
                { success: false, message: auth.error },
                { status: auth.status }
            );
        }

        const body = await request.json();
        const { plan, limits, features } = body;

        if (!plan) {
            return NextResponse.json(
                { success: false, message: "Invalid request body" },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        // ==========================
        // UPDATE PLAN CORE
        // ==========================
        await connection.query(
            `
            UPDATE Plan
            SET
                plan_code = ?,
                name = ?,
                price = ?,
                billing_cycle = ?,
                platform_fee = ?,
                fee_type = ?,
                is_active = ?
            WHERE plan_id = ?
            `,
            [
                plan.plan_code,
                plan.name,
                toSafeNumber(plan.price),
                plan.billing_cycle,
                toSafeNumber(plan.platform_fee),
                plan.fee_type || "percentage",
                plan.is_active ? 1 : 0,
                id,
            ]
        );

        // ==========================
        // UPDATE / INSERT PlanLimits
        // ==========================
        const [limitCheck]: any = await connection.query(
            `SELECT id FROM PlanLimits WHERE plan_id = ? LIMIT 1`,
            [id]
        );

        const safeMaxStorage = limits?.max_storage === null || limits?.max_storage === undefined
            ? null
            : String(limits.max_storage);
        
        const safeMaxAssetsPerProperty = limits?.max_assets_per_property === null || limits?.max_assets_per_property === undefined
            ? null
            : toSafeNumber(limits.max_assets_per_property);
        
        const safeFinancialHistoryYears = limits?.financial_history_years === null || limits?.financial_history_years === undefined
            ? null
            : toSafeNumber(limits.financial_history_years);

        if (limitCheck.length) {
            await connection.query(
                `
                UPDATE PlanLimits
                SET max_storage = ?, max_assets_per_property = ?, financial_history_years = ?
                WHERE plan_id = ?
                `,
                [safeMaxStorage, safeMaxAssetsPerProperty, safeFinancialHistoryYears, id]
            );
        } else {
            await connection.query(
                `
                INSERT INTO PlanLimits (plan_id, max_storage, max_assets_per_property, financial_history_years)
                VALUES (?, ?, ?, ?)
                `,
                [id, safeMaxStorage, safeMaxAssetsPerProperty, safeFinancialHistoryYears]
            );
        }

        // ==========================
        // UPDATE / INSERT FEATURES
        // ==========================
        const [featureCheck]: any = await connection.query(
            `SELECT id FROM PlanFeatures WHERE plan_id = ? LIMIT 1`,
            [id]
        );

        const featureValues = [
            features?.reports ?? 0,
            features?.pdc_management ?? 0,
            features?.ai_unit_generator ?? 0,
            features?.bulk_import ?? 0,
            features?.announcements ?? 0,
            features?.asset_management ?? 0,
            features?.financial_insights ?? 0,
        ];

        if (featureCheck.length) {
            await connection.query(
                `
                UPDATE PlanFeatures
                SET
                    reports = ?,
                    pdc_management = ?,
                    ai_unit_generator = ?,
                    bulk_import = ?,
                    announcements = ?,
                    asset_management = ?,
                    financial_insights = ?
                WHERE plan_id = ?
                `,
                [...featureValues, id]
            );
        } else {
            await connection.query(
                `
                INSERT INTO PlanFeatures (
                    plan_id,
                    reports,
                    pdc_management,
                    ai_unit_generator,
                    bulk_import,
                    announcements,
                    asset_management,
                    financial_insights
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [id, ...featureValues]
            );
        }

        await connection.commit();
        connection.release();

        return NextResponse.json({
            success: true,
            message: "Plan updated successfully",
        });

    } catch (error) {
        await connection.rollback();
        connection.release();

        console.error("UPDATE PLAN ERROR:", error);

        return NextResponse.json(
            { success: false, message: "Failed to update plan" },
            { status: 500 }
        );
    }
}