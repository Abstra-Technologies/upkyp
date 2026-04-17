import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

export async function PUT(req: NextRequest) {
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
            payout_id,
            account_name,
            account_number,
            channel_code,   // 🔥 optional (from your updated modal)
            bank_name,      // 🔥 optional
        } = body;

        /* ================= VALIDATION ================= */
        if (!payout_id || !account_name || !account_number) {
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        connection = await db.getConnection();

        /* ================= OWNERSHIP CHECK ================= */
        const [existing]: any = await connection.query(
            `
            SELECT payout_id
            FROM LandlordPayoutAccount
            WHERE payout_id = ?
              AND landlord_id = ?
            LIMIT 1
            `,
            [payout_id, landlord_id]
        );

        if (!existing || existing.length === 0) {
            return NextResponse.json(
                { error: "Payout account not found." },
                { status: 404 }
            );
        }

        /* ================= UPDATE ================= */
        await connection.query(
            `
            UPDATE LandlordPayoutAccount
            SET
                account_name = ?,
                account_number = ?,
                channel_code = COALESCE(?, channel_code),
                bank_name = COALESCE(?, bank_name),
                updated_at = NOW()
            WHERE payout_id = ?
            `,
            [
                account_name,
                account_number,
                channel_code || null,
                bank_name || null,
                payout_id,
            ]
        );

        return NextResponse.json(
            {
                success: true,
                message: "Payout account updated successfully.",
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("updateAccount error:", error);

        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}