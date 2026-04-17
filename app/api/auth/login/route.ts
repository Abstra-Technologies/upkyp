import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import crypto from "crypto";
import {
    createSecureToken,
    createSession,
    getClientIp,
    invalidateAllUserSessions,
} from "@/lib/auth/auth";

/* =====================================================
   CONSTANTS
===================================================== */
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY!;
const IS_PROD = process.env.NODE_ENV === "production";

const DEFAULT_JWT_EXPIRY = 3600 * 2;      // 2 hours
const REMEMBER_JWT_EXPIRY = 3600 * 24 * 7; // 7 days

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60; // 15 minutes

/* =====================================================
   RATE LIMITING - Login Attempts
===================================================== */
async function checkLoginAttempts(ip: string, email: string): Promise<{
    allowed: boolean;
    remainingAttempts: number;
    lockoutUntil: number | null;
}> {
    const key = `login:${ip}:${email}`;
    
    try {
        const [attempts]: any = await db.query(
            `SELECT attempts, last_attempt_at, locked_until 
             FROM LoginAttempts 
             WHERE ip_address = ? AND email_hash = ? AND locked_until > NOW()
             LIMIT 1`,
            [ip, crypto.createHash("sha256").update(email.toLowerCase()).digest("hex")]
        );

        if (attempts.length > 0 && attempts[0].locked_until) {
            const lockoutUntil = new Date(attempts[0].locked_until).getTime();
            return {
                allowed: false,
                remainingAttempts: 0,
                lockoutUntil,
            };
        }

        const [remaining]: any = await db.query(
            `SELECT attempts FROM LoginAttempts 
             WHERE ip_address = ? AND email_hash = ? 
             AND last_attempt_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
             LIMIT 1`,
            [ip, crypto.createHash("sha256").update(email.toLowerCase()).digest("hex")]
        );

        const attemptsCount = remaining.length > 0 ? remaining[0].attempts : 0;
        return {
            allowed: attemptsCount < MAX_LOGIN_ATTEMPTS,
            remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - attemptsCount),
            lockoutUntil: null,
        };
    } catch (err) {
        console.error("[AUTH] Rate limit check error:", err);
        return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS, lockoutUntil: null };
    }
}

async function recordFailedAttempt(ip: string, email: string): Promise<void> {
    const emailHash = crypto.createHash("sha256").update(email.toLowerCase()).digest("hex");
    
    try {
        await db.execute(
            `INSERT INTO LoginAttempts (ip_address, email_hash, attempts, last_attempt_at, locked_until)
             VALUES (?, ?, 1, NOW(), DATE_ADD(NOW(), INTERVAL ${LOCKOUT_DURATION} SECOND))
             ON DUPLICATE KEY UPDATE
                attempts = attempts + 1,
                last_attempt_at = NOW(),
                locked_until = CASE 
                    WHEN attempts + 1 >= ${MAX_LOGIN_ATTEMPTS} 
                    THEN DATE_ADD(NOW(), INTERVAL ${LOCKOUT_DURATION} SECOND)
                    ELSE locked_until
                END`,
            [ip, emailHash]
        );
    } catch (err) {
        console.error("[AUTH] Record failed attempt error:", err);
    }
}

async function clearLoginAttempts(ip: string, email: string): Promise<void> {
    const emailHash = crypto.createHash("sha256").update(email.toLowerCase()).digest("hex");
    
    try {
        await db.execute(
            `DELETE FROM LoginAttempts WHERE ip_address = ? AND email_hash = ?`,
            [ip, emailHash]
        );
    } catch (err) {
        console.error("[AUTH] Clear login attempts error:", err);
    }
}

/* =====================================================
   SECURITY HEADERS
===================================================== */
function getSecurityHeaders(): Record<string, string> {
    return {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        ...(IS_PROD && {
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        }),
    };
}

/* =====================================================
   VALIDATE REDIRECT URL
===================================================== */
function validateCallbackUrl(callbackUrl: string | null): string | null {
    if (!callbackUrl) return null;
    if (typeof callbackUrl !== "string") return null;
    if (!callbackUrl.startsWith("/")) return null;
    if (callbackUrl.includes("..")) return null;
    if (callbackUrl.includes("\n")) return null;
    return callbackUrl;
}

const USER_TYPE_ROUTES: Record<string, string> = {
    tenant: "/tenant/feeds",
    landlord: "/landlord/dashboard",
};

