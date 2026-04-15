import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

/* =========================================================
   CACHED QUERY FUNCTION
========================================================= */
const getPropertiesCached = unstable_cache(
    async (landlord_id: string | null, property_id: string | null) => {
        let query = `
      SELECT
        p.*,
        pv.status AS verification_status,
        pv.admin_message AS verification_message
      FROM Property p
      LEFT JOIN PropertyVerification pv
        ON p.property_id = pv.property_id
      WHERE 1=1
    `;

        const params: any[] = [];

        if (landlord_id) {
            query += ` AND p.landlord_id = ?`;
            params.push(landlord_id);
        }

        if (property_id) {
            query += ` AND p.property_id = ?`;
            params.push(property_id);
        }

        const [rows]: any = await db.query(query, params);

        if (property_id && rows.length === 0) {
            return null;
        }

        return rows.map((row: any) => ({
            ...row,
            propertyPreferences: row.property_preferences
                ? JSON.parse(row.property_preferences)
                : [],
            paymentMethodsAccepted: row.accepted_payment_methods
                ? JSON.parse(row.accepted_payment_methods)
                : [],
        }));
    },
    // 🔑 Cache key factory
    ["property-listings"],
    {
        // ⏱️ Cache TTL (adjust as needed)
        revalidate: 60, // seconds
        tags: ["properties"], // for future revalidation
    }
);

/* =========================================================
   GET HANDLER
========================================================= */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");
    const property_id = searchParams.get("property_id");

    try {
        const data = await getPropertiesCached(landlord_id, property_id);

        if (property_id && !data) {
            return NextResponse.json(
                { error: "No Properties found for this Landlord" },
                { status: 404 }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Error fetching property listings:", error);
        return NextResponse.json(
            { error: "Failed to fetch property listings" },
            { status: 500 }
        );
    }
}
