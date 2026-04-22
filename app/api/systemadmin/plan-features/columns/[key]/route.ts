import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

export async function DELETE(req: NextRequest, { params }: { params: { key: string } }) {
    let connection: any;

    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.userType !== "admin") {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const columnKey = params.key;

        const PROTECTED_COLUMNS = ["id", "plan_id"];
        if (PROTECTED_COLUMNS.includes(columnKey)) {
            return NextResponse.json({ error: "Cannot delete protected columns" }, { status: 403 });
        }

        connection = await db.getConnection();

        await connection.query(`ALTER TABLE PlanFeatures DROP COLUMN \`${columnKey}\``);

        await connection.release();

        return NextResponse.json({ success: true, message: `Column "${columnKey}" removed` });
    } catch (error: any) {
        console.error("DELETE feature column error:", error);
        if (connection) connection.release();
        return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
    }
}