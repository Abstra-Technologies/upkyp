import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

export async function GET() {
    let connection: any;

    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.userType !== "admin") {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        connection = await db.getConnection();

        const [rows]: any = await connection.query(
            `SELECT 
                pf.id,
                pf.plan_id,
                p.name as plan_name,
                pf.reports,
                pf.pdc_management,
                pf.ai_unit_generator,
                pf.bulk_import,
                pf.announcements,
                pf.asset_management,
                pf.financial_insights
            FROM PlanFeatures pf
            JOIN Plan p ON pf.plan_id = p.plan_id
            ORDER BY p.plan_id ASC`
        );

        return NextResponse.json({ features: rows });
    } catch (error) {
        console.error("GET plan features error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

export async function POST(req: NextRequest) {
    let connection: any;

    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.userType !== "admin") {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const body = await req.json();
        const {
            plan_id,
            reports = 0,
            pdc_management = 0,
            ai_unit_generator = 0,
            bulk_import = 0,
            announcements = 0,
            asset_management = 0,
            financial_insights = 0,
        } = body;

        if (!plan_id) {
            return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [existing]: any = await connection.query(
            "SELECT id FROM PlanFeatures WHERE plan_id = ?",
            [plan_id]
        );

        if (existing.length > 0) {
            await connection.query(
                `UPDATE PlanFeatures SET 
                    reports = ?, pdc_management = ?, ai_unit_generator = ?, 
                    bulk_import = ?, announcements = ?, asset_management = ?, financial_insights = ?
                WHERE plan_id = ?`,
                [
                    reports, pdc_management, ai_unit_generator,
                    bulk_import, announcements, asset_management, financial_insights,
                    plan_id,
                ]
            );
        } else {
            await connection.query(
                `INSERT INTO PlanFeatures 
                    (plan_id, reports, pdc_management, ai_unit_generator, bulk_import, announcements, asset_management, financial_insights)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    plan_id, reports, pdc_management, ai_unit_generator,
                    bulk_import, announcements, asset_management, financial_insights,
                ]
            );
        }

        await connection.commit();

        return NextResponse.json({ success: true, message: "Features saved successfully" }, { status: 201 });
    } catch (error) {
        console.error("POST plan features error:", error);
        if (connection) await connection.rollback();
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}