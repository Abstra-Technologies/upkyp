import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

export async function GET(req: NextRequest) {
    try {
        /* ================= AUTH ================= */
        const session = await getSessionUser();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.userType !== "landlord" && session.userType !== "admin") {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const landlord_id = session.landlord_id;

        /* ================= PARAMS ================= */
        const { searchParams } = new URL(req.url);
        const payout_id = searchParams.get("payout_id");

        if (!payout_id) {
            return NextResponse.json({ error: "Missing payout_id" }, { status: 400 });
        }

        /* ================= QUERY ================= */
        const [rows]: any = await db.query(
            `
            SELECT p.property_id, p.property_name
            FROM PayoutProperty pp
            JOIN Property p ON p.property_id = pp.property_id
            WHERE pp.payout_id = ?
              AND p.landlord_id = ?
            `,
            [payout_id, landlord_id]
        );

        return NextResponse.json(rows, { status: 200 });

    } catch (error) {
        console.error("Get assigned properties error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}