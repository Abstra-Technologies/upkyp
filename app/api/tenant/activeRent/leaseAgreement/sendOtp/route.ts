import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import moment from "moment-timezone";
import { sendLeaseOtpEmail } from "@/lib/email/sendLeaseOtpEmail";

export const runtime = "nodejs";
/**
 * ✅ POST /api/tenant/activeLease/sendOtp
 * Body:
 * {
 *   agreement_id: string,
 *   role: "tenant",
 *   email: string
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { agreement_id, role, email } = body;

        /* -------------------------------------------------
           VALIDATION
        ------------------------------------------------- */
        if (!agreement_id || role !== "tenant" || !email) {
            return NextResponse.json(
                { error: "Missing agreement_id, role, or email." },
                { status: 400 }
            );
        }

        /* -------------------------------------------------
           VERIFY LEASE + FETCH CONTEXT (NO EMAIL)
        ------------------------------------------------- */
        const [rows]: any = await db.query(
            `
            SELECT
                la.agreement_id,
                p.property_name,
                u.unit_name,
                CONCAT(ut.firstName, ' ', ut.lastName) AS tenant_name,
                CONCAT(ul.firstName, ' ', ul.lastName) AS landlord_name
            FROM LeaseAgreement la
            JOIN Unit u ON la.unit_id = u.unit_id
            JOIN Property p ON u.property_id = p.property_id
            JOIN Tenant tn ON la.tenant_id = tn.tenant_id
            JOIN User ut ON tn.user_id = ut.user_id
            JOIN Landlord l ON p.landlord_id = l.landlord_id
            JOIN User ul ON l.user_id = ul.user_id
            WHERE la.agreement_id = ?
            LIMIT 1;
            `,
            [agreement_id]
        );

        if (!rows?.length) {
            return NextResponse.json(
                { error: "Lease not found." },
                { status: 404 }
            );
        }

        const {
            property_name,
            unit_name,
            tenant_name,
            landlord_name,
        } = rows[0];

        /* -------------------------------------------------
           ENSURE LEASE SIGNATURE EXISTS
        ------------------------------------------------- */
        const [sigRows]: any = await db.query(
            `
            SELECT id
            FROM LeaseSignature
            WHERE agreement_id = ?
              AND role = 'tenant'
            LIMIT 1
            `,
            [agreement_id]
        );

        if (!sigRows?.length) {
            return NextResponse.json(
                { error: "No lease signature record found for tenant." },
                { status: 404 }
            );
        }

        /* -------------------------------------------------
           TIMEZONE (DEFAULT)
        ------------------------------------------------- */
        const timezone = "Asia/Manila";

        /* -------------------------------------------------
           OTP GENERATION
        ------------------------------------------------- */
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiryUTC = moment.utc().add(10, "minutes").toDate();
        const expiryLocal = moment(expiryUTC)
            .tz(timezone)
            .format("MMMM D, YYYY h:mm A");

        const [updateResult]: any = await db.query(
            `
            UPDATE LeaseSignature
            SET
                otp_code = ?,
                otp_sent_at = UTC_TIMESTAMP(),
                otp_expires_at = ?,
                status = 'pending'
            WHERE agreement_id = ?
              AND role = 'tenant'
            `,
            [otp, expiryUTC, agreement_id]
        );

        if (updateResult.affectedRows === 0) {
            return NextResponse.json(
                { error: "Failed to update OTP." },
                { status: 500 }
            );
        }

        /* -------------------------------------------------
           SEND EMAIL (REQUEST EMAIL ONLY)
        ------------------------------------------------- */
        await sendLeaseOtpEmail({
            email, // 👈 FROM REQUEST BODY
            otp,
            expiryLocal,
            timezone,
            propertyName: property_name,
            unitName: unit_name,
            landlordName: landlord_name,
            tenantName: tenant_name,
        });

        return NextResponse.json({
            success: true,
            message: `OTP sent to ${email}`,
            expiry_local: expiryLocal,
            timezone,
        });
    } catch (error: any) {
        console.error("❌ Tenant sendOtp error:", error);
        return NextResponse.json(
            { error: "Failed to send OTP. " + (error.message || "") },
            { status: 500 }
        );
    }
}
