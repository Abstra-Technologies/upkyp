import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

export async function POST(req: NextRequest) {
    let connection: any;

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

        connection = await db.getConnection();
        await connection.beginTransaction();

        /* ================= VERIFY OWNERSHIP ================= */
        const [[property]]: any = await connection.query(
            `SELECT property_id FROM Property WHERE property_id = ? AND landlord_id = ?`,
            [property_id, landlord_id]
        );

        if (!property) {
            return NextResponse.json({ error: "Property not found or unauthorized" }, { status: 404 });
        }

        /* ================= PREVENT DUPLICATE ================= */
        const [[existing]]: any = await connection.query(
            `SELECT id FROM PayoutProperty WHERE payout_id = ? AND property_id = ?`,
            [payout_id, property_id]
        );

        if (existing) {
            return NextResponse.json({ error: "Already assigned" }, { status: 409 });
        }

        /* ================= INSERT ================= */
        await connection.query(
            `
            INSERT INTO PayoutProperty (payout_id, property_id)
            VALUES (?, ?)
            `,
            [payout_id, property_id]
        );

        await connection.commit();

        return NextResponse.json(
            { success: true, message: "Property assigned successfully" },
            { status: 201 }
        );

    } catch (error) {
        console.error("Assign property error:", error);
        if (connection) await connection.rollback();

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}