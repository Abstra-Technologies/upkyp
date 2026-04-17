import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

export async function DELETE(req: NextRequest) {
    try {
        const session = await getSessionUser();

        /* ================= AUTH ================= */
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.userType !== "landlord" && session.userType !== "admin") {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const landlord_id = session.landlord_id;

        const { payout_id, property_id } = await req.json();

        if (!payout_id || !property_id) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        /* ================= VERIFY OWNERSHIP ================= */
        const [[property]]: any = await db.query(
            `SELECT property_id FROM Property WHERE property_id = ? AND landlord_id = ?`,
            [property_id, landlord_id]
        );

        if (!property) {
            return NextResponse.json({ error: "Property not found or unauthorized" }, { status: 404 });
        }

        /* ================= DELETE ================= */
        const [result]: any = await db.query(
            `
            DELETE FROM PayoutProperty
            WHERE payout_id = ? AND property_id = ?
            `,
            [payout_id, property_id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "Not assigned" }, { status: 404 });
        }

        return NextResponse.json(
            { success: true, message: "Property removed successfully" },
            { status: 200 }
        );

    } catch (error) {
        console.error("Deassign property error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}