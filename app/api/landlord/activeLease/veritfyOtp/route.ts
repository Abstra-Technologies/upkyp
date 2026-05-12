import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const { agreement_id, role, otp_code} = await req.json();
        console.log('agreement_id', agreement_id);
        console.log('role', role);
        console.log('otp', otp_code);

        if (!agreement_id || !role || !otp_code) {
            return NextResponse.json(
                { error: "Missing required fields (agreement_id, role, otp)." },
                { status: 400 }
            );
        }

        const [records]: any = await db.query(
            `
        SELECT *
        FROM LeaseSignature
        WHERE agreement_id = ? AND role = ?
        ORDER BY id DESC
        LIMIT 1
      `,
            [agreement_id, role]
        );

        if (!records || records.length === 0) {
            return NextResponse.json({ error: "No OTP record found." }, { status: 404 });
        }

        const record = records[0];
        const now = new Date();
        const expiry = new Date(record.otp_expires_at);

        // 🔹 Expiration check
        if (now > expiry) {
            return NextResponse.json({ error: "OTP has expired." }, { status: 400 });
        }

        // 🔹 OTP match check
        if (record.otp_code !== otp_code) {
            return NextResponse.json({ error: "Invalid OTP code." }, { status: 400 });
        }

        // 🔹 Update record as signed
        const verifiedIp = req.headers.get("x-forwarded-for") || req.ip || "unknown";
        const userAgent = req.headers.get("user-agent") || "unknown";

        await db.query(
            `
        UPDATE LeaseSignature
        SET 
            status = 'signed',
            signed_at = NOW(),
            verified_ip = ?,
            verified_user_agent = ?
        WHERE agreement_id = ? AND role = ?
      `,
            [verifiedIp, userAgent, agreement_id, role]
        );

        await db.query(`
      UPDATE LeaseAgreement la
      SET la.status = (
          SELECT 
            CASE 
              WHEN 
                (SELECT COUNT(*) FROM LeaseSignature WHERE agreement_id = la.agreement_id AND status = 'signed') = 2
              THEN 'active'
              ELSE la.status
            END
      )
      WHERE la.agreement_id = ?
    `, [agreement_id]);

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
