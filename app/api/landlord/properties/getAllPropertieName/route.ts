import { NextResponse } from "next/server";
import { db } from "@/lib/db";

//  use case: components/landlord/analytics/detailed/PropertyFilter.tsx
//  GET property name

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");

    if (!landlord_id) {
        return NextResponse.json(
            { error: "Missing landlord_id parameter" },
            { status: 400 }
        );
    }

    try {
        const [rows] = await db.execute(
            `
      SELECT property_id, property_name
      FROM Property
      WHERE landlord_id = ?
      ORDER BY property_name ASC
      `,
            [landlord_id]
        );

        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching properties:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
