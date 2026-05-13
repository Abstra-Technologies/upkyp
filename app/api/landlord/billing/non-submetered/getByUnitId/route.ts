import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cacheLife, cacheTag } from "next/cache";
import { decryptData } from "@/crypto/encrypt";

async function getCachedNonSubmeteredBilling(unit_id: string) {
    "use cache";
    cacheLife("hours");
    cacheTag(`non-submetered-${unit_id}`);

    const [rows]: any = await db.query(
        `
        SELECT
            la.agreement_id,
            la.unit_id,
            la.tenant_id,
            la.security_deposit_amount,
            la.advance_payment_amount,
            un.unit_name,
            us.firstName,
            us.lastName,
            p.property_id,
            p.property_name,
            un.rent_amount AS base_rent,
            CURDATE() AS billing_period
        FROM LeaseAgreement la
                 JOIN Unit un ON la.unit_id = un.unit_id
                 JOIN Tenant t ON la.tenant_id = t.tenant_id
                 JOIN User us ON t.user_id = us.user_id
                 JOIN Property p ON un.property_id = p.property_id
        WHERE la.status = 'active'
          AND la.unit_id = ?
          AND (p.water_billing_type != 'submetered' OR p.electricity_billing_type != 'submetered')
        LIMIT 1
        `,
        [unit_id]
    );

    if (!rows.length) {
        return null;
    }

    const row = rows[0];

    const [configRows]: any = await db.query(
        `
        SELECT billingDueDay AS billing_due_day,
               lateFeeAmount AS late_fee_amount,
               lateFeeType
        FROM PropertyConfiguration
        WHERE property_id = ?
        LIMIT 1
        `,
        [row.property_id]
    );

    const propertyConfig = configRows?.[0] || {
        billing_due_day: null,
        late_fee_amount: 0,
        lateFeeType: "fixed",
    };

    const firstName = row.firstName
        ? await decryptData(JSON.parse(row.firstName), process.env.ENCRYPTION_SECRET!)
        : "";
    const lastName = row.lastName
        ? await decryptData(JSON.parse(row.lastName), process.env.ENCRYPTION_SECRET!)
        : "";
    const tenant_name = `${firstName} ${lastName}`.trim();

    const [billingRows]: any = await db.query(
        `
        SELECT billing_id, total_amount_due, status, billing_period
        FROM Billing
        WHERE unit_id = ?
          AND MONTH(billing_period) = MONTH(CURDATE())
          AND YEAR(billing_period) = YEAR(CURDATE())
        LIMIT 1
        `,
        [unit_id]
    );

    const billing = billingRows?.[0] || null;
    const billing_id = billing?.billing_id || null;

    let additional_charges: any[] = [];
    let discounts: any[] = [];

    if (billing_id) {
        const [charges]: any = await db.query(
            `
            SELECT id AS charge_id, charge_category, charge_type, amount
            FROM BillingAdditionalCharge
            WHERE billing_id = ?
            `,
            [billing_id]
        );

        additional_charges = charges.filter(
            (c: any) => c.charge_category === "additional"
        );
        discounts = charges.filter(
            (c: any) => c.charge_category === "discount"
        );
    }

    if (!Array.isArray(additional_charges)) additional_charges = [];
    if (!Array.isArray(discounts)) discounts = [];

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const dueDate = propertyConfig.billing_due_day
        ? new Date(year, month, propertyConfig.billing_due_day)
        : null;

    return {
        bills: [{
            ...row,
            tenant_name,
            billing_id,
            billing_period: billing?.billing_period || row.billing_period,
            status: billing?.status || "no_bill",
            total_amount_due: billing?.total_amount_due || 0,
            billing_due_day: propertyConfig.billing_due_day,
            late_fee_amount: propertyConfig.late_fee_amount,
            late_fee_type: propertyConfig.lateFeeType,
            due_date: dueDate,
            additional_charges,
            discounts,
        }],
    };
}

export async function GET(req: NextRequest) {
    try {
        const unit_id = req.nextUrl.searchParams.get("unit_id");

        if (!unit_id) {
            return NextResponse.json({ error: "Missing unit_id" }, { status: 400 });
        }

        const data = await getCachedNonSubmeteredBilling(unit_id);

        if (!data) {
            return NextResponse.json(
                { message: "No active lease or non-submetered configuration found for this unit." },
                { status: 404 }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("❌ Error fetching non-submetered billing by unit:", error);
        return NextResponse.json(
            { error: "Failed to fetch non-submetered billing data", details: error.message },
            { status: 500 }
        );
    }
}
