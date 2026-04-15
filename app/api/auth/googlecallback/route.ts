import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import crypto from "crypto";
import { SignJWT } from "jose";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    const redirectToLogin = (message: string) => {
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_BASE_URL}/auth/login?error=${encodeURIComponent(message)}`
        );
    };

    if (!code) {
        return redirectToLogin("Authorization code is required.");
    }

    try {
        const {
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET,
            REDIRECT_URI_SIGNIN,
            JWT_SECRET,
        } = process.env;

        /* =====================================================
           EXCHANGE CODE FOR ACCESS TOKEN
        ===================================================== */
        const tokenResponse = await axios.post(
            "https://oauth2.googleapis.com/token",
            new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID!,
                client_secret: GOOGLE_CLIENT_SECRET!,
                redirect_uri: REDIRECT_URI_SIGNIN!,
                grant_type: "authorization_code",
            }).toString(),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const { access_token } = tokenResponse.data;
        if (!access_token) {
            return redirectToLogin("Failed to retrieve access token from Google.");
        }

        /* =====================================================
           GET USER INFO
        ===================================================== */
        const userInfoResponse = await axios.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            { headers: { Authorization: `Bearer ${access_token}` } }
        );

        const user = userInfoResponse.data;
        if (!user?.email || !user?.sub) {
            return redirectToLogin("Failed to retrieve user info from Google.");
        }

        const emailHash = crypto
            .createHash("sha256")
            .update(user.email.trim().toLowerCase())
            .digest("hex");

        /* =====================================================
           LOOKUP USER
        ===================================================== */
        const [rows]: any = await db.execute(
            `
            SELECT user_id, email, userType, is_2fa_enabled, google_id, status
            FROM User
            WHERE emailHashed = ?
            `,
            [emailHash]
        );

        if (rows.length === 0 || !rows[0].google_id) {
            return redirectToLogin(
                "User not registered with Google. Use email/password to login."
            );
        }

        const dbUser = rows[0];

        /* =====================================================
           ACCOUNT STATUS CHECK
        ===================================================== */
        if (dbUser.status === "deactivated") {
            return redirectToLogin("Your account is deactivated. Contact support.");
        }

        if (dbUser.status === "suspended") {
            return redirectToLogin("Your account is suspended. Contact support.");
        }

        /* =====================================================
           2FA HANDLING
        ===================================================== */
        if (dbUser.is_2fa_enabled) {
            const otp = Math.floor(100000 + Math.random() * 900000);

            await db.execute(
                `
                INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at)
                VALUES (?, '2fa', ?, NOW(), DATE_ADD(NOW(), INTERVAL 10 MINUTE))
                ON DUPLICATE KEY UPDATE
                    token = VALUES(token),
                    created_at = NOW(),
                    expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
                `,
                [dbUser.user_id, otp]
            );

            await sendOtpEmail(dbUser.email, otp);

            const pending2fa = NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-2fa?user_id=${dbUser.user_id}`
            );

            pending2fa.cookies.set("pending_2fa", "true", {
                path: "/",
                httpOnly: true,
                sameSite: "none",
            });

            return pending2fa;
        }

        /* =====================================================
           UPDATE LAST LOGIN TIMESTAMP  ✅
        ===================================================== */
        await db.execute(
            `UPDATE User SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
            [dbUser.user_id]
        );

        /* =====================================================
           GENERATE JWT
        ===================================================== */
        const secret = new TextEncoder().encode(JWT_SECRET);

        const token = await new SignJWT({
            user_id: dbUser.user_id,
            email: dbUser.email,
            userType: dbUser.userType,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("2h")
            .setSubject(dbUser.user_id.toString())
            .sign(secret);

        /* =====================================================
           REDIRECT
        ===================================================== */
        const redirectUrl =
            dbUser.userType === "tenant"
                ? `${process.env.NEXT_PUBLIC_BASE_URL}/tenant/feeds`
                : `${process.env.NEXT_PUBLIC_BASE_URL}/landlord/dashboard`;

        const response = NextResponse.redirect(redirectUrl);
        response.cookies.set("token", token, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
        });

        return response;
    } catch (error: any) {
        console.error(
            "[Google OAuth] Error:",
            error.response?.data || error.message
        );
        return redirectToLogin(
            "Failed to authenticate with Google. Please try again."
        );
    }
}

/* =====================================================
   SEND OTP EMAIL
===================================================== */
async function sendOtpEmail(email: string, otp: number) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your 2FA OTP Code",
        text: `Your OTP code is: ${otp}. It expires in 10 minutes.`,
    });
}
