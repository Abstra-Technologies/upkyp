import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import {
    createSecureToken,
    createSession,
    getClientIp,
} from "@/lib/auth/auth";

const IS_PROD = process.env.NODE_ENV === "production";
const DEFAULT_JWT_EXPIRY = 3600 * 2; // 2 hours

function getSecurityHeaders(): Record<string, string> {
    return {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        ...(IS_PROD && {
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        }),
    };
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    let callbackUrl = "";

    try {
        if (state) {
            const parsedState = JSON.parse(decodeURIComponent(state));
            const stateCallbackUrl = parsedState?.callbackUrl || "";
            if (stateCallbackUrl) {
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
                const isValid = stateCallbackUrl.startsWith(baseUrl + "/tenant/") ||
                    stateCallbackUrl.startsWith(baseUrl + "/landlord/") ||
                    stateCallbackUrl.startsWith(baseUrl + "/auth/");
                if (isValid) {
                    callbackUrl = stateCallbackUrl;
                }
            }
        }
    } catch {
        callbackUrl = "";
    }

    if (!code) {
        const redirectUrl = callbackUrl
            ? `${process.env.NEXT_PUBLIC_BASE_URL}/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}&error=Authorization+code+required`
            : `${process.env.NEXT_PUBLIC_BASE_URL}/auth/login?error=Authorization+code+required`;
        return NextResponse.redirect(redirectUrl);
    }

    let response: NextResponse;

    try {
        const {
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET,
            REDIRECT_URI_SIGNIN,
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
            `SELECT user_id, email, userType, is_2fa_enabled, google_id, status, emailVerified
             FROM User WHERE emailHashed = ?`,
            [emailHash]
        );

        if (rows.length === 0 || !rows[0].google_id) {
            return redirectToLogin(
                "No account found with Google. Please sign up with Google first, or use email/password to login."
            );
        }

        const dbUser = rows[0];

        /* =====================================================
           VALIDATE USER TYPE
         ===================================================== */
        const validUserTypes = ["tenant", "landlord"];
        if (!dbUser.userType || !validUserTypes.includes(dbUser.userType)) {
            return redirectToLogin("Invalid user type. Contact support.");
        }

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
           EMAIL VERIFICATION CHECK
        ===================================================== */
        if (!dbUser.emailVerified) {
            const { token, jti } = await createSecureToken({
                user_id: dbUser.user_id,
                userType: dbUser.userType,
                emailVerified: false,
                status: dbUser.status,
            }, DEFAULT_JWT_EXPIRY);

            await createSession(dbUser.user_id, jti, DEFAULT_JWT_EXPIRY);

            let redirectUrl: string;
            if (dbUser.userType === "tenant") {
                redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/tenant/feeds`;
            } else if (dbUser.userType === "landlord") {
                redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/landlord/dashboard`;
            } else {
                return redirectToLogin("Invalid user type. Contact support.");
            }

            response = NextResponse.redirect(redirectUrl);
            response.cookies.set("token", token, {
                path: "/",
                httpOnly: true,
                secure: IS_PROD,
                sameSite: "lax",
                maxAge: DEFAULT_JWT_EXPIRY,
            });

            Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
                response.headers.set(key, value);
            });

            return response;
        }

        /* =====================================================
           2FA HANDLING
        ===================================================== */
        if (dbUser.is_2fa_enabled) {
            const otp = Math.floor(100000 + Math.random() * 900000);

            await db.execute(
                `INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at)
                 VALUES (?, '2fa', ?, NOW(), DATE_ADD(NOW(), INTERVAL 10 MINUTE))
                 ON DUPLICATE KEY UPDATE
                                      token = VALUES(token),
                                      created_at = NOW(),
                                      expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)`,
                [dbUser.user_id, otp]
            );

            await sendOtpEmail(dbUser.email, otp);

            response = NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-2fa?user_id=${dbUser.user_id}`
            );

            response.cookies.set("pending_2fa", "true", {
                path: "/",
                httpOnly: true,
                secure: IS_PROD,
                sameSite: "strict",
                maxAge: 600,
            });

            Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
                response.headers.set(key, value);
            });

            return response;
        }

        /* =====================================================
                    UPDATE LAST LOGIN TIMESTAMP
                ===================================================== */
        const clientIp = await getClientIp();
        await db.execute(
            `UPDATE User SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
            [dbUser.user_id]
        );

        /* =====================================================
            LOGIN LOGGING
        ===================================================== */
        await db.query(
            `INSERT INTO ActivityLog (user_id, action, ip_address, user_agent, timestamp)
             VALUES (?, 'User logged in via Google', ?, ?, NOW())`,
            [dbUser.user_id, clientIp, req.headers.get("user-agent") ?? "unknown"]
        );

        /* =====================================================
           GENERATE SECURE TOKEN
        ===================================================== */
        const { token, jti } = await createSecureToken({
            user_id: dbUser.user_id,
            userType: dbUser.userType,
            emailVerified: true,
            status: dbUser.status,
        }, DEFAULT_JWT_EXPIRY);

        await createSession(dbUser.user_id, jti, DEFAULT_JWT_EXPIRY);

        /* =====================================================
                    REDIRECT
                ===================================================== */
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
        let finalRedirectUrl = callbackUrl;

        console.log("[GoogleCallback] dbUser:", dbUser.userType, "callbackUrl:", callbackUrl, "state:", state);

        if (!finalRedirectUrl || !callbackUrl) {
            if (dbUser.userType === "tenant") {
                finalRedirectUrl = `${baseUrl}/tenant/feeds`;
            } else if (dbUser.userType === "landlord") {
                finalRedirectUrl = `${baseUrl}/landlord/dashboard`;
            } else {
                return redirectToLogin("Invalid user type. Contact support.");
            }
        } else {
            const isValidCallback = callbackUrl.startsWith(baseUrl + "/tenant/") ||
                callbackUrl.startsWith(baseUrl + "/landlord/") ||
                callbackUrl.startsWith(baseUrl + "/auth/");
            if (!isValidCallback) {
                finalRedirectUrl = dbUser.userType === "tenant"
                    ? `${baseUrl}/tenant/feeds`
                    : `${baseUrl}/landlord/dashboard`;
            }
        }

        response = NextResponse.redirect(finalRedirectUrl);
        response.cookies.set("token", token, {
            path: "/",
            httpOnly: true,
            secure: IS_PROD,
            sameSite: "strict",
            maxAge: DEFAULT_JWT_EXPIRY,
        });

        Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
            response.headers.set(key, value);
        });

        return response;

    } catch (error: any) {
        console.error("[Google OAuth] Error:", error.response?.data || error.message);
        return redirectToLogin("Failed to authenticate with Google. Please try again.");
    }
}

/* =====================================================
   SEND OTP EMAIL
===================================================== */
async function sendOtpEmail(email: string, otp: number) {
    try {
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
    } catch (err) {
        console.error("[OTP Email] Failed to send:", err);
    }
}
