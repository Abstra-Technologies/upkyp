import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cacheLife, cacheTag } from "next/cache";

async function getCachedMaintenanceRequests(tenant_id: string) {
    "use cache";
    cacheLife("minutes");
    cacheTag(`maintenance-tenant-${tenant_id}`);

    const [rows] = await db.query(
        `
        SELECT
            mr.request_id,
            mr.lease_id AS agreement_id,
            mr.subject,
            mr.description,
            mr.status,
            mr.category,
            mr.created_at,
            u.unit_name,
            p.property_name,
            mp.photo_url AS photo,
            CASE
                WHEN mr.status = 'Pending' THEN 'High'
                WHEN mr.status = 'Scheduled' THEN 'Medium'
                WHEN mr.status = 'In-Progress' THEN 'Medium'
                WHEN mr.status = 'Completed' THEN 'Low'
                ELSE 'Low'
            END AS priority
        FROM MaintenanceRequest mr
        JOIN Unit u
            ON mr.unit_id = u.unit_id
        JOIN Property p
            ON mr.property_id = p.property_id
        JOIN LeaseAgreement la
            ON mr.lease_id = la.agreement_id
            AND la.tenant_id = ?
            AND la.status IN ('active', 'completed')
        LEFT JOIN MaintenancePhoto mp
            ON mp.request_id = mr.request_id
        WHERE la.tenant_id = ?
        GROUP BY mr.request_id
        ORDER BY mr.created_at DESC;
        `,
        [tenant_id, tenant_id]
    );

    return rows || [];
}

export async function GET(req: NextRequest) {
    try {
        const tenant_id = req.nextUrl.searchParams.get("tenant_id");

        if (!tenant_id) {
            return NextResponse.json(
                { message: "Missing tenant_id parameter" },
                { status: 400 }
            );
        }

        const rows = await getCachedMaintenanceRequests(tenant_id);

        return NextResponse.json({
            maintenance_requests: rows,
        });
    } catch (error: any) {
        console.error("Error fetching maintenance list:", error);
        return NextResponse.json(
            { message: "Internal Server Error", error: error.message },
            { status: 500 }
        );
    }
}
