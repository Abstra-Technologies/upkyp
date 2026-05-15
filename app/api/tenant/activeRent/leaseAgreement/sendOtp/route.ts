import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import moment from "moment-timezone";
import { sendLeaseOtpEmail } from "@/lib/email/sendLeaseOtpEmail";
import { getSessionUser } from "@/lib/auth/auth";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

/**
 * ✅ POST /api/tenant/activeRent/leaseAgreement/sendOtp
 * Body:
 * {
 *   agreement_id: string,
 *   role: "tenant",
 *   email: string (encrypted)
 * }
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

        const body = await req.json();
        const { agreement_id, role, email } = body;

        if (!agreement_id || !role || !email) {
            return NextResponse.json(
                { error: "Missing agreement_id, role, or email." },
                { status: 400 }
            );
        }

        let decryptedEmail: string;
        try {
            const parsedEmail = JSON.parse(email);
            decryptedEmail = decryptData(parsedEmail, SECRET_KEY) || email;
        } catch {
            decryptedEmail = email;
        }

        if (!decryptedEmail) {
            return NextResponse.json(
                { error: "Invalid email address." },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        const [rows]: any = await connection.query(
            `
            SELECT
                la.agreement_id,
                la.tenant_id,
                p.property_name,
                u.unit_name,
                CONCAT(ut.firstName, ' ', ut.lastName) AS tenant_name,
                CONCAT(ul.firstName, ' ', ul.lastName) AS landlord_name,
                ut.user_id AS tenant_user_id
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
            await connection.rollback();
            return NextResponse.json(
                { error: "Lease not found." },
                { status: 404 }
            );
        }

        if (rows[0].tenant_user_id !== session.user_id) {
            await connection.rollback();
            return NextResponse.json(
                { error: "Unauthorized - not your lease." },
                { status: 403 }
            );
        }

        const {
            property_name,
            unit_name,
            tenant_name,
            landlord_name,
        } = rows[0];

        const [sigRows]: any = await connection.query(
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
            await connection.rollback();
            return NextResponse.json(
                { error: "No lease signature record found for tenant." },
                { status: 404 }
            );
        }

        const timezone = "Asia/Manila";
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiryUTC = moment.utc().add(10, "minutes").toDate();
        const expiryLocal = moment(expiryUTC)
            .tz(timezone)
            .format("MMMM D, YYYY h:mm A");

        const [updateResult]: any = await connection.query(
            `
            UPDATE LeaseSignature
            SET
                email = ?,
                otp_code = ?,
                otp_sent_at = UTC_TIMESTAMP(),
                otp_expires_at = ?,
                status = 'pending'
            WHERE agreement_id = ?
              AND role = 'tenant'
            `,
            [decryptedEmail, otp, expiryUTC, agreement_id]
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return NextResponse.json(
                { error: "Failed to update OTP." },
                { status: 500 }
            );
        }

        await connection.commit();

        await sendLeaseOtpEmail({
            email: decryptedEmail,
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
            message: `OTP sent to ${decryptedEmail}`,
            expiry_local: expiryLocal,
            timezone,
        });
    } catch (error: any) {
        await connection.rollback();
        console.error("❌ Tenant sendOtp error:", error);
        return NextResponse.json(
            { error: "Failed to send OTP. " + (error.message || "") },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
