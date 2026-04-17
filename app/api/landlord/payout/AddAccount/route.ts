import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

export async function POST(req: NextRequest) {
    let connection: any;

    try {
        const session = await getSessionUser();

        /* ================= AUTH ================= */
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

        /* ================= BODY ================= */
        const body = await req.json();

        const {
            channel_code,
            account_name,
            account_number,
            bank_name,
        } = body;

        /* ================= VALIDATION ================= */
        if (!channel_code || !account_name || !account_number) {
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        /* ================= INSERT ================= */
        const [result]: any = await connection.query(
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
            VALUES (?, ?, ?, ?, ?, 1, NOW())
            `,
            [
                landlord_id,
                channel_code,
                account_name,
                account_number,
                bank_name || null,
            ]
        );

        const payout_id = result.insertId;

        /* ================= FETCH CREATED ================= */
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
                created_at
            FROM LandlordPayoutAccount
            WHERE payout_id = ?
            LIMIT 1
            `,
            [payout_id]
        );

        await connection.commit();

        return NextResponse.json(
            {
                success: true,
                message: "Payout account saved successfully.",
                account: rows[0],
            },
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