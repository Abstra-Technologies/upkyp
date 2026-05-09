import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const [rows] = await db.execute<PropertyVerificationRow[]>(`
      SELECT
        verification_id,
        property_id,
        doc_type,
        tin_number,
        status,
        reviewed_by,
        created_at,
        updated_at,
        attempts
      FROM PropertyVerification
      ORDER BY 
        CASE status 
          WHEN 'Pending' THEN 1 
          WHEN 'Verified' THEN 2 
          WHEN 'Rejected' THEN 3 
        END,
        created_at DESC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("[GET Property Verification List] DB Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

interface PropertyVerificationRow {
  verification_id: number;
  property_id: string;
  doc_type: string;
  tin_number: string | null;
  status: string;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  attempts: number;
}
