import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth";

function unauthorized() {
    return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
    );
}

export async function GET(req: NextRequest) {
    const session = await getSessionUser();
    if (!session || !session.landlord_id) return unauthorized();

    const { searchParams } = new URL(req.url);

    const landlord_id = searchParams.get("landlord_id");
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");

    if (!landlord_id || landlord_id !== session.landlord_id) return unauthorized();

    const targetDate = date ?? null;

    try {
        let visits: any = [];
        let maintenance: any = [];

        if (targetDate) {
            [visits] = await db.query(
                `
      SELECT 
        pv.visit_id,
        pv.visit_date,
        pv.visit_time,
        pv.status,
        u.unit_name,
        p.property_name
      FROM PropertyVisit pv
      JOIN Unit u ON pv.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE p.landlord_id = ?
        AND pv.visit_date = ?
      ORDER BY pv.visit_time ASC
      `,
                [landlord_id, targetDate]
            );

            [maintenance] = await db.query(
                `
      SELECT
        mr.request_id,
        mr.subject,
        mr.status,
        mr.created_at,
        u.unit_name,
        p.property_name
      FROM MaintenanceRequest mr
      JOIN Unit u ON mr.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE p.landlord_id = ?
        AND DATE(mr.created_at) = ?
      ORDER BY mr.created_at ASC
      `,
                [landlord_id, targetDate]
            );
        }

        let calendarItemsQuery = `
      SELECT
        ci.item_id,
        ci.title,
        ci.description,
        ci.item_type,
        ci.category,
        ci.item_date,
        ci.item_time,
        ci.end_date,
        ci.end_time,
        ci.all_day,
        ci.status,
        ci.priority,
        ci.reminder,
        ci.repeat_rule,
        ci.location,
        ci.meeting_link,
        ci.color,
        p.property_name,
        u.unit_name
      FROM CalendarItem ci
      LEFT JOIN Property p ON ci.property_id = p.property_id
      LEFT JOIN Unit u ON ci.unit_id = u.unit_id
      WHERE ci.landlord_id = ?
      `;

        const queryParams: any[] = [landlord_id];

        if (targetDate) {
            calendarItemsQuery += ` AND ci.item_date = ?`;
            queryParams.push(targetDate);
        } else if (startDate && endDate) {
            calendarItemsQuery += ` AND ci.item_date BETWEEN ? AND ?`;
            queryParams.push(startDate, endDate);
        }

        if (type) {
            calendarItemsQuery += ` AND ci.item_type = ?`;
            queryParams.push(type);
        }

        calendarItemsQuery += ` ORDER BY ci.item_date ASC, ci.item_time ASC`;

        const [calendarItems] = await db.query(calendarItemsQuery, queryParams);

        return NextResponse.json(
            {
                date: targetDate,
                propertyVisits: visits,
                maintenanceRequests: maintenance,
                calendarItems: calendarItems,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching landlord calendar events:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    const session = await getSessionUser();
    if (!session || !session.landlord_id) return unauthorized();

    try {
        const body = await req.json();
        const {
            landlord_id,
            property_id,
            unit_id,
            title,
            description,
            item_type,
            category,
            item_date,
            item_time,
            end_date,
            end_time,
            all_day,
            status,
            priority,
            reminder,
            repeat_rule,
            location,
            meeting_link,
            color,
        } = body;

        if (landlord_id !== session.landlord_id) return unauthorized();

        if (!landlord_id || !title || !item_date) {
            return NextResponse.json(
                { message: "Landlord ID, title, and item date are required" },
                { status: 400 }
            );
        }

        if (!["task", "event", "reminder"].includes(item_type)) {
            return NextResponse.json(
                { message: "Item type must be task, event, or reminder" },
                { status: 400 }
            );
        }

        const [result] = await db.query(
            `
      INSERT INTO CalendarItem (
        landlord_id, property_id, unit_id, title, description,
        item_type, category, item_date, item_time, end_date, end_time,
        all_day, status, priority, reminder, repeat_rule, location, meeting_link, color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
            [
                landlord_id,
                property_id || null,
                unit_id || null,
                title,
                description || null,
                item_type,
                category || null,
                item_date,
                item_time || null,
                end_date || null,
                end_time || null,
                all_day ? 1 : 0,
                status || "pending",
                priority || "medium",
                reminder || "none",
                repeat_rule || "none",
                location || null,
                meeting_link || null,
                color || null,
            ]
        );

        return NextResponse.json(
            {
                message: "Calendar item created successfully",
                item_id: (result as any).insertId,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating calendar item:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    const session = await getSessionUser();
    if (!session || !session.landlord_id) return unauthorized();

    try {
        const body = await req.json();
        const {
            item_id,
            landlord_id,
            title,
            description,
            item_type,
            category,
            item_date,
            item_time,
            end_date,
            end_time,
            all_day,
            status,
            priority,
            reminder,
            repeat_rule,
            location,
            meeting_link,
            color,
            property_id,
            unit_id,
        } = body;

        if (landlord_id !== session.landlord_id) return unauthorized();

        if (!item_id || !landlord_id) {
            return NextResponse.json(
                { message: "Item ID and Landlord ID are required" },
                { status: 400 }
            );
        }

        const [existing] = await db.query(
            `SELECT item_id FROM CalendarItem WHERE item_id = ? AND landlord_id = ?`,
            [item_id, landlord_id]
        );

        if ((existing as any[]).length === 0) {
            return NextResponse.json(
                { message: "Item not found or unauthorized" },
                { status: 404 }
            );
        }

        await db.query(
            `
      UPDATE CalendarItem SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        item_type = COALESCE(?, item_type),
        category = COALESCE(?, category),
        item_date = COALESCE(?, item_date),
        item_time = COALESCE(?, item_time),
        end_date = COALESCE(?, end_date),
        end_time = COALESCE(?, end_time),
        all_day = COALESCE(?, all_day),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        reminder = COALESCE(?, reminder),
        repeat_rule = COALESCE(?, repeat_rule),
        location = COALESCE(?, location),
        meeting_link = COALESCE(?, meeting_link),
        color = COALESCE(?, color),
        property_id = COALESCE(?, property_id),
        unit_id = COALESCE(?, unit_id)
      WHERE item_id = ? AND landlord_id = ?
      `,
            [
                title,
                description,
                item_type,
                category,
                item_date,
                item_time,
                end_date,
                end_time,
                all_day !== undefined ? (all_day ? 1 : 0) : null,
                status,
                priority,
                reminder,
                repeat_rule,
                location,
                meeting_link,
                color,
                property_id,
                unit_id,
                item_id,
                landlord_id,
            ]
        );

        return NextResponse.json(
            { message: "Calendar item updated successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating calendar item:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    const session = await getSessionUser();
    if (!session || !session.landlord_id) return unauthorized();

    try {
        const { searchParams } = new URL(req.url);
        const item_id = searchParams.get("item_id");
        const landlord_id = searchParams.get("landlord_id");

        if (landlord_id !== session.landlord_id) return unauthorized();

        if (!item_id || !landlord_id) {
            return NextResponse.json(
                { message: "Item ID and Landlord ID are required" },
                { status: 400 }
            );
        }

        const [result] = await db.query(
            `DELETE FROM CalendarItem WHERE item_id = ? AND landlord_id = ?`,
            [item_id, landlord_id]
        );

        if ((result as any).affectedRows === 0) {
            return NextResponse.json(
                { message: "Item not found or unauthorized" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Calendar item deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting calendar item:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
