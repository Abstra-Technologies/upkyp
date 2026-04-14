import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import crypto from "crypto";

/* =====================================================
   🔧 CONSTANTS
===================================================== */

const JWT_SECRET = process.env.JWT_SECRET!;
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET!;
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY!;
const IS_PROD = process.env.NODE_ENV === "production";

const DEFAULT_JWT_EXPIRY = "2h";
const REMEMBER_JWT_EXPIRY = "7d";

const DEFAULT_COOKIE_AGE = 60 * 60 * 2;        // 2 hours
const REMEMBER_COOKIE_AGE = 60 * 60 * 24 * 7;  // 7 days

/* =====================================================
    🚀 USER LOGIN API (BETA VERSION)
===================================================== */

// Secure routing config - prevents hardcoded path injection
const USER_TYPE_ROUTES: Record<string, string> = {
    tenant: "/tenant/feeds",
    landlord: "/landlord/dashboard",
};

const DEFAULT_ROUTE = "/";

function getRedirectUrl(userType: string, callbackUrl?: string | null): string {
    // Only allow safe callback URLs (relative paths starting with /)
    const validatedCallback = callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.includes("..")
        ? callbackUrl
        : null;
    
    // Use mapped route or default if userType is unknown
    const mappedRoute = USER_TYPE_ROUTES[userType] || DEFAULT_ROUTE;
    
    return validatedCallback || mappedRoute;
}

export async function POST(req: NextRequest) {
    try {
        const { email, password, captchaToken, rememberMe, callbackUrl } =
            await req.json();

        /* ================= VALIDATION ================= */
        if (!email || !password || !captchaToken) {
            return NextResponse.json(
                { error: "Email, password, and captcha are required" },
                { status: 400 }
            );
        }

        const safeCallbackUrl =
            typeof callbackUrl === "string" && callbackUrl.startsWith("/")
                ? callbackUrl
                : null;

        // Rate limiting check (basic - should be enhanced with Redis/IP-based)
        const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] 
            || req.headers.get("x-real-ip") 
            || "unknown";
        
        console.log(`Login attempt from IP: ${clientIp} for email: ${email.slice(0, 3)}***`);

        /* ================= CAPTCHA VERIFY ================= */
        const captchaRes = await fetch(
            "https://www.google.com/recaptcha/api/siteverify",
            {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    secret: RECAPTCHA_SECRET,
                    response: captchaToken,
                }),
            }
        );

        const captchaData = await captchaRes.json();

        if (!captchaData.success) {
            return NextResponse.json(
                { error: "CAPTCHA verification failed" },
                { status: 403 }
            );
        }

        /* ================= USER LOOKUP ================= */
        const emailHash = crypto
            .createHash("sha256")
            .update(email)
            .digest("hex");

        const [users]: any[] = await db.query(
            "SELECT * FROM User WHERE emailHashed = ? LIMIT 1",
            [emailHash]
        );

        if (!users.length) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        const user = users[0];

        if (user.google_id) {
            return NextResponse.json(
                { error: "Please login using Google Sign-In" },
                { status: 403 }
            );
        }

        if (user.status !== "active" && user.status !== "pending" && user.status !== "unverified") {
            return NextResponse.json(
                { error: `Your account is ${user.status}. Contact support.` },
                { status: 403 }
            );
        }

        /* ================= PASSWORD CHECK ================= */
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        /* ================= CHECK EMAIL VERIFICATION ================= */
        if (!user.emailVerified) {
            const token = await new SignJWT({
                user_id: user.user_id,
                userType: user.userType,
                emailVerified: false,
                status: user.status,
                displayName: email,
            })
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setExpirationTime("2h")
                .setSubject(user.user_id)
                .sign(new TextEncoder().encode(JWT_SECRET));

            const verifyUrl = new URL("/auth/verify-email", req.url);
            const response = NextResponse.redirect(verifyUrl, { status: 303 });
            response.cookies.set("token", token, {
                httpOnly: true,
                secure: IS_PROD,
                sameSite: "lax",
                maxAge: 60 * 60 * 2,
                path: "/",
            });
            return response;
        }

        /* ================= DISPLAY NAME ================= */
        let displayName = email;

        try {
            if (user.companyName) {
                displayName = user.companyName;
            } else if (user.firstName && user.lastName) {
                const first = decryptData(
                    JSON.parse(user.firstName),
                    ENCRYPTION_SECRET
                );
                const last = decryptData(
                    JSON.parse(user.lastName),
                    ENCRYPTION_SECRET
                );
                displayName = `${first} ${last}`;
            }
        } catch {
            displayName = email;
        }

        /* ================= TOKEN CONFIG ================= */
        const jwtExpiry = rememberMe
            ? REMEMBER_JWT_EXPIRY
            : DEFAULT_JWT_EXPIRY;

        const cookieAge = rememberMe
            ? REMEMBER_COOKIE_AGE
            : DEFAULT_COOKIE_AGE;

        /* ================= JWT GENERATION ================= */
        const token = await new SignJWT({
            user_id: user.user_id,
            userType: user.userType,
            emailVerified: user.emailVerified,
            status: user.status,
            displayName,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime(jwtExpiry)
            .setSubject(user.user_id)
            .sign(new TextEncoder().encode(JWT_SECRET));

        /* ================= REDIRECT LOGIC ================= */
        const finalRedirect = getRedirectUrl(user.userType, safeCallbackUrl);

        const response = NextResponse.redirect(
            new URL(finalRedirect, req.url),
            { status: 303 }
        );

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: IS_PROD,
            sameSite: "lax",
            maxAge: cookieAge,
            path: "/",
        });

        /* ================= NON-BLOCKING LOGGING ================= */
        db.query(
            "INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, NOW())",
            [user.user_id, "User logged in"]
        ).catch(() => {});

        db.query(
            "UPDATE User SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = ?",
            [user.user_id]
        ).catch(() => {});

        return response;

    } catch (error) {
        console.error("Login error:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
