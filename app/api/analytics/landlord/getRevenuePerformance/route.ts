import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

/* --------------------------------------------------
   CACHED MONTHLY REVENUE QUERY (PER LANDLORD + YEAR + PROPERTY)
-------------------------------------------------- */
const getMonthlyRevenueCached = unstable_cache(
    async (landlordId: string, year: number, propertyId?: string) => {
        const params: any[] = [landlordId, year];
        let propertyFilter = "";
        if (propertyId) {
            propertyFilter = "AND u.property_id = ?";
            params.push(propertyId);
        }

        const [rows]: any = await db.execute(
            `
      SELECT
        MONTH(p.payment_date) AS month_num,
        SUM(p.amount_paid) AS revenue
      FROM Payment p
      JOIN LeaseAgreement la ON p.agreement_id = la.agreement_id
      JOIN Unit u ON la.unit_id = u.unit_id
      JOIN Property pr ON u.property_id = pr.property_id
      WHERE pr.landlord_id = ?
        AND p.payment_status = 'confirmed'
        AND YEAR(p.payment_date) = ?
        ${propertyFilter}
      GROUP BY month_num
      ORDER BY month_num ASC
      `,
            params
        );

        /* -------- Normalize to 12 months for requested year -------- */
        const months = Array.from({ length: 12 }, (_, i) => {
            const date = new Date(year, i, 1);
            return {
                month: date.toLocaleString("en-US", { month: "short" }),
                month_num: i + 1,
            };
        });

        return months.map(({ month, month_num }) => {
            const found = rows.find(
                (r: any) => r.month_num === month_num
            );

            return {
                month,
                revenue: found ? Number(found.revenue) : 0,
            };
        });
    },

    /* 🔑 Cache key MUST include year and propertyId */
    (landlordId: string, year: number, propertyId?: string) => [
        "monthly-revenue",
        landlordId,
        year,
        propertyId || "all",
    ],

    {
        revalidate: 300,
        tags: ["monthly-revenue"],
    }
);

/* --------------------------------------------------
   API HANDLER
-------------------------------------------------- */
export async function GET(req: Request) {
    const session = await getSessionUser();
    if (!session || session.userType !== "landlord") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");
    const propertyId = searchParams.get("propertyId");

    if (!yearParam) {
        return NextResponse.json(
            { error: "year is required" },
            { status: 400 }
        );
    }

    const year = Number(yearParam);
    if (Number.isNaN(year)) {
        return NextResponse.json(
            { error: "Invalid year" },
            { status: 400 }
        );
    }

    try {
        const result = await getMonthlyRevenueCached(session.landlord_id, year, propertyId || undefined);
        return NextResponse.json(result, { status: 200 });
    } catch (err) {
        console.error("[MONTHLY_REVENUE_CACHE_ERROR]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}