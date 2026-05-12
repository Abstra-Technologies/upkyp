import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

export const runtime = "nodejs";
/**
 * Get Lease History by Unit (Landlord)
 * GET /api/landlord/unit/leaseHistory?unit_id=UNIT123
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const unit_id = searchParams.get("unit_id");

    if (!unit_id) {
        return NextResponse.json(
            { message: "unit_id is required" },
            { status: 400 }
        );
    }

    try {
        const [rows]: any = await db.query(
            `
            SELECT
                la.agreement_id,
                la.start_date,
                la.end_date,
                la.status,
                la.is_renewal_of,

                -- Tenant
                t.tenant_id,
                u.firstName AS tenant_first_encrypted,
                u.lastName  AS tenant_last_encrypted
            FROM LeaseAgreement la
            LEFT JOIN Tenant t ON la.tenant_id = t.tenant_id
            LEFT JOIN User u   ON t.user_id = u.user_id
            WHERE la.unit_id = ?
            ORDER BY la.start_date DESC
            `,
            [unit_id]
        );

        const SECRET = process.env.ENCRYPTION_SECRET;

        const safeDecrypt = (value: any) => {
            try {
                if (!value) return null;
                return decryptData(JSON.parse(value), SECRET);
            } catch {
                return null;
            }
        };

        const leases = rows.map((row: any) => ({
            agreement_id: row.agreement_id,
            start_date: row.start_date,
            end_date: row.end_date,
            status: row.status,
            is_renewal_of: row.is_renewal_of,

            tenant_id: row.tenant_id,
            tenant_name:
                [safeDecrypt(row.tenant_first_encrypted), safeDecrypt(row.tenant_last_encrypted)]
                    .filter(Boolean)
                    .join(" ") || "Unknown",
        }));

        return NextResponse.json(leases, { status: 200 });
    } catch (error: any) {
        console.error("❌ Lease history error:", error);
        return NextResponse.json(
            { message: "Failed to fetch lease history" },
            { status: 500 }
        );
    }
}
