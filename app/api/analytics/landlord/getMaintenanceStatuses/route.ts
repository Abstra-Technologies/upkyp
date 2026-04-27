import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const landlordId = searchParams.get("landlord_id");
        const propertyId = searchParams.get("property_id");

        if (!landlordId) {
            return NextResponse.json(
                { error: "Missing landlord_id" },
                { status: 400 }
            );
        }

        const params: any[] = [landlordId];
        let propertyFilter = "";
        if (propertyId) {
            propertyFilter = "AND mr.property_id = ?";
            params.push(propertyId);
        }

        /* Current maintenance statuses */
        const [rows]: any = await db.query(
            `
            SELECT mr.status, COUNT(*) as count
            FROM MaintenanceRequest mr
            JOIN Property p ON mr.property_id = p.property_id
            WHERE p.landlord_id = ?
            ${propertyFilter}
            GROUP BY mr.status
            `,
            params
        );

        /* Previous period (30 days ago) maintenance statuses */
        const [prevRows]: any = await db.query(
            `
            SELECT mr.status, COUNT(*) as count
            FROM MaintenanceRequest mr
            JOIN Property p ON mr.property_id = p.property_id
            WHERE p.landlord_id = ?
            AND mr.created_at <= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            ${propertyFilter}
            GROUP BY mr.status
            `,
            params
        );

        const buildCounts = (queryRows: any[]) => {
            const counts: Record<string, number> = {
                pending: 0,
                approved: 0,
                scheduled: 0,
                "in-progress": 0,
                completed: 0,
            };
            queryRows.forEach((row: any) => {
                const status = row.status?.toLowerCase();
                if (status && counts[status] !== undefined) {
                    counts[status] = Number(row.count);
                }
            });
            return counts;
        };

        return NextResponse.json({
            success: true,
            data: buildCounts(rows),
            prevData: buildCounts(prevRows),
        });
    } catch (error) {
        console.error("[MAINTENANCE_STATUS_WIDGET_ERROR]", error);
        return NextResponse.json(
            { error: "Failed to load maintenance statuses." },
            { status: 500 }
        );
    }
}
