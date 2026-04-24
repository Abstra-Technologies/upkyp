import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendPasswordResetOtpEmail } from "@/lib/email/sendPasswordResetOtpEmail";
import { safeDecrypt } from "@/utils/decrypt/safeDecrypt";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { email } = body;

    if (!email) {
        return NextResponse.json(
            { message: "Email is required." },
            { status: 400 }
        );
    }

    try {
        const emailHash = crypto
            .createHash("sha256")
            .update(email.toLowerCase())
            .digest("hex");

        const [users]: any[] = await db.query(
            "SELECT user_id, email, google_id, timezone, firstName FROM User WHERE emailHashed = ?",
            [emailHash]
        );

        if (!users || users.length === 0) {
            return NextResponse.json(
                { message: "User not found." },
                { status: 404 }
            );
        }

        const user = users[0];

        if (user.google_id) {
            return NextResponse.json(
                {
                    error:
                        "Your account is linked with Google. Please log in using your Google Account.",
                },
                { status: 403 }
            );
        }

        const otp = crypto.randomInt(100000, 999999).toString();

        // 🔹 Store OTP in UTC
        await db.query(
            `
            INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at)
            VALUES (?, 'password_reset', ?, UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 MINUTE))
            ON DUPLICATE KEY UPDATE
                token = VALUES(token),
                created_at = UTC_TIMESTAMP(),
                expires_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 MINUTE)
            `,
            [user.user_id, otp]
        );

        // 🔹 Convert expiry to user's timezone
        const [expiryRows] = await db.query<any[]>(
            `
            SELECT CONVERT_TZ(
                DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 MINUTE),
                '+00:00',
                ?
            ) AS local_expiry
            `,
            [user.timezone || "UTC"]
        );

        const localExpiry = expiryRows[0]?.local_expiry;
        const expiresAtStr = localExpiry instanceof Date
            ? localExpiry.toLocaleString()
            : String(localExpiry ?? "5 minutes");

        const decryptedFirstName = safeDecrypt(user.firstName);

        // ✉️ SEND VIA RESEND
        await sendPasswordResetOtpEmail({
            email,
            firstName: decryptedFirstName || "there",
            otp,
            expiresAt: expiresAtStr,
            timezone: user.timezone || "UTC",
        });

        return NextResponse.json(
            {
                message: "OTP sent to your email.",
                expiresAt: expiresAtStr,
                timezone: user.timezone || "UTC",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("❌ Forgot password error:", error);
        return NextResponse.json(
            { message: "An error occurred. Please try again later." },
            { status: 500 }
        );
    }
}
