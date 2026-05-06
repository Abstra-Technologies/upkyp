import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

function normalizeStatus(status: string | null): string {
    if (!status) return "pending";
    return status.toLowerCase().replace(/_/g, "-");
}

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

        const [rows]: any = await db.query(
            `
            SELECT 
                mr.request_id,
                mr.subject,
                mr.description,
                mr.status,
                mr.priority_level,
                mr.category,
                mr.created_at,
                mr.schedule_date,
                
                p.property_id,
                p.property_name,
                
                un.unit_id,
                un.unit_name,
                
                t.tenant_id,
                u.firstName AS tenant_first_name_enc,
                u.lastName AS tenant_last_name_enc
                
            FROM MaintenanceRequest mr
            JOIN Property p ON mr.property_id = p.property_id
            LEFT JOIN Unit un ON mr.unit_id = un.unit_id
            LEFT JOIN LeaseAgreement la ON mr.lease_id = la.agreement_id
            LEFT JOIN Tenant t ON la.tenant_id = t.tenant_id
            LEFT JOIN User u ON t.user_id = u.user_id
            WHERE p.landlord_id = ?
              AND mr.status IN ('pending', 'approved', 'scheduled', 'in-progress')
              ${propertyFilter}
            ORDER BY 
                FIELD(mr.status, 'pending', 'approved', 'scheduled', 'in-progress'),
                mr.created_at DESC
            `,
            params
        );

        const formatted = rows.map((row: any) => {
            let tenantFirstName = "";
            let tenantLastName = "";
            
            if (row.tenant_first_name_enc) {
                try {
                    tenantFirstName = decryptData(JSON.parse(row.tenant_first_name_enc), SECRET_KEY);
                    tenantLastName = decryptData(JSON.parse(row.tenant_last_name_enc), SECRET_KEY);
                } catch {
                    tenantFirstName = row.tenant_first_name_enc;
                    tenantLastName = row.tenant_last_name_enc;
                }
            }

            return {
                request_id: row.request_id,
                subject: row.subject,
                description: row.description,
                status: normalizeStatus(row.status),
                priority_level: row.priority_level || "Low",
                category: row.category || "General",
                created_at: row.created_at,
                schedule_date: row.schedule_date,
                property_name: row.property_name,
                unit_name: row.unit_name,
                tenant_name: tenantFirstName && tenantLastName 
                    ? `${tenantFirstName} ${tenantLastName}`.trim() 
                    : "Unassigned",
            };
        });

        return NextResponse.json({
            success: true,
            data: formatted,
        });
    } catch (error) {
        console.error("[PENDING_MAINTENANCE_ERROR]", error);
        return NextResponse.json(
            { error: "Failed to load pending maintenance requests." },
            { status: 500 }
        );
    }
}
