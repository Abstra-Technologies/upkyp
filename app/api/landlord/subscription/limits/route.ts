
// getting landlord limits per tiers

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

export async function POST(req: NextRequest) {
    try {
        const { landlord_id, property_id } = await req.json();

        if (!landlord_id || !property_id) {
            return NextResponse.json(
                { error: "Missing parameters" },
                { status: 400 }
            );
        }

        /* --------------------------------------------------
           REDIS CACHE KEY
           - per landlord + property
        -------------------------------------------------- */
        const cacheKey = `property-access:${landlord_id}:${property_id}`;

        /* --------------------------------------------------
           CACHE HIT
        -------------------------------------------------- */
        const cached = await redis.get(cacheKey);
        if (cached) {
            let parsed;
            try {
                parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
            } catch {
                parsed = cached;
            }

            return NextResponse.json(parsed);
        }

        /* --------------------------------------------------
           1. VERIFY PROPERTY OWNERSHIP
        -------------------------------------------------- */
        const [propertyRows]: any = await db.query(
            `
            SELECT property_id
            FROM Property
            WHERE property_id = ? AND landlord_id = ?
            `,
            [property_id, landlord_id]
        );

        if (propertyRows.length === 0) {
            return NextResponse.json(
                { error: "Forbidden: This property is not owned by you" },
                { status: 403 }
            );
        }

        /* --------------------------------------------------
           2. GET ACTIVE SUBSCRIPTION
        -------------------------------------------------- */
        const [subscriptionRows]: any = await db.query(
            `
            SELECT plan_name
            FROM Subscription
            WHERE landlord_id = ?
              AND is_active = 1
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [landlord_id]
        );

        if (subscriptionRows.length === 0) {
            return NextResponse.json(
                { error: "No active subscription found" },
                { status: 403 }
            );
        }

        const planName = subscriptionRows[0].plan_name?.trim() || "Free Plan";

        const [planRows]: any = await db.query(
            `
            SELECT p.plan_id, pl.max_assets_per_property, pl.max_storage, pl.financial_history_years,
                   pf.announcements, pf.asset_management, pf.reports, pf.pdc_management,
                   pf.ai_unit_generator, pf.bulk_import, pf.financial_insights
            FROM Plan p
            LEFT JOIN PlanLimits pl ON p.plan_id = pl.plan_id
            LEFT JOIN PlanFeatures pf ON p.plan_id = pf.plan_id
            WHERE p.name = ?
            LIMIT 1
            `,
            [planName]
        );

        if (planRows.length === 0) {
            return NextResponse.json(
                { error: `Plan '${planName}' not found` },
                { status: 404 }
            );
        }

        const planData = planRows[0];
        const maxProperties = planData.max_assets_per_property ?? null;

        /* --------------------------------------------------
           3. COUNT TOTAL PROPERTIES
        -------------------------------------------------- */
        const [countRows]: any = await db.query(
            `
            SELECT COUNT(*) AS total_properties
            FROM Property
            WHERE landlord_id = ?
            `,
            [landlord_id]
        );

        const totalProperties = countRows[0].total_properties;

        /* --------------------------------------------------
           4. DETERMINE LOCKED PROPERTIES
        -------------------------------------------------- */
        const [orderedRows]: any = await db.query(
            `
            SELECT property_id
            FROM Property
            WHERE landlord_id = ?
            ORDER BY created_at ASC
            `,
            [landlord_id]
        );

        const exceedingIds = orderedRows
            .slice(maxProperties)
            .map((p: any) => p.property_id);

        const isLocked = exceedingIds.includes(Number(property_id));

        /* --------------------------------------------------
           FINAL RESPONSE
        -------------------------------------------------- */
        const responsePayload = isLocked
            ? {
                error: "Locked: This property exceeds your plan limit",
                maxAllowed: maxProperties,
                totalProperties,
                planName,
            }
            : {
                ok: true,
                planName,
                totalProperties,
                maxAllowed: maxProperties,
            };


        await redis.set(
            cacheKey,
            JSON.stringify(responsePayload),
            { ex: 60 } // ⏱ 1 minute (safe for plan changes)
        );

        return NextResponse.json(
            responsePayload,
            { status: isLocked ? 403 : 200 }
        );
    } catch (error) {
        console.error("[CHECK_PROPERTY_ACCESS_ERROR]", error);

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
