import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionUser();
        if (!session || session.userType !== "tenant") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!session.tenant_id) {
            return NextResponse.json(
                { error: "Tenant profile not found" },
                { status: 400 }
            );
        }

        const body = await req.json();
        const { code } = body;

        if (!code || typeof code !== "string" || code.length !== 4) {
            return NextResponse.json(
                { error: "Invalid invite code format" },
                { status: 400 }
            );
        }

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [inviteRows]: any[] = await connection.execute(
                `
                SELECT 
                    ic.id,
                    ic.code,
                    ic.unitId,
                    ic.propertyId,
                    ic.status,
                    ic.expiresAt,
                    ic.email,
                    ic.start_date,
                    ic.end_date
                FROM InviteCode ic
                WHERE ic.code = ?
                LIMIT 1
                FOR UPDATE
                `,
                [code]
            );

            if (inviteRows.length === 0) {
                await connection.rollback();
                return NextResponse.json(
                    { error: "Invalid invite code" },
                    { status: 404 }
                );
            }

            const invite = inviteRows[0];

            if (invite.status === "USED") {
                await connection.rollback();
                return NextResponse.json(
                    { error: "This invite code has already been used" },
                    { status: 400 }
                );
            }

            if (invite.status === "EXPIRED" || invite.status === "REJECTED") {
                await connection.rollback();
                return NextResponse.json(
                    { error: "This invite is no longer valid" },
                    { status: 400 }
                );
            }

            if (new Date(invite.expiresAt) < new Date()) {
                await connection.rollback();
                return NextResponse.json(
                    { error: "This invite code has expired" },
                    { status: 400 }
                );
            }

            const [existingLease]: any[] = await connection.execute(
                `
                SELECT la.agreement_id
                FROM LeaseAgreement la
                WHERE la.tenant_id = ? 
                  AND la.unit_id = ?
                  AND la.status IN ('active', 'pending', 'sent', 'landlord_signed', 'tenant_signed', 'completed')
                LIMIT 1
                `,
                [session.tenant_id, invite.unitId]
            );

            if (existingLease.length > 0) {
                await connection.rollback();
                return NextResponse.json(
                    { error: "You are already associated with this unit" },
                    { status: 400 }
                );
            }

            await connection.execute(
                `
                UPDATE InviteCode 
                SET status = 'USED'
                WHERE id = ?
                `,
                [invite.id]
            );

            await connection.commit();

            return NextResponse.json(
                {
                    message: "Successfully joined unit",
                    unit_id: invite.unitId,
                    property_id: invite.propertyId,
                },
                { status: 200 }
            );
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("[JOIN-UNIT] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
