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

        const [columns]: any = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'PlanFeatures'
            AND COLUMN_NAME NOT IN ('id', 'plan_id')
            ORDER BY ORDINAL_POSITION ASC
        `);

        const FEATURE_LABELS: Record<string, string> = {
            reports: "Reports",
            pdc_management: "PDC Management",
            ai_unit_generator: "AI Unit Generator",
            bulk_import: "Bulk Import",
            announcements: "Announcements",
            asset_management: "Asset Management",
            financial_insights: "Financial Insights",
        };

        const features = columns.map((col: any) => ({
            key: col.COLUMN_NAME,
            label: FEATURE_LABELS[col.COLUMN_NAME] || col.COLUMN_NAME,
            data_type: col.DATA_TYPE,
            nullable: col.IS_NULLABLE === "YES",
            default: col.COLUMN_DEFAULT,
        }));

        return NextResponse.json({ features });
    } catch (error) {
        console.error("GET feature columns error:", error);
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
        const { key, label, color } = body;

        if (!key || !label) {
            return NextResponse.json({ error: "Field name and label are required" }, { status: 400 });
        }

        const keyRegex = /^[a-z_]+$/;
        if (!keyRegex.test(key)) {
            return NextResponse.json({ error: "Invalid field name format" }, { status: 400 });
        }

        connection = await db.getConnection();

        const [existing]: any = await connection.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'PlanFeatures'
            AND COLUMN_NAME = ?
        `, [key]);

        if (existing.length > 0) {
            await connection.release();
            return NextResponse.json({ error: "Column already exists" }, { status: 409 });
        }

        await connection.query(`
            ALTER TABLE PlanFeatures ADD COLUMN \`${key}\` TINYINT(1) NOT NULL DEFAULT 0
        `);

        await connection.release();

        return NextResponse.json({ success: true, message: `Column "${key}" added to PlanFeatures table` }, { status: 201 });
    } catch (error: any) {
        console.error("POST feature column error:", error);
        if (connection) connection.release();
        return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
    }
}