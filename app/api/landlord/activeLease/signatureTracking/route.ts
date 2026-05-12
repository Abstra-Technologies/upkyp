import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

export const runtime = "nodejs";
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const agreement_id = searchParams.get("agreement_id");

        if (!agreement_id) {
            return NextResponse.json(
                { error: "Missing required query parameter: agreement_id" },
                { status: 400 }
            );
        }

        // 1. Fetch signature records for the agreement
        const [signatureRows]: any = await db.query(
            `SELECT id, role, status, signed_at
             FROM LeaseSignature
             WHERE agreement_id = ?`,
            [agreement_id]
        );

        // 2. Fetch tenant and landlord encrypted emails for the agreement
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
            return NextResponse.json(
                { error: "Lease agreement not found or missing related records" },
                { status: 404 }
            );
        }

        const { tenant_email_enc, landlord_email_enc } = userRows[0];

        // 3. Decrypt emails (handle errors gracefully)
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

        // 4. Construct signature array always with landlord and tenant, defaults to pending if none found
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

        // 5. Compute signature progress percentage
        const signedCount = finalSignatures.filter((s) => s.status === "signed").length;
        const totalSigners = 2;
        const percentage = Math.round((signedCount / totalSigners) * 100);

        // 6. Get lease status for completeness
        const [leaseRows]: any = await db.query(
            `SELECT status FROM LeaseAgreement WHERE agreement_id = ?`,
            [agreement_id]
        );
        const leaseStatus = leaseRows?.[0]?.status ?? "pending";

        // 7. Determine if signature records exist (for UI visibility)
        const tracking_enabled = signatureRows.length > 0;

        // 8. Return JSON response with all required info
        return NextResponse.json({
            success: true,
            tracking_enabled,
            agreement_id,
            percentage,
            signed_count: signedCount,
            total_signers: totalSigners,
            agreement_status: leaseStatus,
            signatures: finalSignatures,
        });
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
