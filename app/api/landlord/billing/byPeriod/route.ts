import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { getSessionUser } from "@/lib/auth/auth";

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

/**
 * @method GET
 * @route  app/api/landlord/billing/byPeriod
 * @desc   Returns billing data for a specific month/year period with scorecards
 * @query  property_id, month (1-12), year (e.g. 2026)
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getSessionUser();
        if (!session || session.userType !== "landlord") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const property_id = searchParams.get("property_id");
        const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
        const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

        if (!property_id || isNaN(month) || isNaN(year)) {
            return NextResponse.json(
                { error: "Missing property_id, month, or year" },
                { status: 400 }
            );
        }

        const [rows]: any = await db.query(
            `
            SELECT
                la.agreement_id AS lease_id,
                la.agreement_id,
                la.status AS lease_status,
                la.start_date,
                la.end_date,
                la.rent_amount,

                u.unit_id,
                u.unit_name,

                b.billing_id,
                b.billing_period,
                b.total_amount_due,
                b.prev_balance,
                b.water_usage,
                b.electricity_usage,
                b.status AS billing_status,

                usr.firstName AS enc_firstName,
                usr.lastName AS enc_lastName,
                usr.email AS enc_email
            FROM LeaseAgreement la
            LEFT JOIN Unit u ON la.unit_id = u.unit_id
            LEFT JOIN Tenant t ON la.tenant_id = t.tenant_id
            LEFT JOIN User usr ON t.user_id = usr.user_id
            LEFT JOIN Billing b ON b.lease_id = la.agreement_id
                AND MONTH(b.billing_period) = ?
                AND YEAR(b.billing_period) = ?
            WHERE u.property_id = ?
              AND la.status IN ('active', 'draft', 'pending', 'sent', 'pending_signature', 'tenant_signed', 'landlord_signed', 'expired')
            ORDER BY u.unit_name ASC
            `,
            [month, year, property_id]
        );

        const safeDec = (val: any) => {
            try {
                return val ? decryptData(JSON.parse(val), SECRET_KEY) : "";
            } catch {
                return "";
            }
        };

        const leases = rows.map((r: any) => {
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
                prev_balance: r.prev_balance ? Number(r.prev_balance) : 0,
                water_usage: r.water_usage ? Number(r.water_usage) : 0,
                electricity_usage: r.electricity_usage ? Number(r.electricity_usage) : 0,
                total_amount_due: r.total_amount_due ? Number(r.total_amount_due) : 0,
                billing_status: r.billing_status || "no_bill",
                tenant_name: tenantName,
                tenant_email: email,
                e_kyp_id: r.e_kyp_id || null,
            };
        });

        const expectedRevenue = leases.reduce((sum: number, l: any) => sum + Number(l.rent_amount || 0), 0);
        const totalCollected = leases
            .filter((l: any) => l.billing_status?.toLowerCase() === "paid")
            .reduce((sum: number, l: any) => sum + Number(l.total_amount_due || 0), 0);
        const totalOutstanding = expectedRevenue - totalCollected;
        const collectedPercent = expectedRevenue > 0 ? Math.round((totalCollected / expectedRevenue) * 100) : 0;
        const pendingCount = leases.filter((l: any) => l.billing_status?.toLowerCase() !== "paid" && l.billing_status !== "no_bill").length;
        const hasBillCount = leases.filter((l: any) => l.billing_id !== null).length;
        const noBillCount = leases.filter((l: any) => l.billing_id === null && l.lease_status !== "draft").length;

        return NextResponse.json({
            bills: leases,
            scorecards: {
                expectedRevenue,
                totalCollected,
                totalOutstanding,
                collectedPercent,
                pendingCount,
                totalLeases: leases.length,
                hasBillCount,
                noBillCount,
            },
        }, { status: 200 });

    } catch (err) {
        console.error("Billing by period error:", err);
        return NextResponse.json(
            { error: "Failed to fetch billing data" },
            { status: 500 }
        );
    }
}