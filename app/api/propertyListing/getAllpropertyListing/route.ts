import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const landlordId = searchParams.get("landlord_id");

    if (!landlordId) {
        return NextResponse.json(
            { error: "landlord_id is required" },
            { status: 400 }
        );
    }

    try {
        /* -------------------------------------------------------
           REDIS CACHE KEY (scoped per landlord)
        ------------------------------------------------------- */
        const cacheKey = `properties:landlord:${landlordId}`;

        // 🔹 Check Redis first
        const cached = await redis.get(cacheKey);
        if (cached) {
            let parsed;
            try {
                parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
            } catch (err) {
                console.error("Redis parse error:", err);
                parsed = cached;
            }

            return NextResponse.json(parsed);
        }

        /* -------------------------------------------------------
           DATABASE QUERY
        ------------------------------------------------------- */
        const [properties] = await db.query(
            `
            SELECT
                p.*,
                pv.status AS verification_status,

                -- 🏠 Total units
                (
                    SELECT COUNT(*)
                    FROM Unit u
                    WHERE u.property_id = p.property_id
                ) AS total_units,

                -- 🟢 Occupied units
                (
                    SELECT COUNT(*)
                    FROM Unit u
                    WHERE u.property_id = p.property_id
                      AND u.status = 'occupied'
                ) AS occupied_units,

                -- 💰 Total income
                (
                    SELECT COALESCE(SUM(pay.amount_paid), 0)
                    FROM Payment pay
                    JOIN Billing b ON pay.bill_id = b.billing_id
                    JOIN Unit u ON b.unit_id = u.unit_id
                    WHERE u.property_id = p.property_id
                ) AS total_income

            FROM Property p
            LEFT JOIN PropertyVerification pv
                ON p.property_id = pv.property_id
            WHERE p.landlord_id = ?
            GROUP BY p.property_id
            `,
            [landlordId]
        );

        /* -------------------------------------------------------
           CACHE RESULT (30 seconds)
        ------------------------------------------------------- */
        await redis.set(
            cacheKey,
            JSON.stringify(properties),
            { ex: 30 } // ⏱ short TTL keeps analytics fresh
        );

        return NextResponse.json(properties);
    } catch (error) {
        console.error("Error fetching properties:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
