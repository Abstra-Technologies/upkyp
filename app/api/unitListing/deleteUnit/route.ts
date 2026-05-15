import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidateTag } from "next/cache";

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const unit_id = searchParams.get("id");

    if (!unit_id) {
        return NextResponse.json({ error: "Unit ID is required" }, { status: 400 });
    }

    const connection = await db.getConnection();
    try {

        const [unitRows]: any = await connection.execute(
            `SELECT unit_id, property_id FROM Unit WHERE unit_id = ?`,
            [unit_id]
        );

        if (unitRows.length === 0) {
            return NextResponse.json({ error: "Unit not found" }, { status: 404 });
        }

        const property_id = unitRows[0].property_id;

        // Check if the unit has active lease agreements
        const [activeLeases]: any = await connection.execute(
            `SELECT agreement_id 
         FROM LeaseAgreement 
         WHERE unit_id = ? AND status = 'active'`,
            [unit_id]
        );

        if (activeLeases.length > 0) {
            return NextResponse.json(
                { error: "Cannot delete unit with active lease agreement" },
                { status: 400 }
            );
        }

        await connection.beginTransaction();
        await connection.execute(`DELETE FROM Unit WHERE unit_id = ?`, [unit_id]);
        await connection.commit();

        revalidateTag(`units-${property_id}`);
        revalidateTag(`units-all`);

        return NextResponse.json({
            success: true,
            message: "Unit listing deleted successfully",
            unit_id,
        });
    } catch (error: any) {
        await connection.rollback();
        console.error("❌ Error deleting unit:", error);
        return NextResponse.json(
            { error: "Failed to delete unit listing", details: error.message },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
