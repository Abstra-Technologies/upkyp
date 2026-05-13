import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    let connection: any;

    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");

    console.log("landlord_id payout >> ", landlord_id);

    if (!landlord_id) {
        return NextResponse.json(
            { error: "Missing landlord_id" },
            { status: 400 }
        );
    }

    try {
        connection = await db.getConnection();

        const [rows]: any = await connection.query(
            `
            SELECT payout_id,
                   landlord_id,
                   channel_code,
                   account_name,
                   account_number,
                   bank_name,
                   is_active,
                   created_at
            FROM LandlordPayoutAccount
            WHERE landlord_id = ?
              AND is_active = 1
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [landlord_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { hasDefaultPayout: false, account: null },
                { status: 200 }
            );
        }

        return NextResponse.json(
            {
                hasDefaultPayout: true,
                account: rows[0],
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("GET payout account error:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );

    } finally {
        if (connection) connection.release();
    }
}