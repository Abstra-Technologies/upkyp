import { NextRequest, NextResponse } from "next/server";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { RowDataPacket } from "mysql2";

async function getOccupancyRate(landlordId: string, propertyId: string | null) {
    'use cache';
    cacheLife('minutes');
    cacheTag('occupancy-rate');

    const params: any[] = [landlordId];
    let propertyFilter = "";
    if (propertyId) {
        propertyFilter = "AND U.property_id = ?";
        params.push(propertyId);
    }

    const [rows] = await db.execute<RowDataPacket[]>(
        `
      SELECT 
        COUNT(CASE WHEN U.status = 'occupied' THEN 1 END) AS occupied_units,
        COUNT(U.unit_id) AS total_units,
        (COUNT(CASE WHEN U.status = 'occupied' THEN 1 END) / COUNT(U.unit_id)) * 100 AS occupancy_rate
      FROM Unit U
      JOIN Property P ON U.property_id = P.property_id
      WHERE P.landlord_id = ?
      ${propertyFilter}
      `,
        params
    );

    const [prevRows] = await db.execute<RowDataPacket[]>(
        `
      SELECT 
        COUNT(CASE WHEN la.status = 'active' AND la.start_date <= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) AS prev_occupied,
        COUNT(DISTINCT U.unit_id) AS prev_total
      FROM Unit U
      JOIN Property P ON U.property_id = P.property_id
      LEFT JOIN LeaseAgreement la ON U.unit_id = la.unit_id
        AND la.start_date <= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND (la.end_date IS NULL OR la.end_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY))
      WHERE P.landlord_id = ?
      ${propertyFilter}
      `,
        params
    );

    const data = rows[0];
    const prevData = prevRows[0];
    const prevOccupancyRate = prevData.prev_total > 0 
        ? (Number(prevData.prev_occupied) / Number(prevData.prev_total)) * 100 
        : 0;

    return {
        occupiedUnits: data.occupied_units,
        totalUnits: data.total_units,
        occupancyRate: Number(data.occupancy_rate) || 0,
        prevOccupancyRate: Math.round(prevOccupancyRate * 10) / 10,
    };
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");
    const property_id = searchParams.get("property_id");

    if (!landlord_id) {
        return NextResponse.json(
            { error: "Missing landlord_id parameter" },
            { status: 400 }
        );
    }

    try {
        const data = await getOccupancyRate(landlord_id, property_id);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Database error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
