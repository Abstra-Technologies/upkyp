import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const property_id = searchParams.get("property_id");

    if (!property_id) {
        return NextResponse.json({ error: "Missing property_id" }, { status: 400 });
    }

    try {
        const [rows]: any = await db.query(
            `
            SELECT DISTINCT YEAR(b.billing_period) AS year
            FROM Billing b
            JOIN LeaseAgreement la ON b.lease_id = la.agreement_id
            JOIN Unit u ON la.unit_id = u.unit_id
            WHERE u.property_id = ?
            UNION
            SELECT DISTINCT YEAR(CURDATE()) AS year
            ORDER BY year DESC
            `,
            [property_id]
        );

        const years = rows.map((r: any) => r.year).filter(Boolean);
        const currentYear = new Date().getFullYear();
        if (!years.includes(currentYear)) {
            years.unshift(currentYear);
        }

        return NextResponse.json({ years }, { status: 200 });
    } catch (error) {
        console.error("Error fetching years:", error);
        return NextResponse.json({ error: "Failed to fetch years" }, { status: 500 });
    }
}