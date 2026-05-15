import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

/**
 * ✅ POST /api/tenant/activeRent/leaseAgreement/verifyOtp
 * Body: { agreement_id: string, role: "tenant", otp_code: string }
 */
export async function POST(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        const session = await getSessionUser();

        if (!session || !session.user_id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { agreement_id, role, otp_code } = await req.json();

        if (!agreement_id || !role || !otp_code) {
            return NextResponse.json(
                { error: "Missing required fields (agreement_id, role, otp_code)." },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        const [leaseCheck]: any = await connection.query(
            `
            SELECT la.tenant_id, t.user_id AS tenant_user_id
            FROM LeaseAgreement la
            JOIN Tenant t ON la.tenant_id = t.tenant_id
            WHERE la.agreement_id = ?
            LIMIT 1
            `,
            [agreement_id]
        );

        if (!leaseCheck.length || leaseCheck[0].tenant_user_id !== session.user_id) {
            await connection.rollback();
            return NextResponse.json(
                { error: "Unauthorized - not your lease." },
                { status: 403 }
            );
        }

        const [records]: any = await connection.query(
            `
            SELECT id, otp_code, otp_expires_at, status
            FROM LeaseSignature
            WHERE agreement_id = ? AND role = ?
            ORDER BY id DESC
            LIMIT 1;
            `,
            [agreement_id, role]
        );

        if (!records || records.length === 0) {
            await connection.rollback();
            return NextResponse.json({ error: "No OTP record found." }, { status: 404 });
        }

        const record = records[0];
        const now = new Date();
        const expiry = new Date(record.otp_expires_at);

        if (now > expiry) {
            await connection.rollback();
            return NextResponse.json({ error: "OTP has expired." }, { status: 400 });
        }

        if (record.otp_code !== otp_code) {
            await connection.rollback();
            return NextResponse.json({ error: "Invalid OTP code." }, { status: 400 });
        }

        if (record.status === "signed") {
            await connection.rollback();
            return NextResponse.json({
                success: true,
                message: `${role} has already signed this lease.`,
            });
        }

        const verifiedIp = req.headers.get("x-forwarded-for") || "unknown";
        const userAgent = req.headers.get("user-agent") || "unknown";

        await connection.query(
            `
            UPDATE LeaseSignature
            SET 
                status = 'signed',
                signed_at = NOW(),
                verified_ip = ?,
                verified_user_agent = ?
            WHERE agreement_id = ? AND role = ?;
            `,
            [verifiedIp, userAgent, agreement_id, role]
        );

        await connection.query(
            `
            UPDATE LeaseAgreement la
            SET 
                la.status = (
                    SELECT 
                        CASE 
                            WHEN (
                                SELECT COUNT(*) 
                                FROM LeaseSignature 
                                WHERE agreement_id = la.agreement_id AND status = 'signed'
                            ) = 2
                            THEN 'active'
                            ELSE la.status
                        END
                ),
                la.updated_at = la.updated_at
            WHERE la.agreement_id = ?;
            `,
            [agreement_id]
        );

        await connection.commit();

        return NextResponse.json({
            success: true,
            message: `OTP verified successfully. ${role} signature recorded.`,
        });
    } catch (err: any) {
        await connection.rollback();
        console.error("❌ verifyOtp error:", err);
        return NextResponse.json(
            { error: "Failed to verify OTP. " + (err.message || "") },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
