import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

export async function DELETE(req: NextRequest) {
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
        const { payout_id } = body;

        if (!payout_id) {
            return NextResponse.json(
                { error: "payout_id is required." },
                { status: 400 }
            );
        }

        connection = await db.getConnection();

        /* ================= OWNERSHIP + ACTIVE CHECK ================= */
        const [rows]: any = await connection.query(
            `
            SELECT payout_id, is_active
            FROM LandlordPayoutAccount
            WHERE payout_id = ?
              AND landlord_id = ?
            LIMIT 1
            `,
            [payout_id, landlord_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { error: "Payout account not found." },
                { status: 404 }
            );
        }

        if (rows[0].is_active === 1) {
            return NextResponse.json(
                { error: "Active payout account cannot be deleted." },
                { status: 409 }
            );
        }

        /* ================= DELETE ================= */
        await connection.query(
            `
            DELETE FROM LandlordPayoutAccount
            WHERE payout_id = ?
            `,
            [payout_id]
        );

        return NextResponse.json(
            {
                success: true,
                message: "Payout account deleted successfully.",
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("deleteAccount error:", error);

        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}