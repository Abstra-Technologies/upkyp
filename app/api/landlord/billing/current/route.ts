import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

/**
 * @method GET
 * @route  app/api/landlord/billing/current
 * @desc   Returns all active lease units for the property, even if no billing is created yet for this month.
 *         Uses lease_id as primary key (same structure as active lease API).
 * @usedIn app/landlord/properties/[id]/activeLease/page.tsx (billing mode)
 */
export async function GET(req: NextRequest) {
    try {
        const property_id = req.nextUrl.searchParams.get("property_id");
        if (!property_id) {
            return NextResponse.json({ error: "Missing property_id" }, { status: 400 });
        }

        const [rows]: any = await db.query(
            `
                SELECT
                    la.agreement_id AS lease_id,
                    la.status AS lease_status,
                    la.start_date,
                    la.end_date,
                    la.rent_amount,

                    u.unit_id,
                    u.unit_name,

                    -- Billing (may be null)
                    b.billing_id,
                    b.billing_period,
                    b.total_amount_due,
                    b.status AS billing_status,

                    -- Tenant info
                    usr.firstName AS enc_firstName,
                    usr.lastName  AS enc_lastName

                FROM LeaseAgreement la
                         LEFT JOIN Unit u
                              ON la.unit_id = u.unit_id
                         LEFT JOIN Tenant t
                              ON la.tenant_id = t.tenant_id
                         LEFT JOIN User usr
                              ON t.user_id = usr.user_id
                         LEFT JOIN Billing b
                                   ON b.lease_id = la.agreement_id
                                       AND MONTH(b.billing_period) = MONTH(CURDATE())
                                       AND YEAR(b.billing_period) = YEAR(CURDATE())

                WHERE u.property_id = ?
                  AND la.status IN ('active', 'draft', 'pending', 'sent', 'pending_signature', 'tenant_signed', 'landlord_signed', 'expired')
                ORDER BY u.unit_name ASC;
            `,
            [property_id]
        );

        // Decrypt helper
        const safeDec = (val: any) => {
            try {
                return val ? decryptData(JSON.parse(val), SECRET_KEY) : "";
            } catch {
                return "";
            }
        };

        // Format response
        const bills = rows.map((r: any) => {
            const first = safeDec(r.enc_firstName);
            const last = safeDec(r.enc_lastName);
            const tenantName = `${first} ${last}`.trim();

            return {
                lease_id: r.lease_id,
                agreement_id: r.agreement_id,
                unit_id: r.unit_id,
                unit_name: r.unit_name,
                lease_status: r.lease_status,
                start_date: r.start_date,
                end_date: r.end_date,
                rent_amount: r.rent_amount,
                billing_id: r.billing_id || null,
                billing_period: r.billing_period || null,
                total_amount_due: r.total_amount_due ? Number(r.total_amount_due) : 0,
                billing_status: r.billing_status || "no_bill",
                tenant_name: tenantName,
            };
        });
        return NextResponse.json({ bills }, { status: 200 });
    } catch (err) {
        return NextResponse.json(
            { error: "Failed to fetch current billing" },
            { status: 500 }
        );
    }
}
