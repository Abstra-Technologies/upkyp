import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cacheLife, cacheTag } from "next/cache";

async function getCachedTenantByUnit(agreementId: string) {
    "use cache";
    cacheLife("hours");
    cacheTag(`tenant-unit-${agreementId}`);

    const [rows] = await db.execute(
        `
            SELECT
                u.user_id,
                u.firstName,
                u.lastName,
                u.email,
                t.tenant_id,
                la.agreement_id
            FROM LeaseAgreement la
                     JOIN Tenant t ON la.tenant_id = t.tenant_id
                     JOIN User u ON t.user_id = u.user_id
            WHERE la.agreement_id = ?
            LIMIT 1
        `,
        [agreementId]
    );

    return rows;
}

export async function GET(req: NextRequest) {
    try {
        const agreementId = req.nextUrl.searchParams.get("agreementId");

        if (!agreementId) {
            return NextResponse.json(
                { error: "agreementId is required" },
                { status: 400 }
            );
        }

        const rows = await getCachedTenantByUnit(agreementId);

        if (!rows || rows.length === 0) {
            return NextResponse.json({ error: "No tenant found for this agreement" }, { status: 404 });
        }

        const tenant = rows[0];

        return NextResponse.json({
            tenantId: tenant.tenant_id,
            userId: tenant.user_id,
            name: `${tenant.firstName} ${tenant.lastName}`,
            email: tenant.email,
            agreementId: tenant.agreement_id,
        });
    } catch (err) {
        console.error("Error in getByAgreement API:", err);
        return NextResponse.json({ error: "Failed to fetch tenant" }, { status: 500 });
    }
}