import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    let connection: any;

    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.userType !== "admin") {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const planId = parseInt(params.id);
        if (!planId) {
            return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
        }

        const body = await req.json();

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [existing]: any = await connection.query(
            "SELECT id FROM PlanFeatures WHERE plan_id = ?",
            [planId]
        );

        if (existing.length === 0) {
            await connection.query(
                `INSERT INTO PlanFeatures (plan_id, reports, pdc_management, ai_unit_generator, bulk_import, announcements, asset_management, financial_insights)
                VALUES (?, 0, 0, 0, 0, 0, 0, 0)`,
                [planId]
            );
        }

        const allowedFields = [
            "reports", "pdc_management", "ai_unit_generator", "bulk_import",
            "announcements", "asset_management", "financial_insights",
        ];

        const updates: string[] = [];
        const values: any[] = [];

        for (const key of allowedFields) {
            if (key in body) {
                updates.push(`${key} = ?`);
                values.push(body[key] === 1 || body[key] === true ? 1 : 0);
            }
        }

        if (updates.length > 0) {
            await connection.query(
                `UPDATE PlanFeatures SET ${updates.join(", ")} WHERE plan_id = ?`,
                [...values, planId]
            );
        }

        await connection.commit();

        return NextResponse.json({ success: true, message: "Feature updated" });
    } catch (error) {
        console.error("PATCH plan feature error:", error);
        if (connection) await connection.rollback();
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    let connection: any;

    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.userType !== "admin") {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const planId = parseInt(params.id);
        if (!planId) {
            return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
        }

        connection = await db.getConnection();

        await connection.query("DELETE FROM PlanFeatures WHERE plan_id = ?", [planId]);

        return NextResponse.json({ success: true, message: "Features deleted" });
    } catch (error) {
        console.error("DELETE plan features error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}