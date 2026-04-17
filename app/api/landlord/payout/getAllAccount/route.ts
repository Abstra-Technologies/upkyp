import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

export async function GET(req: NextRequest) {
    let connection: any;

    try {
        const session = await getSessionUser();

        // 🔐 AUTH CHECK
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized. Please log in." },
                { status: 401 }
            );
        }

        if (session.userType !== "landlord" && session.userType !== "admin") {
            return NextResponse.json(
                { error: "Access denied." },
                { status: 403 }
            );
        }

        const landlord_id = session.landlord_id;

        if (!landlord_id) {
            return NextResponse.json(
                { error: "Landlord profile not found." },
                { status: 404 }
            );
        }

        connection = await db.getConnection();

        const [rows]: any = await connection.query(
            `
            SELECT
                payout_id,
                landlord_id,
                channel_code,
                bank_name,
                account_name,
                account_number,
                is_active,
                created_at,
                updated_at
            FROM LandlordPayoutAccount
            WHERE landlord_id = ?
            ORDER BY is_active DESC, created_at DESC
            `,
            [landlord_id]
        );

        return NextResponse.json(
            { accounts: rows },
            { status: 200 }
        );

    } catch (error) {
        console.error("getAllAccount error:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}