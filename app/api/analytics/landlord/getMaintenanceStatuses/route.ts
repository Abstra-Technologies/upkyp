import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

export async function GET(req: Request) {
    try {
        const session = await getSessionUser();
        if (!session || session.userType !== "landlord") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get("property_id");

        const params: any[] = [session.landlord_id];
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
            console.log('mantence counts: ', counts);

            return counts;

        };


        return NextResponse.json({
            success: true,
            data: buildCounts(rows),
        });
    } catch (error) {
        console.error("[MAINTENANCE_STATUS_WIDGET_ERROR]", error);
        return NextResponse.json(
            { error: "Failed to load maintenance statuses." },
            { status: 500 }
        );
    }
}
