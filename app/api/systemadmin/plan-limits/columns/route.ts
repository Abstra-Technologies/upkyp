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

        const [rows]: any = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'PlanLimits'
            AND COLUMN_NAME NOT IN ('id', 'plan_id')
            ORDER BY ORDINAL_POSITION ASC
        `);

        const LABELS: Record<string, string> = {
            max_storage: "Max Storage",
            max_assets_per_property: "Max Assets Per Property",
            financial_history_years: "Financial History Years",
        };

        const columns = rows.map((col: any) => ({
            key: col.COLUMN_NAME,
            label: LABELS[col.COLUMN_NAME] || col.COLUMN_NAME,
            data_type: col.DATA_TYPE,
            nullable: col.IS_NULLABLE === "YES",
            default: col.COLUMN_DEFAULT,
        }));

        return NextResponse.json({ columns });
    } catch (error) {
        console.error("GET plan-limits columns error:", error);
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
        const { key, label, data_type, nullable = 1, default: defaultVal } = body;

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
            AND TABLE_NAME = 'PlanLimits'
            AND COLUMN_NAME = ?
        `, [key]);

        if (existing.length > 0) {
            await connection.release();
            return NextResponse.json({ error: "Column already exists" }, { status: 409 });
        }

        let colDef = "";
        switch (data_type) {
            case "int":
                colDef = nullable ? "INT NULL DEFAULT NULL" : "INT NOT NULL DEFAULT 0";
                break;
            case "tinyint":
                colDef = nullable ? "TINYINT NULL DEFAULT NULL" : "TINYINT NOT NULL DEFAULT 0";
                break;
            case "decimal":
                colDef = nullable ? "DECIMAL(10,2) NULL DEFAULT NULL" : "DECIMAL(10,2) NOT NULL DEFAULT 0.00";
                break;
            case "varchar":
            default:
                colDef = nullable ? "VARCHAR(255) NULL DEFAULT NULL" : "VARCHAR(255) NOT NULL DEFAULT ''";
                break;
        }

        if (defaultVal !== undefined && defaultVal !== null && defaultVal !== "") {
            colDef = colDef.replace("DEFAULT NULL", `DEFAULT '${defaultVal}'`).replace("DEFAULT 0", `DEFAULT '${defaultVal}'`).replace("DEFAULT 0.00", `DEFAULT '${defaultVal}'`).replace("DEFAULT ''", `DEFAULT '${defaultVal}'`);
        }

        await connection.query(`ALTER TABLE PlanLimits ADD COLUMN \`${key}\` ${colDef}`);

        await connection.release();

        return NextResponse.json({ success: true, message: `Column "${key}" added` }, { status: 201 });
    } catch (error: any) {
        console.error("POST plan-limits column error:", error);
        if (connection) connection.release();
        return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
    }
}