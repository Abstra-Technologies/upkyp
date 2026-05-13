import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cacheLife, cacheTag } from "next/cache";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

async function getCachedBillingDetails(
    billing_id: string | null,
    lease_id: string | null,
    month: string | null,
    year: string | null
) {
    "use cache";
    cacheLife("hours");
    const tagId = billing_id || lease_id || "unknown";
    cacheTag(`billing-details-${tagId}`);

    let billingQuery: string;
    let billingParams: any[];

    if (billing_id) {
        billingQuery = `SELECT b.* FROM Billing b WHERE b.billing_id = ?`;
        billingParams = [billing_id];
    } else {
        billingQuery = `SELECT b.* FROM Billing b WHERE b.lease_id = ? AND MONTH(b.billing_period) = ? AND YEAR(b.billing_period) = ?`;
        billingParams = [lease_id, month, year];
    }

    const [billingRows]: any = await db.query(billingQuery, billingParams);

    if (billingRows.length === 0) {
        return null;
    }

    const billing = billingRows[0];

    const [charges]: any = await db.query(
        `SELECT * FROM BillingAdditionalCharge WHERE billing_id = ? ORDER BY charge_category, id ASC`,
        [billing.billing_id]
    );

    const [payments]: any = await db.query(
        `SELECT * FROM Payment WHERE bill_id = ? ORDER BY created_at DESC`,
        [billing.billing_id]
    );

    const [electricReadings]: any = await db.query(
        `SELECT * FROM ElectricMeterReading WHERE lease_id = ? AND period_end >= ? AND period_end <= ? ORDER BY period_start ASC`,
        [billing.lease_id, billing.billing_period, billing.billing_period]
    );

    const [waterReadings]: any = await db.query(
        `SELECT * FROM WaterMeterReading WHERE lease_id = ? AND period_end >= ? AND period_end <= ? ORDER BY period_start ASC`,
        [billing.lease_id, billing.billing_period, billing.billing_period]
    );

    const [leaseRows]: any = await db.query(
        `SELECT
            la.agreement_id,
            la.rent_amount,
            la.start_date,
            la.end_date,
            u.unit_id,
            u.unit_name,
            usr.firstName AS enc_firstName,
            usr.lastName AS enc_lastName,
            usr.email AS enc_email
         FROM LeaseAgreement la
         LEFT JOIN Unit u ON la.unit_id = u.unit_id
         LEFT JOIN Tenant t ON la.tenant_id = t.tenant_id
         LEFT JOIN User usr ON t.user_id = usr.user_id
         WHERE la.agreement_id = ?`,
        [billing.lease_id]
    );

    const safeDec = (val: any) => {
        try {
            return val ? decryptData(JSON.parse(val), SECRET_KEY) : "";
        } catch {
            return "";
        }
    };

    const lease = leaseRows[0] || null;
    const tenantName = lease
        ? `${safeDec(lease.enc_firstName)} ${safeDec(lease.enc_lastName)}`.trim()
        : "";

    return {
        billing: {
            billing_id: billing.billing_id,
            lease_id: billing.lease_id,
            unit_id: billing.unit_id,
            billing_period: billing.billing_period,
            total_water_amount: billing.total_water_amount ? Number(billing.total_water_amount) : 0,
            total_electricity_amount: billing.total_electricity_amount ? Number(billing.total_electricity_amount) : 0,
            total_amount_due: billing.total_amount_due ? Number(billing.total_amount_due) : 0,
            status: billing.status || "draft",
            due_date: billing.due_date,
            paid_at: billing.paid_at,
            created_at: billing.created_at,
            updated_at: billing.updated_at,
        },
        additionalCharges: charges.map((c: any) => ({
            id: c.id,
            charge_category: c.charge_category,
            charge_type: c.charge_type,
            amount: Number(c.amount),
        })),
        payments: payments.map((p: any) => ({
            payment_id: p.payment_id,
            transaction_id: p.transaction_id,
            payment_type: p.payment_type,
            amount_paid: Number(p.amount_paid),
            payment_method_id: p.payment_method_id,
            payment_status: p.payment_status,
            receipt_reference: p.receipt_reference,
            payment_date: p.payment_date,
            proof_of_payment: p.proof_of_payment,
            payout_status: p.payout_status,
        })),
        electricReadings: electricReadings.map((r: any) => ({
            reading_id: r.reading_id,
            previous_reading: Number(r.previous_reading),
            current_reading: Number(r.current_reading),
            consumption: Number(r.consumption || 0),
            period_start: r.period_start,
            period_end: r.period_end,
        })),
        waterReadings: waterReadings.map((r: any) => ({
            reading_id: r.reading_id,
            previous_reading: Number(r.previous_reading),
            current_reading: Number(r.current_reading),
            consumption: Number(r.consumption || 0),
            period_start: r.period_start,
            period_end: r.period_end,
        })),
        lease: lease
            ? {
                  agreement_id: lease.agreement_id,
                  unit_name: lease.unit_name,
                  unit_id: lease.unit_id,
                  rent_amount: lease.rent_amount ? Number(lease.rent_amount) : 0,
                  start_date: lease.start_date,
                  end_date: lease.end_date,
                  tenant_name: tenantName,
                  tenant_email: safeDec(lease.enc_email),
              }
            : null,
    };
}

export async function GET(req: NextRequest) {
    try {
        const billing_id = req.nextUrl.searchParams.get("billing_id");
        const lease_id = req.nextUrl.searchParams.get("lease_id");
        const month = req.nextUrl.searchParams.get("month");
        const year = req.nextUrl.searchParams.get("year");

        if (!billing_id && !lease_id) {
            return NextResponse.json({ error: "Missing billing_id or lease_id" }, { status: 400 });
        }

        const data = await getCachedBillingDetails(billing_id, lease_id, month, year);

        if (!data) {
            return NextResponse.json({ error: "Billing record not found" }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("Billing full details error:", err);
        return NextResponse.json({ error: "Failed to fetch billing details" }, { status: 500 });
    }
}
