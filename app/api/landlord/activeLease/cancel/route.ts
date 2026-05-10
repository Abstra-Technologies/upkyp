import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { agreement_id } = await req.json();

    if (!agreement_id) {
      return NextResponse.json(
        { error: "Missing agreement_id." },
        { status: 400 }
      );
    }

    const [existing]: any = await db.query(
      `SELECT status, unit_id FROM LeaseAgreement WHERE agreement_id = ?`,
      [agreement_id]
    );

    if (!existing.length) {
      return NextResponse.json(
        { error: "Lease agreement not found." },
        { status: 404 }
      );
    }

    const lease = existing[0];

    if (lease.status?.toLowerCase() !== "draft") {
      return NextResponse.json(
        { error: "Only draft leases can be cancelled." },
        { status: 403 }
      );
    }

    await db.query(`UPDATE Unit SET status = 'unoccupied', updated_at = NOW() WHERE unit_id = ?`, [lease.unit_id]);

    await db.query(`DELETE FROM LeaseAgreement WHERE agreement_id = ?`, [agreement_id]);

    return NextResponse.json({
      success: true,
      message: "Draft lease cancelled and unit released.",
    });
  } catch (error) {
    console.error("Cancel lease error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
