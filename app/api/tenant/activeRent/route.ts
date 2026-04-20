import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

const getTenantActiveLeases = unstable_cache(
    async (tenantId: string) => {
        const [rows]: any = await db.query(
            `
      SELECT
        la.agreement_id,
        la.status AS lease_status,
        la.start_date,
        la.end_date,
        la.move_in_date,
        la.updated_at,
        
        -- LEASE SETUP REQUIREMENTS
        lsr.move_in_checklist,

        -- SIGNATURE STATUS
        MAX(CASE WHEN ls.role = 'landlord' THEN ls.status END) AS landlord_sig,
        MAX(CASE WHEN ls.role = 'tenant' THEN ls.status END) AS tenant_sig,

        -- UNIT
        u.unit_id,
        u.unit_name,
        u.unit_size,
        u.unit_style,
        u.rent_amount,
        u.furnish,
        u.status AS unit_status,

        -- PROPERTY
        p.property_id,
        p.property_name,
        p.property_type,
        p.street,
        p.brgy_district,
        p.city,
        p.province,
        p.zip_code,

        -- LANDLORD
        l.user_id AS landlord_user_id,
        usr.firstName AS enc_first_name,
        usr.lastName AS enc_last_name,

        -- UNIT PHOTOS
        GROUP_CONCAT(up.photo_url ORDER BY up.id ASC SEPARATOR '||') AS unit_photos

      FROM LeaseAgreement la
      INNER JOIN Unit u ON la.unit_id = u.unit_id
      INNER JOIN Property p ON u.property_id = p.property_id
      INNER JOIN Landlord l ON p.landlord_id = l.landlord_id
      INNER JOIN User usr ON l.user_id = usr.user_id

      LEFT JOIN LeaseSignature ls ON la.agreement_id = ls.agreement_id
      LEFT JOIN UnitPhoto up ON u.unit_id = up.unit_id
      LEFT JOIN LeaseSetupRequirements lsr ON la.agreement_id = lsr.agreement_id

      WHERE la.tenant_id = ?
        AND la.status IN ('draft', 'active', 'expired', 'pending_signature', 'invited', 'accepted', 'pending')

      GROUP BY la.agreement_id
      ORDER BY la.updated_at DESC
      `,
            [tenantId]
        );

        if (!rows?.length) return [];

        return rows.map((row: any) => {
            /* ---------------------------
               SIGNATURE STATUS
            --------------------------- */
            let leaseSignature = "pending";

            if (row.lease_status === "active") {
                leaseSignature = "active";
            } else if (row.landlord_sig === "signed" && row.tenant_sig === "signed") {
                leaseSignature = "completed";
            } else if (row.landlord_sig === "signed") {
                leaseSignature = "landlord_signed";
            } else if (row.tenant_sig === "signed") {
                leaseSignature = "tenant_signed";
            }

            /* ---------------------------
               DECRYPT LANDLORD NAME
            --------------------------- */
            let landlord_name = "Landlord";
            try {
                const first = decryptData(JSON.parse(row.enc_first_name), SECRET_KEY);
                const last = decryptData(JSON.parse(row.enc_last_name), SECRET_KEY);
                landlord_name = `${first} ${last}`;
            } catch {}

            /* ---------------------------
               DECRYPT PHOTOS
            --------------------------- */
            const unit_photos =
                row.unit_photos
                    ?.split("||")
                    .map((photo: string) => {
                        try {
                            return decryptData(JSON.parse(photo), SECRET_KEY);
                        } catch {
                            return null;
                        }
                    })
                    .filter(Boolean) || [];

            return {
                agreement_id: row.agreement_id,
                lease_status: row.lease_status,
                leaseSignature,

                start_date: row.start_date,
                end_date: row.end_date,
                move_in_date: row.move_in_date,
                move_in_checklist: row.move_in_checklist,

                unit_id: row.unit_id,
                unit_name: row.unit_name,
                unit_size: row.unit_size,
                unit_style: row.unit_style,
                rent_amount: row.rent_amount,
                furnish: row.furnish,
                unit_status: row.unit_status,

                property_id: row.property_id,
                property_name: row.property_name,
                property_type: row.property_type,

                street: row.street,
                brgy_district: row.brgy_district,
                city: row.city,
                province: row.province,
                zip_code: row.zip_code,

                landlord_user_id: row.landlord_user_id,
                landlord_name,

                unit_photos,
            };
        });
    },
    (tenantId: string) => ["tenant-active-leases", tenantId],
    {
        revalidate: 60,
        tags: ["tenant-leases"],
    }
);

/* =========================================================
   API HANDLER
========================================================= */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get("tenantId");

        if (!tenantId) {
            return NextResponse.json(
                { message: "Tenant ID is required" },
                { status: 400 }
            );
        }

        const leases = await getTenantActiveLeases(tenantId);

        return NextResponse.json(leases, { status: 200 });

    } catch (error) {
        console.error("TENANT ACTIVE LEASE API ERROR:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
