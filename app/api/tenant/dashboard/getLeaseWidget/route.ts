import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agreement_id = searchParams.get("agreement_id");

  if (!agreement_id) {
    return NextResponse.json(
      { message: "Missing agreement_id in query parameters" },
      { status: 400 }
    );
  }

  try {
    const leaseResults = await db.query(
      `SELECT agreement_id, start_date, end_date, DATEDIFF(end_date, start_date) AS duration, status
       FROM LeaseAgreement
       WHERE agreement_id = ?
       `,
      [agreement_id]
    );

    if (!leaseResults) {
      return NextResponse.json(
        { message: "Lease agreement not found" },
        { status: 404 }
      );
    }

    const lease = JSON.parse(JSON.stringify(leaseResults[0]));

    return NextResponse.json({ lease });

  } catch (error) {
    console.error("Error fetching lease agreement:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
