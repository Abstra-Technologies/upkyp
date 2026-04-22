import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* ------------------ HELPERS ------------------ */
const log = (...args: any[]) =>
    console.log("[TENANT BILLING]", ...args);

function monthRange(date = new Date()) {
    const d = new Date(date);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);

    const ymd = (x: Date) =>
        `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(
            x.getDate()
        ).padStart(2, "0")}`;

    return { start: ymd(start), end: ymd(end) };
}

/* ------------------ GET ------------------ */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    let agreementId = searchParams.get("agreement_id");
    const userId = searchParams.get("user_id");

    log("Request params:", { agreementId, userId });

    try {
        /* -----------------------------------------------------
           Resolve tenant → agreement
        ----------------------------------------------------- */
        let tenantId: number | null = null;

        if (userId) {
            const [tenant]: any = await db.query(
                `SELECT tenant_id FROM Tenant WHERE user_id = ? LIMIT 1`,
                [userId]
            );
            tenantId = tenant[0]?.tenant_id || null;
        }

        if (!agreementId && tenantId) {
            const [agreements]: any = await db.query(
                `
                SELECT agreement_id
                FROM LeaseAgreement
                WHERE tenant_id = ?
                ORDER BY start_date DESC
                LIMIT 1
                `,
                [tenantId]
            );
            agreementId = agreements[0]?.agreement_id || null;
        }

        if (!agreementId) {
            return NextResponse.json(
                { message: "Missing agreement_id or user_id." },
                { status: 400 }
            );
        }

        /* -----------------------------------------------------
           Lease + Unit + Property
        ----------------------------------------------------- */
        const [leaseRows]: any = await db.query(
            `
            SELECT
                l.agreement_id,
                l.unit_id,
                l.rent_amount AS lease_rent_amount,
                u.unit_name,
                u.property_id,
                u.rent_amount AS unit_rent_amount,
                p.water_billing_type,
                p.electricity_billing_type
            FROM LeaseAgreement l
            JOIN Unit u ON l.unit_id = u.unit_id
            JOIN Property p ON u.property_id = p.property_id
            WHERE l.agreement_id = ?
            LIMIT 1
            `,
            [agreementId]
        );

        if (!leaseRows.length) {
            return NextResponse.json(
                { message: "Lease not found." },
                { status: 404 }
            );
        }

        const lease = leaseRows[0];
        const { unit_id, property_id } = lease;

        /* -----------------------------------------------------
           Base Rent Resolution
        ----------------------------------------------------- */
        let baseRent = Number(lease.lease_rent_amount || 0);
        if (!baseRent || baseRent <= 0) {
            baseRent = Number(lease.unit_rent_amount || 0);
        }

        /* -----------------------------------------------------
           Property Configuration
        ----------------------------------------------------- */
        const [cfg]: any = await db.query(
            `
            SELECT billingReminderDay, billingDueDay,
                   lateFeeType, lateFeeAmount, gracePeriodDays
            FROM PropertyConfiguration
            WHERE property_id = ?
            LIMIT 1
            `,
            [property_id]
        );

        const propertyConfig = cfg[0] || null;

        /* -----------------------------------------------------
           Concessionaire Rates
        ----------------------------------------------------- */
        const [conRows]: any = await db.query(
            `
            SELECT *
            FROM ConcessionaireBilling
            WHERE property_id = ?
            ORDER BY period_end DESC
            LIMIT 1
            `,
            [property_id]
        );

        const concessionaire = conRows[0] || null;

        const waterRate = concessionaire?.water_consumption
            ? concessionaire.water_total / concessionaire.water_consumption
            : 0;

        const electricityRate = concessionaire?.electricity_consumption
            ? concessionaire.electricity_total /
            concessionaire.electricity_consumption
            : 0;

        /* -----------------------------------------------------
           Current Month Context
        ----------------------------------------------------- */
        const { start: periodStart, end: periodEnd } = monthRange();

        /* -----------------------------------------------------
           Billing (current month)
        ----------------------------------------------------- */
        const [billingRows]: any = await db.query(
            `
            SELECT *
            FROM Billing
            WHERE unit_id = ?
              AND billing_period = ?
            LIMIT 1
            `,
            [unit_id, periodStart]
        );

        const billing = billingRows[0] || null;

        /* -----------------------------------------------------
           Meter Readings
        ----------------------------------------------------- */
        const [waterRows]: any = await db.query(
            `
            SELECT *
            FROM WaterMeterReading
            WHERE unit_id = ?
              AND period_start = ?
              AND period_end   = ?
            LIMIT 1
            `,
            [unit_id, periodStart, periodEnd]
        );

        const [electricRows]: any = await db.query(
            `
            SELECT *
            FROM ElectricMeterReading
            WHERE unit_id = ?
              AND period_start = ?
              AND period_end   = ?
            LIMIT 1
            `,
            [unit_id, periodStart, periodEnd]
        );

        const waterReading = waterRows[0] || null;
        const electricReading = electricRows[0] || null;

        /* -----------------------------------------------------
           Meter Readings Array (UI)
        ----------------------------------------------------- */
        const meterReadings: any[] = [];

        if (waterReading) {
            meterReadings.push({
                type: "water",
                prev: waterReading.previous_reading,
                curr: waterReading.current_reading,
                consumption: waterReading.consumption,
                period_end: waterReading.period_end,
                rate: waterRate,
                total: billing?.total_water_amount || 0,
            });
        }

        if (electricReading) {
            meterReadings.push({
                type: "electricity",
                prev: electricReading.previous_reading,
                curr: electricReading.current_reading,
                consumption: electricReading.consumption,
                period_end: electricReading.period_end,
                rate: electricityRate,
                total: billing?.total_electricity_amount || 0,
            });
        }

        /* -----------------------------------------------------
           Additional Charges
        ----------------------------------------------------- */
        let billingAdditionalCharges: any[] = [];
        if (billing) {
            const [charges]: any = await db.query(
                `SELECT * FROM BillingAdditionalCharge WHERE billing_id = ?`,
                [billing.billing_id]
            );
            billingAdditionalCharges = charges;
        }

        /* -----------------------------------------------------
           Post-dated checks
        ----------------------------------------------------- */
        const [pdcRows]: any = await db.query(
            `
            SELECT *
            FROM PostDatedCheck
            WHERE lease_id = ?
              AND MONTH(due_date) = MONTH(CURRENT_DATE())
              AND YEAR(due_date) = YEAR(CURRENT_DATE())
            ORDER BY due_date ASC
            `,
            [agreementId]
        );

        const paymentProcessing = pdcRows.some((pdc: any) =>
            ["pending", "processing"].includes(pdc.status)
        );

        /* -----------------------------------------------------
           FINAL RESPONSE (CLEAN & CONSISTENT)
        ----------------------------------------------------- */
        return NextResponse.json(
            {
                billing: billing
                    ? {
                        ...billing,
                        unit_name: lease.unit_name,
                        total_amount_due: Number(
                            billing.total_amount_due || 0
                        ),

                        // ✅ SINGLE SOURCE OF TRUTH
                        billing_status: billing.status,
                        is_paid: billing.status === "paid",
                        paid_at: billing.paid_at || null,
                    }
                    : null,

                utilities: {
                    water: {
                        enabled: lease.water_billing_type === "submetered",
                        prev: waterReading?.previous_reading || null,
                        curr: waterReading?.current_reading || null,
                        consumption: waterReading?.consumption || null,
                        period_end: waterReading?.period_end || null,
                        rate: waterRate,
                        total: billing?.total_water_amount || 0,
                    },
                    electricity: {
                        enabled:
                            lease.electricity_billing_type === "submetered",
                        prev: electricReading?.previous_reading || null,
                        curr: electricReading?.current_reading || null,
                        consumption: electricReading?.consumption || null,
                        period_end: electricReading?.period_end || null,
                        rate: electricityRate,
                        total: billing?.total_electricity_amount || 0,
                    },
                },

                meterReadings,
                billingAdditionalCharges,
                postDatedChecks: pdcRows,
                paymentProcessing,

                breakdown: {
                    base_rent: baseRent,
                    water_total: billing?.total_water_amount || 0,
                    electricity_total:
                        billing?.total_electricity_amount || 0,
                    total_before_late_fee:
                        billing?.total_amount_due || baseRent,
                },

                propertyConfig,
                concessionaire_period: {
                    period_start: concessionaire?.period_start || null,
                    period_end: concessionaire?.period_end || null,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("❌ Tenant Billing Fetch Error:", error);
        return NextResponse.json(
            { message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}
