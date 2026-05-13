import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // mysql2/promise instance
import { cacheLife, cacheTag } from "next/cache";

const getCachedData = (landlordId: string) => {
    "use cache";
    cacheLife("hours");
    cacheTag(`maintenance-today-${landlordId}`);

    const today = new Date().toISOString().split("T")[0];

    const [scheduledToday] = db.execute(
        `
        SELECT 
            mr.request_id,
            mr.subject,
            mr.description,
            mr.priority_level,
            mr.status,
            mr.schedule_date,
            mr.unit_id,
            u.unit_name,
            p.property_name
        FROM MaintenanceRequest mr
        JOIN Unit u ON mr.unit_id = u.unit_id
        JOIN Property p ON p.property_id = u.property_id
        WHERE p.landlord_id = ?
          AND DATE(mr.schedule_date) = ?
        ORDER BY mr.schedule_date ASC
        `,
        [landlordId, today]
    );

    const [createdToday] = db.execute(
        `
        SELECT 
            mr.request_id,
            mr.subject,
            mr.description,
            mr.priority_level,
            mr.status,
            mr.created_at,
            mr.unit_id,
            u.unit_name,
            p.property_name
        FROM MaintenanceRequest mr
        JOIN Unit u ON mr.unit_id = u.unit_id
        JOIN Property p ON p.property_id = u.property_id
        WHERE p.landlord_id = ?
          AND DATE(mr.created_at) = ?
        ORDER BY mr.created_at DESC
        `,
        [landlordId, today]
    );

    const [summary] = db.execute(
        `
        SELECT
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN priority_level = 'HIGH' THEN 1 ELSE 0 END) AS high_priority
        FROM MaintenanceRequest
        WHERE property_id IN (
            SELECT property_id FROM Property WHERE landlord_id = ?
        )
        `,
        [landlordId]
    );

    return { scheduledToday, createdToday, summary };
};

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const landlordId = searchParams.get("landlord_id");

        if (!landlordId) {
            return NextResponse.json(
                { error: "Missing landlord_id parameter" },
                { status: 400 }
            );
        }

        const { scheduledToday, createdToday, summary } = await getCachedData(landlordId);
        const today = new Date().toISOString().split("T")[0];

        return NextResponse.json({
            date: today,
            summary: summary?.[0] || {
                pending: 0,
                completed: 0,
                high_priority: 0,
            },
            scheduled_today: scheduledToday,
            created_today: createdToday,
        });
    } catch (error) {
        console.error("❌ Error loading today maintenance:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
