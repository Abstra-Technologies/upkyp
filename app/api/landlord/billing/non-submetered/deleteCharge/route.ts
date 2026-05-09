import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        const { charge_id } = await req.json();

        if (!charge_id) {
            return NextResponse.json({ error: "Missing charge_id" }, { status: 400 });
        }

        const [exists]: any = await connection.query(
            `SELECT id FROM BillingAdditionalCharge WHERE id = ? LIMIT 1`,
            [charge_id]
        );

        if (!exists || exists.length === 0) {
            return NextResponse.json(
                { error: "Charge not found or already deleted" },
                { status: 404 }
            );
        }

        await connection.beginTransaction();
        await connection.query(
            `DELETE FROM BillingAdditionalCharge WHERE id = ?`,
            [charge_id]
        );
        await connection.commit();

        return NextResponse.json({
            success: true,
            message: `Charge ${charge_id} deleted successfully.`,
        });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error deleting charge:", error);
        return NextResponse.json(
            { error: "Failed to delete charge" },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
