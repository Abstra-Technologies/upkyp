import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * ✅ POST /api/tenant/activeLease/verifyOtp
 * Body: { agreement_id: string, role: "tenant", otp_code: string }
 */
export async function POST(req: NextRequest) {
    try {
        const { agreement_id, role, otp_code } = await req.json();

        // 🔹 Validate required fields
        if (!agreement_id || !role || !otp_code) {
            return NextResponse.json(
                { error: "Missing required fields (agreement_id, role, otp_code)." },
                { status: 400 }
            );
        }

        // 🔹 Fetch most recent OTP record for tenant
        const [records]: any = await db.query(
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
            return NextResponse.json({ error: "No OTP record found." }, { status: 404 });
        }

        const record = records[0];
        const now = new Date();
        const expiry = new Date(record.otp_expires_at);

        // 🔹 Check expiration
        if (now > expiry) {
            return NextResponse.json({ error: "OTP has expired." }, { status: 400 });
        }

        // 🔹 Check match
        if (record.otp_code !== otp_code) {
            return NextResponse.json({ error: "Invalid OTP code." }, { status: 400 });
        }

        // 🔹 If already signed
        if (record.status === "signed") {
            return NextResponse.json({
                success: true,
                message: `${role} has already signed this lease.`,
            });
        }

        // 🔹 Gather client metadata
        const verifiedIp = req.headers.get("x-forwarded-for") || req.ip || "unknown";
        const userAgent = req.headers.get("user-agent") || "unknown";

        // 🔹 Update this tenant signature
        await db.query(
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

        // 🔹 Check if both parties have signed → activate lease
        await db.query(
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
        /* 🔥 FIX: Remove la.signed_at (column does not exist)
           but DO NOT REMOVE THIS BLOCK — preserve your structure */
        la.updated_at = la.updated_at
      WHERE la.agreement_id = ?;
      `,
            [agreement_id]
        );

        return NextResponse.json({
            success: true,
            message: `OTP verified successfully. ${role} signature recorded.`,
        });
    } catch (err: any) {
        console.error("❌ verifyOtp error:", err);
        return NextResponse.json(
            { error: "Failed to verify OTP. " + (err.message || "") },
            { status: 500 }
        );
    }
}
