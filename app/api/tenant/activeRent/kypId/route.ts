import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";
import { safeDecrypt } from "@/utils/decrypt/safeDecrypt";

export const runtime = "nodejs";
export async function GET() {
    try {
        /* ===============================
           1. Get authenticated session
        ================================ */
        const session = await getSessionUser();

        if (!session) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        if (session.userType !== "tenant" || !session.tenant_id) {
            return NextResponse.json(
                { message: "Tenant access only" },
                { status: 403 }
            );
        }

        const tenant_id = session.tenant_id;

        /* ===============================
           2. Fetch tenant + encrypted user info
        ================================ */
        const [tenantRows]: any = await db.query(
            `
            SELECT
                t.tenant_id,
                u.firstName,
                u.lastName,
                u.email
            FROM rentalley_db.Tenant t
            JOIN rentalley_db.User u ON u.user_id = t.user_id
            WHERE t.tenant_id = ?
            LIMIT 1
            `,
            [tenant_id]
        );

        if (!tenantRows.length) {
            return NextResponse.json(
                { message: "Tenant not found" },
                { status: 404 }
            );
        }

        const rawTenant = tenantRows[0];

        /* ===============================
           3. Safely decrypt PII
        ================================ */
        const tenant = {
            tenant_id: rawTenant.tenant_id,
            name: [safeDecrypt(rawTenant.firstName), safeDecrypt(rawTenant.lastName)]
                .filter(Boolean)
                .join(" "),
            email: safeDecrypt(rawTenant.email),
        };

        /* ===============================
           4. Fetch active leases + eKYP info
        ================================ */
        const [unitRows]: any = await db.query(
            `
            SELECT
                la.agreement_id,
                la.unit_id,
                u.unit_name,
                p.property_name,
                p.city,

                -- eKYP
                ek.status        AS ekyp_status,
                ek.qr_hash,
                ek.issued_at

            FROM rentalley_db.LeaseAgreement la
            JOIN rentalley_db.Unit u
                ON u.unit_id = la.unit_id
            JOIN rentalley_db.Property p
                ON p.property_id = u.property_id

            LEFT JOIN rentalley_db.LeaseEKyp ek
                ON ek.agreement_id = la.agreement_id
               AND ek.status = 'active'

            WHERE la.tenant_id = ?
              AND la.status = 'active'

            ORDER BY la.start_date DESC
            `,
            [tenant_id]
        );

        /* ===============================
           5. Normalize response per unit
        ================================ */
        const units = (unitRows || []).map((row: any) => {
            const qr_url =
                row.ekyp_status === "active" && row.qr_hash
                    ? `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/ekypid/${row.agreement_id}/${row.qr_hash}.png`
                    : null;

            return {
                agreement_id: row.agreement_id,
                unit_id: row.unit_id,
                unit_name: row.unit_name,
                property_name: row.property_name,
                city: row.city,
                ekyp_status: row.ekyp_status || "draft",
                qr_url,
            };
        });

        /* ===============================
           6. Response
        ================================ */
        return NextResponse.json({
            tenant,
            units,
        });
    } catch (err) {
        console.error("[TENANT KYP ERROR]", err);
        return NextResponse.json(
            { message: "Failed to fetch Tenant KYP ID" },
            { status: 500 }
        );
    }
}
