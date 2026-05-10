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
        const monthParam = req.nextUrl.searchParams.get("month");
        const month = monthParam !== null ? parseInt(monthParam) + 1 : new Date().getMonth() + 1;
        const year = parseInt(req.nextUrl.searchParams.get("year") || String(new Date().getFullYear()));

        if (!property_id) {
            return NextResponse.json({ error: "Missing property_id" }, { status: 400 });
        }

        const periodStart = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const periodEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const [rows]: any = await db.query(
            `
                SELECT
                    la.agreement_id AS lease_id,
                    la.status AS lease_status,
                    la.start_date,
                    la.end_date,
                    COALESCE(NULLIF(la.rent_amount, 0), u.rent_amount, 0) AS rent_amount,

                    u.unit_id,
                    u.unit_name,

                    -- Billing (may be null)
                    b.billing_id,
                    b.billing_period,
                    b.total_amount_due,
                    b.status AS billing_status,

                    -- Tenant info
                    usr.firstName AS enc_firstName,
                    usr.lastName  AS enc_lastName,
                    usr.email     AS enc_email

                FROM LeaseAgreement la
                         LEFT JOIN Unit u
                               ON la.unit_id = u.unit_id
                         LEFT JOIN Tenant t
                               ON la.tenant_id = t.tenant_id
                         LEFT JOIN User usr
                               ON t.user_id = usr.user_id
                         LEFT JOIN Billing b
                                   ON b.lease_id = la.agreement_id
                                       AND MONTH(b.billing_period) = ?
                                       AND YEAR(b.billing_period) = ?

                WHERE u.property_id = ?
                  AND la.status = 'active'
                  AND la.start_date <= ?
                  AND (la.end_date IS NULL OR la.end_date >= ?)
                ORDER BY u.unit_name ASC;
            `,
            [month, year, property_id, periodEnd, periodStart]
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
            const email = safeDec(r.enc_email);
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
                tenant_email: email || "",
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
