import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // @ts-ignore
    const [rows] = await db.execute<LandlordVerificationRow[]>(`
      SELECT
        landlord_id,
        status,
        review_date,
        message
      FROM LandlordVerification
      WHERE status = 'pending'
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("[GET Verification List] DB Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Optional: Define the expected shape of a row for better IntelliSense
interface LandlordVerificationRow {
  landlord_id: string;
  status: string;
  review_date: string | null;
  message: string | null;
}
