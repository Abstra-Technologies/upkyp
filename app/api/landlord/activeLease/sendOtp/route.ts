import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import moment from "moment-timezone";
import { sendLeaseOtpEmail } from "@/lib/email/sendLeaseOtpEmail";

/**
 * POST /api/landlord/activeLease/sendOtp
 */
export async function POST(req: NextRequest) {
    try {
        const { agreement_id, role, email } = await req.json();

        if (!agreement_id || !role || !email) {
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        if (!["landlord", "tenant"].includes(role)) {
            return NextResponse.json(
                { error: "Invalid role." },
                { status: 400 }
            );
        }

        /* --------------------------------------------------
         * 1️⃣ Resolve user timezone (plain email)
         * -------------------------------------------------- */
        const [userRows]: any = await db.query(
            `
            SELECT timezone
            FROM User
            WHERE email = ?
            LIMIT 1
            `,
            [email]
        );

        const timezone = userRows?.[0]?.timezone || "Asia/Manila";

        /* --------------------------------------------------
         * 2️⃣ Generate OTP
         * -------------------------------------------------- */
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiryUTC = moment.utc().add(10, "minutes").toDate();
        const expiryLocal = moment(expiryUTC)
            .tz(timezone)
            .format("MMMM D, YYYY h:mm A");

        /* --------------------------------------------------
         * 3️⃣ UPSERT LeaseSignature (REQUESTING PARTY)
         * -------------------------------------------------- */
        const [existingSig]: any = await db.query(
            `
            SELECT id
            FROM LeaseSignature
            WHERE agreement_id = ? AND role = ?
            LIMIT 1
            `,
            [agreement_id, role]
        );

        if (existingSig.length > 0) {
            // UPDATE ONLY
            await db.query(
                `
                UPDATE LeaseSignature
                SET
                    email = ?,
                    otp_code = ?,
                    otp_sent_at = UTC_TIMESTAMP(),
                    otp_expires_at = ?,
                    status = 'pending'
                WHERE agreement_id = ? AND role = ?
                `,
                [email, otp, expiryUTC, agreement_id, role]
            );
        } else {
            // INSERT ONLY IF NOT EXISTS
            await db.query(
                `
                INSERT INTO LeaseSignature (
                    agreement_id,
                    email,
                    role,
                    otp_code,
                    otp_sent_at,
                    otp_expires_at,
                    status
                )
                VALUES (?, ?, ?, ?, UTC_TIMESTAMP(), ?, 'pending')
                `,
                [agreement_id, email, role, otp, expiryUTC]
            );
        }

        /* --------------------------------------------------
         * 4️⃣ Fetch lease context (SCHEMA-CORRECT)
         * -------------------------------------------------- */
        const [leaseRows]: any = await db.query(
            `
            SELECT
                la.agreement_id,

                p.property_name,
                u.unit_name,

                ul.firstName AS landlord_first,
                ul.lastName  AS landlord_last,
                ul.email     AS landlord_email,

                ut.firstName AS tenant_first,
                ut.lastName  AS tenant_last,
                ut.email     AS tenant_email

            FROM LeaseAgreement la
            JOIN Unit u ON la.unit_id = u.unit_id
            JOIN Property p ON u.property_id = p.property_id
            JOIN Landlord l ON p.landlord_id = l.landlord_id
            JOIN User ul ON l.user_id = ul.user_id
            JOIN Tenant t ON la.tenant_id = t.tenant_id
            JOIN User ut ON t.user_id = ut.user_id

            WHERE la.agreement_id = ?
            LIMIT 1
            `,
            [agreement_id]
        );

        if (!leaseRows.length) {
            return NextResponse.json(
                { error: "Lease context not found." },
                { status: 404 }
            );
        }

        const lease = leaseRows[0];

        const landlordName = `${lease.landlord_first} ${lease.landlord_last}`;
        const tenantName = `${lease.tenant_first} ${lease.tenant_last}`;

        /* --------------------------------------------------
         * 5️⃣ Ensure TENANT signature exists (if landlord action)
         * -------------------------------------------------- */
        if (role === "landlord" && lease.tenant_email) {
            const [tenantSig]: any = await db.query(
                `
                SELECT id
                FROM LeaseSignature
                WHERE agreement_id = ? AND role = 'tenant'
                LIMIT 1
                `,
                [agreement_id]
            );

            if (tenantSig.length > 0) {
                await db.query(
                    `
                    UPDATE LeaseSignature
                    SET
                        email = ?,
                        status = 'pending',
                        otp_code = NULL,
                        otp_sent_at = NULL,
                        otp_expires_at = NULL
                    WHERE agreement_id = ? AND role = 'tenant'
                    `,
                    [lease.tenant_email, agreement_id]
                );
            } else {
                await db.query(
                    `
                    INSERT INTO LeaseSignature (agreement_id, email, role, status)
                    VALUES (?, ?, 'tenant', 'pending')
                    `,
                    [agreement_id, lease.tenant_email]
                );
            }
        }

        /* --------------------------------------------------
         * 6️⃣ Send OTP Email (RESEND + REACT TEMPLATE)
         * -------------------------------------------------- */
        await sendLeaseOtpEmail({
            email,
            otp,
            expiryLocal,
            timezone,
            propertyName: lease.property_name,
            unitName: lease.unit_name,
            landlordName,
            tenantName,
        });

        return NextResponse.json({
            success: true,
            message: `OTP sent successfully to ${email}.`,
            expiry_local: expiryLocal,
            timezone,
        });
    } catch (error: any) {
        console.error("❌ sendOtp error:", error);
        return NextResponse.json(
            { error: "Failed to send OTP." },
            { status: 500 }
        );
    }
}
