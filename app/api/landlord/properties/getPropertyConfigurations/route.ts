import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
/**
 * GET /api/propertyConfiguration/getByProperty?property_id=PRP000123
 *
 * Returns property configuration and property details.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const property_id = searchParams.get("property_id");

    if (!property_id) {
        return NextResponse.json(
            { error: "Missing property_id parameter." },
            { status: 400 }
        );
    }

    try {
        // 🔹 Fetch property details + configuration
        const [rows]: any = await db.query(
            `
      SELECT
        p.property_id,
        p.property_name,
        p.property_type,
        p.city,
        p.province,
        p.water_billing_type,
        p.electricity_billing_type,
        p.late_fee,
      
        c.config_id,
        c.billingReminderDay,
        c.billingDueDay,
        c.lateFeeType,
        c.lateFeeAmount,
        c.gracePeriodDays,
        c.notifyEmail,
        c.notifySms,
        c.createdAt,
        c.updatedAt
      FROM Property p
      LEFT JOIN PropertyConfiguration c
        ON p.property_id = c.property_id
      WHERE p.property_id = ?
      LIMIT 1;
      `,
            [property_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { error: "Property not found." },
                { status: 404 }
            );
        }

        const property = rows[0];

        // 🔹 Construct the response payload
        const config = {
            property_id: property.property_id,
            property_name: property.property_name,
            property_type: property.property_type,
            city: property.city,
            province: property.province,

            billingReminderDay: property.billingReminderDay,
            billingDueDay: property.billingDueDay,
            lateFeeType: property.lateFeeType,
            lateFeeAmount: property.lateFeeAmount,
            gracePeriodDays: property.gracePeriodDays,
            notifyEmail: !!property.notifyEmail,
            notifySms: !!property.notifySms,

            // Timestamps
            createdAt: property.createdAt,
            updatedAt: property.updatedAt,
        };

        return NextResponse.json({ config }, { status: 200 });
    } catch (error: any) {
        console.error("❌ Error fetching property configuration:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
