import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
        return NextResponse.json(
            { error: "user_id is required" },
            { status: 400 }
        );
    }

    try {
        const [landlordRows]: any = await db.execute(
            `SELECT landlord_id FROM Landlord WHERE user_id = ?`,
            [user_id]
        );

        if (!landlordRows.length) {
            return NextResponse.json(
                { error: "Landlord not found" },
                { status: 404 }
            );
        }

        const landlord_id = landlordRows[0].landlord_id;

        const [properties]: any = await db.execute(
            `
            SELECT 
                p.property_id,
                p.property_name,
                COUNT(u.unit_id) as unit_count
            FROM Property p
            LEFT JOIN Unit u ON p.property_id = u.property_id
            WHERE p.landlord_id = ?
            GROUP BY p.property_id, p.property_name
            ORDER BY p.created_at DESC
            `,
            [landlord_id]
        );

        return NextResponse.json(properties, { status: 200 });

    } catch (error: any) {
        console.error("Error fetching properties:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
