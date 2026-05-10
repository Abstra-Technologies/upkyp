import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { unitId, status } = await req.json();

    if (!unitId) {
      return NextResponse.json({ message: "Unit ID is required" }, { status: 400 });
    }

    const allowedStatuses = ["unoccupied", "occupied"];
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json({ message: "Invalid status value" }, { status: 400 });
    }

    const [existing]: any = await db.query(
      `SELECT status FROM Unit WHERE unit_id = ?`,
      [unitId]
    );

    if (!existing.length) {
      return NextResponse.json({ message: "Unit not found" }, { status: 404 });
    }

    const currentStatus = existing[0].status?.toLowerCase();

    if (currentStatus === "occupied") {
      return NextResponse.json({ message: "Cannot change status of an occupied unit." }, { status: 403 });
    }

    if (currentStatus !== "reserved" && status !== "unoccupied") {
      return NextResponse.json({ message: "Status change not allowed." }, { status: 403 });
    }

    const [result]: any = await db.query(
      "UPDATE Unit SET status = ?, updated_at = NOW() WHERE unit_id = ?",
      [status, unitId]
    );

    return NextResponse.json({ message: "Status updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating status:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
