// API to get ACTIVE SUBSCRIPTION with DB-based limits & features

import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ landlord_id?: string }> }
) {
    const requestId = crypto.randomUUID();

    const sessionUser = await getSessionUser();

    if (!sessionUser || sessionUser.userType !== "landlord") {
        return NextResponse.json(
            { error: "Unauthorized. Valid landlord session required." },
            { status: 401 }
        );
    }

    const { landlord_id } = await context.params;

    if (!landlord_id || landlord_id === "undefined") {
        console.warn(
            `[SUBSCRIPTION][${requestId}] INVALID landlord_id`,
            landlord_id
        );

        return NextResponse.json(
            { error: "Invalid landlord_id" },
            { status: 400 }
        );
    }

    if (String(sessionUser.landlord_id) !== String(landlord_id)) {
        return NextResponse.json(
            { error: "Forbidden: You can only access your own subscription." },
            { status: 403 }
        );
    }

    const cacheKey = `subscription:active:${landlord_id}`;

    try {
        /* --------------------------------------------------
           CHECK REDIS CACHE
        -------------------------------------------------- */
        const cached = await redis.get(cacheKey);
        if (cached) {
            return NextResponse.json(
                typeof cached === "string" ? JSON.parse(cached) : cached
            );
        }

        /* --------------------------------------------------
           FETCH ACTIVE SUBSCRIPTION + PLAN + LIMITS + FEATURES
        -------------------------------------------------- */
        const [rows]: any = await db.query(
            `
                SELECT
                    s.subscription_id,
                    s.start_date,
                    s.end_date,
                    s.payment_status,
                    s.is_trial,
                    s.is_active,
                    s.plan_code,

                    p.plan_id,
                    p.name AS plan_name,
                    p.price,
                    p.billing_cycle,

                    pl.max_properties,
                    pl.max_units,
                    pl.max_maintenance_request,
                    pl.max_billing,
                    pl.max_prospect,
                    pl.max_storage,
                    pl.max_assets_per_property,
                    pl.financial_history_years,

                    pf.reports,
                    pf.pdc_management,
                    pf.ai_unit_generator,
                    pf.bulk_import,
                    pf.announcements,
                    pf.asset_management,
                    pf.financial_insights

                FROM Subscription s

                         JOIN Plan p
                              ON s.plan_code = p.plan_code   -- ✅ FIX

                         LEFT JOIN PlanLimits pl
                                   ON p.plan_id = pl.plan_id

                         LEFT JOIN PlanFeatures pf
                                   ON p.plan_id = pf.plan_id

                WHERE s.landlord_id = ?
                  AND s.is_active = 1
                LIMIT 1
            `,
            [landlord_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { error: "Subscription not found" },
                { status: 404 }
            );
        }

        const data = rows[0];

        /* --------------------------------------------------
           EXPIRATION CHECK
        -------------------------------------------------- */
        const now = new Date();
        const endDate = data.end_date ? new Date(data.end_date) : null;

        if (endDate && endDate < now && data.is_active === 1) {
            await db.query(
                `UPDATE Subscription SET is_active = 0 WHERE landlord_id = ?`,
                [landlord_id]
            );

            data.is_active = 0;
        }

        /* --------------------------------------------------
           FORMAT RESPONSE STRUCTURE
        -------------------------------------------------- */
        const subscription = {
            subscription_id: data.subscription_id,
            plan_id: data.plan_id,
            plan_code: data.plan_code,
            plan_name: data.plan_name,
            price: data.price,
            billing_cycle: data.billing_cycle,

            start_date: data.start_date,
            end_date: data.end_date,
            payment_status: data.payment_status,
            is_trial: data.is_trial,
            is_active: data.is_active,

            limits: {
                maxProperties: data.max_properties,
                maxUnits: data.max_units,
                maxMaintenanceRequest: data.max_maintenance_request,
                maxBilling: data.max_billing,
                maxProspect: data.max_prospect,
                maxStorage: data.max_storage,
                maxAssetsPerProperty: data.max_assets_per_property,
                financialHistoryYears: data.financial_history_years,
            },

            features: {
                reports: Boolean(data.reports),
                pdcManagement: Boolean(data.pdc_management),
                aiUnitGenerator: Boolean(data.ai_unit_generator),
                bulkImport: Boolean(data.bulk_import),
                announcements: Boolean(data.announcements),
                assetManagement: Boolean(data.asset_management),
                financialInsights: Boolean(data.financial_insights),
            },
        };

        /* --------------------------------------------------
           CACHE RESULT (1 minute)
        -------------------------------------------------- */
        await redis.set(cacheKey, JSON.stringify(subscription), {
            ex: 60,
        });

        return NextResponse.json(subscription);

    } catch (error) {
        console.error(
            `[SUBSCRIPTION][${requestId}] FATAL ERROR`,
            error
        );

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
