import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cacheLife, cacheTag } from "next/cache";

async function getCachedRevenueExpenseTrend(landlord_id: string, property_id: string, year: number) {
    "use cache";
    cacheLife("hours");
    cacheTag(`revenue-expense-${property_id}`);

    const [ownership]: any = await db.query(
        `
        SELECT property_id
        FROM rentalley_db.Property
        WHERE property_id = ?
          AND landlord_id = ?
        LIMIT 1
        `,
        [property_id, landlord_id]
    );

    if (!ownership.length) {
        return null;
    }

    const [revenueRows]: any = await db.query(
        `
        SELECT
            DATE_FORMAT(p.payment_date, '%Y-%m') AS ym,
            SUM(p.amount_paid) AS revenue
        FROM rentalley_db.Payment p
        JOIN rentalley_db.LeaseAgreement la
            ON p.agreement_id = la.agreement_id
        JOIN rentalley_db.Unit u
            ON la.unit_id = u.unit_id
        WHERE u.property_id = ?
          AND YEAR(p.payment_date) = ?
          AND p.payment_status = 'confirmed'
        GROUP BY ym
        `,
        [property_id, year]
    );

    const [expenseRows]: any = await db.query(
        `
        SELECT
            DATE_FORMAT(e.created_at, '%Y-%m') AS ym,
            SUM(e.amount) AS expenses
        FROM rentalley_db.Expenses e
        WHERE e.reference_type = 'maintenance'
          AND e.reference_id = ?
          AND YEAR(e.created_at) = ?
        GROUP BY ym
        `,
        [property_id, year]
    );

    const monthKeys = Array.from(
        new Set([
            ...revenueRows.map((r: any) => r.ym),
            ...expenseRows.map((r: any) => r.ym),
        ])
    ).sort();

    const revenueMap = new Map(
        revenueRows.map((r: any) => [r.ym, Number(r.revenue || 0)])
    );

    const expenseMap = new Map(
        expenseRows.map((r: any) => [r.ym, Number(r.expenses || 0)])
    );

    const months = monthKeys.map((ym) =>
        new Date(`${ym}-01`).toLocaleString("default", {
            month: "short",
            year: "numeric",
        })
    );

    const revenue = monthKeys.map((ym) => revenueMap.get(ym) || 0);
    const expenses = monthKeys.map((ym) => expenseMap.get(ym) || 0);
    const net = monthKeys.map(
        (ym) => (revenueMap.get(ym) || 0) - (expenseMap.get(ym) || 0)
    );

    return {
        year,
        property_id,
        months,
        revenue,
        expenses,
        net,
    };
}

export async function GET(req: NextRequest) {
    try {
        const landlord_id = req.nextUrl.searchParams.get("landlord_id");
        const property_id = req.nextUrl.searchParams.get("property_id");
        const yearParam = req.nextUrl.searchParams.get("year");

        if (!landlord_id || !property_id) {
            return NextResponse.json(
                { error: "Missing landlord_id or property_id" },
                { status: 400 }
            );
        }

        const year = Number(yearParam || new Date().getFullYear());

        const data = await getCachedRevenueExpenseTrend(landlord_id, property_id, year);

        if (!data) {
            return NextResponse.json(
                { error: "Unauthorized property access" },
                { status: 403 }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("❌ Revenue–Expense Error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
