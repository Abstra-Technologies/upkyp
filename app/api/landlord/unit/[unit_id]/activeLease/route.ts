import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
    req: NextRequest,
    { params }: { params: { unit_id: string } }
) {
    try {
        const { unit_id } = params;

        if (!unit_id || typeof unit_id !== "string") {
            return NextResponse.json(
                { error: "Invalid or missing unit ID" },
                { status: 400 }
            );
        }

        const [rows]: any = await db.query(
            `
                SELECT agreement_id AS lease_id
                FROM LeaseAgreement
                WHERE unit_id = ?
                  AND status = 'active'
                LIMIT 1
            `,
            [unit_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { message: "No active lease found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ lease_id: rows[0].lease_id }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching active lease:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

