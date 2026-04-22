// used for submetered billing

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

/* ------------------ DATE HELPERS ------------------ */
const ymd = (d: Date | string | null) => {
    if (!d) return null;
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(
        x.getDate()
    ).padStart(2, "0")}`;
};

const firstDayOfMonth = (d = new Date()) =>
    new Date(d.getFullYear(), d.getMonth(), 1);

const lastDayOfMonth = (d = new Date()) =>
    new Date(d.getFullYear(), d.getMonth() + 1, 0);

/* ------------------ API ------------------ */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const unit_id = searchParams.get("unit_id");

    if (!unit_id) {
        return NextResponse.json({ error: "Missing unit_id" }, { status: 400 });
    }

    try {
        /* -------------------------------------------------
           1. UNIT
        -------------------------------------------------- */
        const [unitRows] = await db.execute<RowDataPacket[]>(
            `SELECT * FROM Unit WHERE unit_id = ? LIMIT 1`,
            [unit_id]
        );

        if (unitRows.length === 0) {
            return NextResponse.json({ error: "Unit not found" }, { status: 404 });
        }

        const unit = unitRows[0];

        /* -------------------------------------------------
           2. PROPERTY
        -------------------------------------------------- */
        const [propertyRows] = await db.execute<RowDataPacket[]>(
            `SELECT * FROM Property WHERE property_id = ? LIMIT 1`,
            [unit.property_id]
        );

        const property = propertyRows[0] ?? null;

        /* -------------------------------------------------
           3. PROPERTY CONFIG (DUE DAY)
        -------------------------------------------------- */
        const [configRows] = await db.execute<RowDataPacket[]>(
            `SELECT billingDueDay FROM PropertyConfiguration WHERE property_id = ? LIMIT 1`,
            [unit.property_id]
        );

        const billingDueDay = Number(configRows[0]?.billingDueDay ?? 30);

        /* -------------------------------------------------
           4. STRICT RENT RESOLUTION (LEASE → UNIT)
        -------------------------------------------------- */
        let effectiveRentAmount = Number(unit.rent_amount || 0);
        let rentSource: "lease" | "unit" = "unit";
        let activeLeaseId: string | null = null;

        const [leaseRows] = await db.execute<RowDataPacket[]>(
            `
            SELECT agreement_id, rent_amount
            FROM LeaseAgreement
            WHERE unit_id = ?
              AND status IN ('active','tenant_signed','landlord_signed')
            ORDER BY start_date DESC
            LIMIT 1
            `,
            [unit_id]
        );

        if (leaseRows.length > 0 && leaseRows[0].rent_amount != null) {
            effectiveRentAmount = Number(leaseRows[0].rent_amount);
            rentSource = "lease";
            activeLeaseId = leaseRows[0].agreement_id;
        }

        /* -------------------------------------------------
           5. EXISTING BILLING (USE REAL billing_period)
        -------------------------------------------------- */
        const today = new Date();
        const monthStart = firstDayOfMonth(today);
        const monthEnd = lastDayOfMonth(today);

        const [billingRows] = await db.execute<RowDataPacket[]>(
            `
            SELECT *
            FROM Billing
            WHERE unit_id = ?
              AND billing_period BETWEEN ? AND ?
            ORDER BY billing_period DESC
            LIMIT 1
            `,
            [unit_id, ymd(monthStart), ymd(monthEnd)]
        );

        let billing_id: string | null = null;
        let total_amount_due: number | null = null;
        let billing_period: string | null = ymd(monthStart);
        let additionalCharges: any[] = [];
        let discounts: any[] = [];

        if (billingRows.length > 0) {
            const billing = billingRows[0];

            billing_id = billing.billing_id;
            total_amount_due = billing.total_amount_due;

            // ✅ USE ACTUAL billing_period FROM DB
            billing_period = ymd(billing.billing_period);

            const [charges] = await db.execute<RowDataPacket[]>(
                `
                SELECT id, charge_category, charge_type, amount
                FROM BillingAdditionalCharge
                WHERE billing_id = ?
                `,
                [billing_id]
            );

            additionalCharges = charges.filter(c => c.charge_category === "additional");
            discounts = charges.filter(c => c.charge_category === "discount");
        }

        /* -------------------------------------------------
           6. METER READINGS
        -------------------------------------------------- */
        const [[waterCurr]] = await db.execute<RowDataPacket[]>(
            `
            SELECT period_start, period_end, previous_reading, current_reading
            FROM WaterMeterReading
            WHERE unit_id = ?
              AND DATE_FORMAT(period_end,'%Y-%m') = DATE_FORMAT(?,'%Y-%m')
            ORDER BY period_end DESC
            LIMIT 1
            `,
            [unit_id, ymd(today)]
        );

        const [[elecCurr]] = await db.execute<RowDataPacket[]>(
            `
            SELECT period_start, period_end, previous_reading, current_reading
            FROM ElectricMeterReading
            WHERE unit_id = ?
              AND DATE_FORMAT(period_end,'%Y-%m') = DATE_FORMAT(?,'%Y-%m')
            ORDER BY period_end DESC
            LIMIT 1
            `,
            [unit_id, ymd(today)]
        );

        const readingDate =
            waterCurr?.period_end || elecCurr?.period_end || today;

        /* -------------------------------------------------
           7. COMPUTE DUE DATE
        -------------------------------------------------- */
        const ref = new Date(readingDate);
        const daysInMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
        const safeDay = Math.min(Math.max(1, billingDueDay), daysInMonth);

        const dueDate = ymd(new Date(ref.getFullYear(), ref.getMonth(), safeDay));

        /* -------------------------------------------------
           8. RESPONSE
        -------------------------------------------------- */

        return NextResponse.json(
            {
                unit: {
                    ...unit,
                    effective_rent_amount: effectiveRentAmount,
                    rent_source: rentSource,
                },
                property,
                dueDate,
                existingBilling: {
                    billing_id,
                    lease_id: activeLeaseId,

                    billing_period,

                    due_date: dueDate,
                    total_amount_due,

                    utility_period_from: ymd(
                        waterCurr?.period_start || elecCurr?.period_start || null
                    ),
                    utility_period_to: ymd(
                        waterCurr?.period_end || elecCurr?.period_end || null
                    ),

                    reading_date: ymd(readingDate),

                    water_prev: waterCurr?.previous_reading ?? null,
                    water_curr: waterCurr?.current_reading ?? null,
                    elec_prev: elecCurr?.previous_reading ?? null,
                    elec_curr: elecCurr?.current_reading ?? null,

                    additional_charges: additionalCharges,
                    discounts,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("DB Error (getUnitBilling):", error);
        return NextResponse.json({ error: "DB Server Error" }, { status: 500 });
    }
}
