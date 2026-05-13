import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cacheLife, cacheTag } from "next/cache";
import { RowDataPacket, FieldPacket } from "mysql2";

async function getCachedPropertyUnits(landlordId: string) {
    "use cache";
    cacheLife("hours");
    cacheTag(`property-units-${landlordId}`);

    const [properties] = await db.query(
        "SELECT * FROM Property WHERE landlord_id = ?",
        [landlordId]
    ) as [RowDataPacket[], FieldPacket[]];

    if (!properties.length) {
        return [];
    }

    const propertyIds = properties.map((p: any) => p.property_id);
    const [units] = await db.query(
        "SELECT * FROM Unit WHERE property_id IN (?)",
        [propertyIds]
    ) as [RowDataPacket[], FieldPacket[]];

    return properties.map((property: any) => ({
        ...property,
        units: units.filter((unit: any) => unit.property_id === property.property_id),
    }));
}

export async function GET(req: NextRequest) {
    try {
        const landlordId = req.nextUrl.searchParams.get("landlordId");

        if (!landlordId) {
            return NextResponse.json({ error: "Landlord ID is required" }, { status: 400 });
        }

        const propertiesWithUnits = await getCachedPropertyUnits(landlordId);

        if (!propertiesWithUnits.length) {
            return NextResponse.json({ error: "No properties found" }, { status: 404 });
        }

        return NextResponse.json(propertiesWithUnits, { status: 200 });
    } catch (error) {
        console.error("Error fetching properties and units:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
