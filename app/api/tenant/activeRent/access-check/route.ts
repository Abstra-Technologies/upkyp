import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth";

/**
 * Sample health check endpoint
 *
 * @name GET
 * @function check if access requirement is satisfied.
 * @param {agreement_id}
 * @returns {object} 200 - Success response
 */

export async function GET(req: NextRequest) {
    const session = await getSessionUser();

    if (!session || !session.user_id) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const { searchParams } = new URL(req.url);
    const agreementId = searchParams.get("agreement_id");

    if (!agreementId) {
        return NextResponse.json(
            { message: "agreement_id is required" },
            { status: 400 }
        );
    }

    try {
        const reasons: string[] = [];

        /* -------------------------------------------------
           1. LEASE AGREEMENT VALIDATION
        ------------------------------------------------- */
        const [[lease]]: any = await db.query(
            `
            SELECT la.agreement_id, la.status, t.user_id AS tenant_user_id
            FROM LeaseAgreement la
            JOIN Tenant t ON la.tenant_id = t.tenant_id
            WHERE la.agreement_id = ?
            LIMIT 1
            `,
            [agreementId]
        );

        if (!lease) {
            return NextResponse.json(
                {
                    allowed: false,
                    reasons: ["Lease agreement not found"],
                },
                { status: 200 }
            );
        }

        if (lease.tenant_user_id !== session.user_id) {
            return NextResponse.json(
                { error: "Unauthorized - not your lease." },
                { status: 403 }
            );
        }

        if (["draft", "cancelled"].includes(lease.status)) {
            return NextResponse.json(
                {
                    allowed: false,
                    reasons: ["Lease agreement is not active"],
                },
                { status: 200 }
            );
        }

        /* -------------------------------------------------
           2. SIGNATURE CHECK
           - ONLY if LeaseSignature records exist
           - Tenant signature alone unlocks portal
        ------------------------------------------------- */
        const [signatures]: any = await db.query(
            `
            SELECT role, status
            FROM LeaseSignature
            WHERE agreement_id = ?
            `,
            [agreementId]
        );

        if (signatures && signatures.length > 0) {
            const tenantSigned = signatures.some(
                (s: any) => s.role === "tenant" && s.status === "signed"
            );

            if (!tenantSigned) {
                reasons.push(
                    "You must sign the lease agreement to access the portal"
                );
            }
        }

        /* -------------------------------------------------
           3. SETUP REQUIREMENTS
        ------------------------------------------------- */
        const [[requirements]]: any = await db.query(
            `
            SELECT
           *
            FROM LeaseSetupRequirements
            WHERE agreement_id = ?
            LIMIT 1
            `,
            [agreementId]
        );

        /* -------------------------------------------------
           4. SECURITY DEPOSIT CHECK
        ------------------------------------------------- */
        if (requirements?.security_deposit) {
            const [[deposit]]: any = await db.query(
                `
                SELECT status
                FROM SecurityDeposit
                WHERE lease_id = ?
                LIMIT 1
                `,
                [agreementId]
            );

            if (!deposit || deposit.status !== "paid") {
                reasons.push("Security deposit has not been fully paid");
            }
        }

        /* -------------------------------------------------
           5. ADVANCE PAYMENT CHECK
        ------------------------------------------------- */
        if (requirements?.advance_payment) {
            const [[advance]]: any = await db.query(
                `
                SELECT status
                FROM AdvancePayment
                WHERE lease_id = ?
                LIMIT 1
                `,
                [agreementId]
            );

            if (!advance || !["paid", "applied"].includes(advance.status)) {
                reasons.push("Advance payment has not been completed");
            }
        }

        /* -------------------------------------------------
           FINAL DECISION
        ------------------------------------------------- */
        return NextResponse.json(
            {
                allowed: reasons.length === 0,
                reasons,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("PORTAL ACCESS CHECK ERROR:", error);
        return NextResponse.json(
            {
                allowed: false,
                reasons: ["Unable to verify portal access at this time"],
            },
            { status: 500 }
        );
    }
}
