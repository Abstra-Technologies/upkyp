import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

//  use case: components/landlord/analytics/detailed/PropertyFilter.tsx
//  GET property name with utility billing types

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionUser();

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized. Please log in." },
                { status: 401 }
            );
        }

        if (!session.landlord_id) {
            return NextResponse.json(
                { error: "Landlord profile not found." },
                { status: 404 }
            );
        }

        const [rows] = await db.execute(
            `
      SELECT property_id, property_name, water_billing_type, electricity_billing_type
      FROM Property
      WHERE landlord_id = ?
      ORDER BY property_name ASC
      `,
            [session.landlord_id]
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
