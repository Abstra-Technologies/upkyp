import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { cacheLife, cacheTag } from "next/cache";

async function getCachedSignatureStatus(agreement_id: string) {
    "use cache";
    cacheLife("minutes");
    cacheTag(`signature-status-${agreement_id}`);

    const [rows]: any = await db.query(
        `
        SELECT 
            la.agreement_id,
            la.status AS agreement_status,
            la.agreement_url,

            la.start_date,
            la.end_date,
            la.move_in_date,

            COALESCE(NULLIF(la.rent_amount, 0), un.rent_amount) AS effective_rent_amount,
            la.rent_amount AS lease_rent_amount,
            un.rent_amount AS unit_rent_amount,

            la.security_deposit_amount,
            la.advance_payment_amount,
            la.billing_due_day,

            ls.id AS signature_id,
            ls.status AS signature_status,
            ls.signed_at,

            u.email AS tenant_email_enc,

            p.property_name,
            un.unit_name

        FROM LeaseAgreement la
        LEFT JOIN LeaseSignature ls 
            ON la.agreement_id = ls.agreement_id
            AND ls.role = 'tenant'
        JOIN Tenant t ON la.tenant_id = t.tenant_id
        JOIN User u ON t.user_id = u.user_id
        JOIN Unit un ON la.unit_id = un.unit_id
        JOIN Property p ON un.property_id = p.property_id
        WHERE la.agreement_id = ?
        LIMIT 1
        `,
        [agreement_id]
    );

    if (!rows.length) {
        return { error: "Lease not found" };
    }

    const data = rows[0];

    let tenantEmail: string | null = null;
    try {
        tenantEmail = data.tenant_email_enc
            ? decryptData(JSON.parse(data.tenant_email_enc), process.env.ENCRYPTION_SECRET!)
            : null;
    } catch {
        tenantEmail = null;
    }

    let leaseUrl: string | null = null;
    try {
        leaseUrl = data.agreement_url
            ? decryptData(JSON.parse(data.agreement_url), process.env.ENCRYPTION_SECRET!)
            : null;
    } catch {
        leaseUrl = data.agreement_url;
    }

    const tenantSignature = data.signature_id
        ? {
            id: data.signature_id,
            status: data.signature_status,
            signed_at: data.signed_at,
            email: tenantEmail,
        }
        : null;

    return {
        success: true,
        agreement_id,
        agreement_status: data.agreement_status,
        property_name: data.property_name,
        unit_name: data.unit_name,
        agreement_url: leaseUrl,
        lease: {
            start_date: data.start_date,
            end_date: data.end_date,
            move_in_date: data.move_in_date,
            rent_amount: data.effective_rent_amount,
            lease_rent_amount: data.lease_rent_amount,
            unit_rent_amount: data.unit_rent_amount,
            security_deposit_amount: data.security_deposit_amount,
            advance_payment_amount: data.advance_payment_amount,
            billing_due_day: data.billing_due_day,
        },
        tenant_signature: tenantSignature,
    };
}

export async function GET(req: NextRequest) {
    try {
        const agreement_id = req.nextUrl.searchParams.get("agreement_id");

        if (!agreement_id) {
            return NextResponse.json(
                { error: "Missing agreement_id" },
                { status: 400 }
            );
        }

        const result = await getCachedSignatureStatus(agreement_id);

        if (result.error) {
            return NextResponse.json(
                { error: result.error },
                { status: 404 }
            );
        }

        return NextResponse.json(result);
    } catch (err: any) {
        console.error("Lease signature fetch error:", err);
        return NextResponse.json(
            { error: "Failed to fetch lease" },
            { status: 500 }
        );
    }
}