function getRedirectUrl(userType: string, callbackUrl?: string | null): string {
    const safeCallback = validateCallbackUrl(callbackUrl ?? null);
    if (safeCallback) return safeCallback;
    return USER_TYPE_ROUTES[userType] || "/";
}

/* =====================================================
   LOGIN API
===================================================== */
export async function POST(req: NextRequest) {
    const securityHeaders = getSecurityHeaders();
    let response: NextResponse;

    try {
        /* ================= PARSE REQUEST ================= */
        let body: {
            email?: string;
            password?: string;
            captchaToken?: string;
            rememberMe?: boolean;
            callbackUrl?: string;
        };

        try {
            body = await req.json();
        } catch {
            return new NextResponse(JSON.stringify({ error: "Invalid request body" }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...securityHeaders },
            });
        }

        const { email, password, captchaToken, rememberMe, callbackUrl } = body;

        /* ================= VALIDATION ================= */
        if (!email || !password || !captchaToken) {
            return new NextResponse(
                JSON.stringify({ error: "Email, password, and captcha are required" }),
                { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
            );
        }

        if (typeof email !== "string" || !email.includes("@")) {
            return new NextResponse(
                JSON.stringify({ error: "Invalid email format" }),
                { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
            );
        }

        /* ================= RATE LIMITING ================= */
        const clientIp = await getClientIp();
        const rateCheck = await checkLoginAttempts(clientIp, email);

        if (!rateCheck.allowed) {
            const lockoutSeconds = Math.ceil((rateCheck.lockoutUntil! - Date.now()) / 1000);
            return new NextResponse(
                JSON.stringify({
                    error: "Too many login attempts. Please try again later.",
                    retryAfter: lockoutSeconds,
                }),
                { status: 429, headers: { "Content-Type": "application/json", ...securityHeaders } }
            );
        }

        /* ================= CAPTCHA VERIFY ================= */
        const captchaRes = await fetch(
            "https://www.google.com/recaptcha/api/siteverify",
            {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    secret: RECAPTCHA_SECRET,
                    response: captchaToken,
                    remoteip: clientIp,
                }),
            }
        );

        const captchaData = await captchaRes.json();

        if (!captchaData.success && captchaData.score < 0.5) {
            return new NextResponse(
                JSON.stringify({ error: "CAPTCHA verification failed. Please try again." }),
                { status: 403, headers: { "Content-Type": "application/json", ...securityHeaders } }
            );
        }

        /* ================= USER LOOKUP ================= */
        const emailHash = crypto
            .createHash("sha256")
            .update(email.trim().toLowerCase())
            .digest("hex");

        const [users]: any[] = await db.query(
            `SELECT user_id, email, emailHashed, password, userType, status, 
                    emailVerified, google_id, is_2fa_enabled, companyName, 
                    firstName, lastName
             FROM User WHERE emailHashed = ? LIMIT 1`,
            [emailHash]
        );

        if (!users.length) {
            await recordFailedAttempt(clientIp, email);
            return new NextResponse(
                JSON.stringify({ error: "Invalid credentials" }),
                { status: 401, headers: { "Content-Type": "application/json", ...securityHeaders } }
            );
        }

        const user = users[0];

        /* ================= GOOGLE ACCOUNT CHECK ================= */
        if (user.google_id) {
            return new NextResponse(
                JSON.stringify({ error: "Please login using Google Sign-In" }),
                { status: 403, headers: { "Content-Type": "application/json", ...securityHeaders } }
            );
        }

        /* ================= ACCOUNT STATUS CHECK ================= */
        if (user.status === "suspended") {
            return new NextResponse(
                JSON.stringify({ error: "Your account is suspended. Contact support." }),
                { status: 403, headers: { "Content-Type": "application/json", ...securityHeaders } }
            );
        }

        if (user.status === "deactivated" || user.status === "archived") {
            return new NextResponse(
                JSON.stringify({ error: "Your account has been deactivated. Contact support." }),
                { status: 403, headers: { "Content-Type": "application/json", ...securityHeaders } }
            );
        }

        /* ================= PASSWORD VERIFICATION ================= */
        let isMatch = false;
        try {
            isMatch = await bcrypt.compare(password, user.password);
        } catch (bcryptErr) {
            console.error("[AUTH] Bcrypt error:", bcryptErr);
        }

        if (!isMatch) {
            await recordFailedAttempt(clientIp, email);
            return new NextResponse(
                JSON.stringify({ error: "Invalid credentials" }),
                { status: 401, headers: { "Content-Type": "application/json", ...securityHeaders } }
            );
        }

        /* ================= CLEAR FAILED ATTEMPTS ================= */
        await clearLoginAttempts(clientIp, email);

        /* ================= EMAIL VERIFICATION CHECK ================= */
        if (!user.emailVerified) {
            const { token, jti } = await createSecureToken({
                user_id: user.user_id,
                userType: user.userType,
                emailVerified: false,
                status: user.status,
            }, DEFAULT_JWT_EXPIRY);

            await createSession(user.user_id, jti, DEFAULT_JWT_EXPIRY);

            const redirectUrl = user.userType === "tenant"
                ? "/auth/verify-email"
                : "/landlord/dashboard";

            response = NextResponse.redirect(new URL(redirectUrl, req.url), { status: 303 });
            response.cookies.set("token", token, {
                httpOnly: true,
                secure: IS_PROD,
                sameSite: "strict",
                maxAge: DEFAULT_JWT_EXPIRY,
                path: "/",
            });

            Object.entries(securityHeaders).forEach(([key, value]) => {
                response.headers.set(key, value);
            });

            return response;
        }

        /* ================= GET DISPLAY NAME ================= */
        let displayName: string = email;
        try {
            if (user.companyName) {
                const decrypted = decryptData(JSON.parse(user.companyName), process.env.ENCRYPTION_SECRET!);
                if (decrypted) displayName = String(decrypted);
            } else if (user.firstName && user.lastName) {
                const first = decryptData(JSON.parse(user.firstName), process.env.ENCRYPTION_SECRET!) ?? "";
                const last = decryptData(JSON.parse(user.lastName), process.env.ENCRYPTION_SECRET!) ?? "";
                const name = `${first} ${last}`.trim();
                if (name) displayName = name;
            }
        } catch {
            displayName = email;
        }

        /* ================= 2FA CHECK ================= */
        if (user.is_2fa_enabled) {
            const otp = Math.floor(100000 + Math.random() * 900000);

            await db.execute(
                `INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at)
                 VALUES (?, '2fa', ?, NOW(), DATE_ADD(NOW(), INTERVAL 10 MINUTE))
                 ON DUPLICATE KEY UPDATE
                    token = VALUES(token),
                    created_at = NOW(),
                    expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)`,
                [user.user_id, otp]
            );

            response = NextResponse.redirect(
                new URL(`/auth/verify-2fa?user_id=${user.user_id}`, req.url),
                { status: 303 }
            );

            Object.entries(securityHeaders).forEach(([key, value]) => {
                response.headers.set(key, value);
            });

            return response;
        }

        /* ================= TOKEN GENERATION ================= */
        const expiry = rememberMe ? REMEMBER_JWT_EXPIRY : DEFAULT_JWT_EXPIRY;
        const { token, jti } = await createSecureToken({
            user_id: user.user_id,
            userType: user.userType,
            emailVerified: !!user.emailVerified,
            status: user.status,
            displayName,
        }, expiry);

        /* ================= CREATE SESSION ================= */
        await createSession(user.user_id, jti, expiry);

        /* ================= LOGIN LOGGING ================= */
        db.query(
            `INSERT INTO ActivityLog (user_id, action, ip_address, user_agent, timestamp) 
             VALUES (?, 'User logged in', ?, ?, NOW())`,
            [user.user_id, clientIp, req.headers.get("user-agent") ?? "unknown"]
        ).catch(() => {});

        db.query(
            `UPDATE User SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
            [user.user_id]
        ).catch(() => {});

        /* ================= REDIRECT ================= */
        const finalRedirect = getRedirectUrl(user.userType, callbackUrl);

        response = NextResponse.redirect(new URL(finalRedirect, req.url), { status: 303 });

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: IS_PROD,
            sameSite: "strict",
            maxAge: expiry,
            path: "/",
        });

        Object.entries(securityHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
        });

        return response;

    } catch (error) {
        console.error("[AUTH] Login error:", error);

        response = new NextResponse(
            JSON.stringify({ error: "Internal server error. Please try again." }),
            { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
        );

        return response;
    }
}
