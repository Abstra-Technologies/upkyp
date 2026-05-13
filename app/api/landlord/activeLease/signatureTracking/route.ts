import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { cacheLife, cacheTag } from "next/cache";

async function getCachedSignatureTracking(agreement_id: string) {
    "use cache";
    cacheLife("hours");
    cacheTag(`signature-tracking-${agreement_id}`);

    const [signatureRows]: any = await db.query(
        `SELECT id, role, status, signed_at
         FROM LeaseSignature
         WHERE agreement_id = ?`,
        [agreement_id]
    );

    const [userRows]: any = await db.query(
        `SELECT 
             t.email AS tenant_email_enc,
             lu.email AS landlord_email_enc
         FROM LeaseAgreement la
         JOIN Tenant tn ON la.tenant_id = tn.tenant_id
         JOIN User t ON t.user_id = tn.user_id
         JOIN Unit u ON la.unit_id = u.unit_id
         JOIN Property p ON u.property_id = p.property_id
         JOIN Landlord l ON p.landlord_id = l.landlord_id
         JOIN User lu ON lu.user_id = l.user_id
         WHERE la.agreement_id = ?`,
        [agreement_id]
    );

    if (!userRows?.[0]) {
        return { error: "Lease agreement not found or missing related records" };
    }

    const { tenant_email_enc, landlord_email_enc } = userRows[0];

    let tenantEmail: string | null = null;
    let landlordEmail: string | null = null;

    if (tenant_email_enc) {
        try {
            tenantEmail = decryptData(
                JSON.parse(tenant_email_enc),
                process.env.ENCRYPTION_SECRET!
            );
        } catch {
            console.warn(`Failed to decrypt tenant email for agreement_id ${agreement_id}`);
        }
    }

    if (landlord_email_enc) {
        try {
            landlordEmail = decryptData(
                JSON.parse(landlord_email_enc),
                process.env.ENCRYPTION_SECRET!
            );
        } catch {
            console.warn(`Failed to decrypt landlord email for agreement_id ${agreement_id}`);
        }
    }

    const finalSignatures = ["landlord", "tenant"].map((role) => {
        const sig = signatureRows.find((s: any) => s.role === role);
        return {
            id: sig?.id ?? null,
            role,
            status: sig?.status ?? "pending",
            signed_at: sig?.signed_at ?? null,
            email: role === "tenant" ? tenantEmail : landlordEmail,
        };
    });

    const signedCount = finalSignatures.filter((s) => s.status === "signed").length;
    const totalSigners = 2;
    const percentage = Math.round((signedCount / totalSigners) * 100);

    const [leaseRows]: any = await db.query(
        `SELECT status FROM LeaseAgreement WHERE agreement_id = ?`,
        [agreement_id]
    );
    const leaseStatus = leaseRows?.[0]?.status ?? "pending";
    const tracking_enabled = signatureRows.length > 0;

    return {
        success: true,
        tracking_enabled,
        agreement_id,
        percentage,
        signed_count: signedCount,
        total_signers: totalSigners,
        agreement_status: leaseStatus,
        signatures: finalSignatures,
    };
}

export async function GET(req: NextRequest) {
    try {
        const agreement_id = req.nextUrl.searchParams.get("agreement_id");

        if (!agreement_id) {
            return NextResponse.json(
                { error: "Missing required query parameter: agreement_id" },
                { status: 400 }
            );
        }

        const result = await getCachedSignatureTracking(agreement_id);

        if (result.error) {
            return NextResponse.json(
                { error: result.error },
                { status: 404 }
            );
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Database query failed while fetching lease signatures:", error);
        return NextResponse.json(
            {
                success: false,
                message: `Failed to retrieve lease signature data: ${error.message}`,
            },
            { status: 500 }
        );
    }
}