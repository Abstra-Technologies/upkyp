import { NextResponse } from "next/server";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    'use cache';
    cacheLife('minutes');
    cacheTag('receivables-summary');

    const { searchParams } = new URL(req.url);

    const landlord_id = searchParams.get("landlord_id");
    const property_id = searchParams.get("property_id");
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;

    if (!landlord_id) {
        return NextResponse.json(
            { message: "Missing landlord_id parameter" },
            { status: 400 }
        );
    }

    try {
        const params: any[] = [landlord_id];

        let propertyFilter = "";
        if (property_id) {
            propertyFilter = "AND pr.property_id = ?";
            params.push(property_id);
        }

        let dateFilter = "";
        if (month && year) {
            dateFilter = "AND MONTH(b.due_date) = ? AND YEAR(b.due_date) = ?";
            params.push(month, year);
        }

        const [rows]: any = await db.query(
            `
      SELECT 
        COALESCE(
          SUM(
            CASE 
              WHEN b.status = 'paid'
              THEN b.total_amount_due
              ELSE 0
            END
          ), 0
        ) AS total_collected,

        COALESCE(
          SUM(
            CASE 
              WHEN b.status = 'unpaid'
               AND b.due_date >= CURDATE()
              THEN b.total_amount_due
              ELSE 0
            END
          ), 0
        ) AS total_pending,

        COALESCE(
          SUM(
            CASE 
              WHEN b.status = 'unpaid'
               AND b.due_date < CURDATE()
              THEN b.total_amount_due
              ELSE 0
            END
          ), 0
        ) AS total_overdue

      FROM Billing b
      JOIN Unit u ON b.unit_id = u.unit_id
      JOIN Property pr ON u.property_id = pr.property_id
      WHERE pr.landlord_id = ?
      ${propertyFilter}
      ${dateFilter}
      `,
            params
        );

        const result = (
            rows?.[0] || {
                total_collected: 0,
                total_pending: 0,
                total_overdue: 0,
            }
        );

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[RECEIVABLES_ERROR]", error);

        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
