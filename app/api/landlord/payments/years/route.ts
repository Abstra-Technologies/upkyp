import { NextRequest, NextResponse } from "next/server";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

async function getPaymentYears(landlordId: string, propertyId: string | null) {
    'use cache';
    cacheLife('hours');
    cacheTag('payment-years');

    const params: any[] = [landlordId];
    let propertyFilter = "";
    if (propertyId) {
        propertyFilter = "AND u.property_id = ?";
        params.push(propertyId);
    }

    const [rows]: any = await db.query(
        `
        SELECT MIN(YEAR(p.payment_date)) AS first_year
        FROM Payment p
        JOIN LeaseAgreement la ON p.agreement_id = la.agreement_id
        JOIN Unit u ON la.unit_id = u.unit_id
        JOIN Property pr ON u.property_id = pr.property_id
        WHERE pr.landlord_id = ?
        ${propertyFilter}
        `,
        params
    );

    const firstYear = rows?.[0]?.first_year;

    return {
        firstYear,
        currentYear: new Date().getFullYear(),
    };
}

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionUser();
        if (!session || session.userType !== "landlord") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get("property_id");

        const data = await getPaymentYears(session.landlord_id!, propertyId);

        return NextResponse.json(data);
    } catch (error) {
        console.error("[PAYMENTS_YEARS_ERROR]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
