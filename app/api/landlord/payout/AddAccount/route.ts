import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    let connection: any;

    try {
        const body = await req.json();

        const {
            landlord_id,
            channel_code,
            account_name,
            account_number,
            bank_name,
        } = body;

        /* ================= VALIDATION ================= */
        if (!landlord_id || !channel_code || !account_name || !account_number) {
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        /* ================= INSERT NEW PAYOUT ================= */
        await connection.query(
            `
            INSERT INTO LandlordPayoutAccount
            (
                landlord_id,
                channel_code,
                account_name,
                account_number,
                bank_name,
                is_active,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, 0, NOW())
            `,
            [
                landlord_id,
                channel_code,
                account_name,
                account_number,
                bank_name || null,
            ]
        );

        await connection.commit();

        return NextResponse.json(
            { success: true, message: "Payout account saved successfully." },
            { status: 201 }
        );

    } catch (error) {
        console.error("Save payout error:", error);
        if (connection) await connection.rollback();

        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
