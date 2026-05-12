import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

export const runtime = "nodejs";
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const agreement_id = searchParams.get("agreement_id");

    if (!agreement_id) {
        return NextResponse.json(
            { error: "Missing agreement_id parameter." },
            { status: 400 }
        );
    }

    try {
        const [rows]: any = await db.query(
            `
        SELECT
            la.agreement_id,
            la.unit_id,
            la.tenant_id,
            la.start_date,
            la.end_date,
            la.status AS lease_status,
            la.security_deposit_amount,
            la.advance_payment_amount,
            la.billing_due_day,
            la.grace_period_days,
            la.late_penalty_amount,
            la.agreement_url,

            u.unit_name,
            u.rent_amount,

            p.property_id,
            p.property_name,

            -- 🧩 Landlord (from User)
            l.landlord_id,
            lu.firstName AS landlord_firstName_encrypted,
            lu.lastName  AS landlord_lastName_encrypted,
            lu.email     AS landlord_email_encrypted,
            lu.phoneNumber AS landlord_phone_encrypted,
            lu.birthDate AS landlord_birth_encrypted,
            lu.civil_status AS landlord_civil_status_encrypted,

            -- Plain text fields
            lu.address AS landlord_address,
            lu.citizenship AS landlord_citizenship,
            lu.occupation AS landlord_occupation,

            -- 🧩 Tenant (from User)
            t.tenant_id,
            tu.firstName AS tenant_firstName_encrypted,
            tu.lastName  AS tenant_lastName_encrypted,
            tu.email     AS tenant_email_encrypted,
            tu.phoneNumber AS tenant_phone_encrypted,
            tu.birthDate AS tenant_birth_encrypted,
            tu.civil_status AS tenant_civil_status_encrypted,

            -- Plain text fields
            tu.address AS tenant_address,
            tu.citizenship AS tenant_citizenship,
            tu.occupation AS tenant_occupation

        FROM LeaseAgreement la
        JOIN Unit u       ON la.unit_id = u.unit_id
        JOIN Property p   ON u.property_id = p.property_id
        JOIN Landlord l   ON p.landlord_id = l.landlord_id
        JOIN User lu      ON l.user_id = lu.user_id
        JOIN Tenant t     ON la.tenant_id = t.tenant_id
        JOIN User tu      ON t.user_id = tu.user_id
        WHERE la.agreement_id = ?
        LIMIT 1
      `,
            [agreement_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json({ error: "Lease not found." }, { status: 404 });
        }

        const row = rows[0];
        const SEC = process.env.ENCRYPTION_SECRET;

        const safeDecrypt = (maybeJson: any) => {
            try {
                if (!maybeJson) return null;
                const parsed = JSON.parse(maybeJson);
                return decryptData(parsed, SEC);
            } catch {
                return null;
            }
        };

        // Compute age helper
        const computeAge = (birth: string | null) => {
            if (!birth) return null;
            const diff = Date.now() - new Date(birth).getTime();
            return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
        };

        // Decrypt tenant / landlord names and sensitive fields
        const tenant_first = safeDecrypt(row.tenant_firstName_encrypted);
        const tenant_last = safeDecrypt(row.tenant_lastName_encrypted);
        const landlord_first = safeDecrypt(row.landlord_firstName_encrypted);
        const landlord_last = safeDecrypt(row.landlord_lastName_encrypted);
        const lease_url = safeDecrypt(row.agreement_url);

        const response = {
            agreement_id: row.agreement_id,
            lease_status: row.lease_status,
            start_date: row.start_date,
            end_date: row.end_date,

            unit_id: row.unit_id,
            unit_name: row.unit_name,
            rent_amount: row.rent_amount,

            property_id: row.property_id,
            property_name: row.property_name,

            // 🧩 Tenant Info
            tenant_id: row.tenant_id,
            tenant_name: [tenant_first, tenant_last].filter(Boolean).join(" ") || "Unknown",
            tenant_email: safeDecrypt(row.tenant_email_encrypted),
            tenant_phone: safeDecrypt(row.tenant_phone_encrypted),
            tenant_birthdate: safeDecrypt(row.tenant_birth_encrypted),
            tenant_civil_status: safeDecrypt(row.tenant_civil_status_encrypted),
            tenant_age: computeAge(safeDecrypt(row.tenant_birth_encrypted)),
            tenant_address: row.tenant_address || null,
            tenant_citizenship: row.tenant_citizenship || null,
            tenant_occupation: row.tenant_occupation || null,

            // 🧩 Landlord Info
            landlord_id: row.landlord_id,
            landlord_name: [landlord_first, landlord_last].filter(Boolean).join(" "),
            landlord_email: safeDecrypt(row.landlord_email_encrypted),
            landlord_phone: safeDecrypt(row.landlord_phone_encrypted),
            landlord_birthdate: safeDecrypt(row.landlord_birth_encrypted),
            landlord_civil_status: safeDecrypt(row.landlord_civil_status_encrypted),
            landlord_age: computeAge(safeDecrypt(row.landlord_birth_encrypted)),
            landlord_address: row.landlord_address || null,
            landlord_citizenship: row.landlord_citizenship || null,
            landlord_occupation: row.landlord_occupation || null,

            // 🧾 Lease Financials
            security_deposit_amount: row.security_deposit_amount,
            advance_payment_amount: row.advance_payment_amount,
            billing_due_day: row.billing_due_day,
            grace_period_days: row.grace_period_days,
            late_penalty_amount: row.late_penalty_amount,

            agreement_url: lease_url,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error: any) {
        console.error("❌ Error in getById:", error?.message || error);
        return NextResponse.json(
            { error: `Internal server error: ${error?.message || "Unknown"}` },
            { status: 500 }
        );
    }
}
