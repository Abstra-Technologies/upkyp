
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const unitName = searchParams.get("unitName");

    if (!propertyId || !unitName) {
        return NextResponse.json(
            { error: "Missing property_id or unitName" },
            { status: 400 }
        );
    }

    try {
        const [rows]: any = await db.query(
            "SELECT unit_id FROM Unit WHERE property_id = ? AND unit_name = ? LIMIT 1",
            [propertyId, unitName]
        );

        return NextResponse.json({ exists: rows.length > 0 });
    } catch (error: any) {
        console.error("Error checking unit name:", error);
        return NextResponse.json(
            { error: "Failed to check unit name" },
            { status: 500 }
        );
    }
}
