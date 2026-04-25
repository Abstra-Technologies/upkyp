import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";
import { safeDecrypt } from "@/utils/decrypt/safeDecrypt";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionUser();

        if (!session || session.userType !== "landlord") {
            return NextResponse.json(
                { error: "Unauthorized. Please log in." },
                { status: 401 }
            );
        }

        if (!session.landlord_id) {
            return NextResponse.json(
                { error: "Landlord profile not found." },
                { status: 404 }
            );
        }

        const [rows]: any[] = await db.execute(
            `
            SELECT
                t.tenant_id,
                t.user_id,
                usr.email,
                usr.firstName,
                usr.lastName,
                usr.phoneNumber,
                usr.profilePicture,
                la.agreement_id,
                la.status AS lease_status,
                la.start_date,
                la.end_date,
                la.rent_amount,
                u.unit_id,
                u.unit_name,
                u.status AS unit_status,
                p.property_id,
                p.property_name,
                p.city,
                p.province
            FROM Tenant t
            JOIN User usr ON t.user_id = usr.user_id
            JOIN LeaseAgreement la ON t.tenant_id = la.tenant_id
            JOIN Unit u ON la.unit_id = u.unit_id
            JOIN Property p ON u.property_id = p.property_id
            WHERE p.landlord_id = ?
            ORDER BY la.created_at DESC
            `,
            [session.landlord_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json({ success: true, data: [] }, { status: 200 });
        }

        const tenantsMap: Record<string, any> = {};

        for (const row of rows as any[]) {
            const tenantKey = row.tenant_id;

            if (!tenantsMap[tenantKey]) {
                const firstName = safeDecrypt(row.firstName);
                const lastName = safeDecrypt(row.lastName);
                const phone = safeDecrypt(row.phoneNumber);

                tenantsMap[tenantKey] = {
                    tenant_id: row.tenant_id,
                    user_id: row.user_id,
                    firstName: firstName || "Unknown",
                    lastName: lastName || "",
                    email: row.email || null,
                    phone: phone || null,
                    profile_picture: row.profilePicture || null,
                    leases: [],
                };
            }

            tenantsMap[tenantKey].leases.push({
                agreement_id: row.agreement_id,
                lease_status: row.lease_status,
                start_date: row.start_date,
                end_date: row.end_date,
                monthly_rent: Number(row.rent_amount || 0),
                unit_id: row.unit_id,
                unit_name: row.unit_name,
                unit_status: row.unit_status,
                property_id: row.property_id,
                property_name: row.property_name,
                city: row.city,
                province: row.province,
            });
        }

        const tenants = Object.values(tenantsMap).map((t: any) => ({
            ...t,
            activeLeases: t.leases.filter((l: any) => l.lease_status === "active"),
            totalLeases: t.leases.length,
        }));

        return NextResponse.json({ success: true, data: tenants });
    } catch (error) {
        console.error("Error fetching tenants:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
