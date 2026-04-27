import { cookies, headers } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { db } from "@/lib/db";

/* ===============================
   Session User Type
================================ */
export interface SessionUser {
    user_id: string;
    tenant_id: string | null;
    landlord_id: string | null;
    userType: "tenant" | "landlord" | "admin";
    session_id: string | null;
    emailVerified: boolean | null;
}

/* ===============================
   Token Payload Type
================================ */
interface TokenPayload {
    user_id: string;
    userType: string;
    emailVerified: boolean;
    status: string;
    jti: string;
    iat: number;
    exp: number;
    iss: string;
    sub: string;
}

/* ===============================
   Get Client IP Address
================================ */
export async function getClientIp(): Promise<string> {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }
    const realIp = headersList.get("x-real-ip");
    if (realIp) {
        return realIp;
    }
    const cfConnectingIp = headersList.get("cf-connecting-ip");
    if (cfConnectingIp) {
        return cfConnectingIp;
    }
    return "unknown";
}

/* ===============================
   Get User Agent
================================ */
export async function getUserAgent(): Promise<string> {
    const headersList = await headers();
    return headersList.get("user-agent") || "unknown";
}

/* ===============================
   Validate Session Against Database
================================ */
async function validateSessionInDb(user_id: string, jti: string): Promise<boolean> {
    try {
        const [sessions]: any = await db.query(
            `SELECT session_id, is_valid, expires_at 
             FROM UserSessions 
             WHERE user_id = ? AND session_id = ? AND is_valid = 1
             AND expires_at > NOW()
             LIMIT 1`,
            [user_id, jti]
        );
        return sessions.length > 0;
    } catch (err) {
        console.error("[AUTH] Session validation error:", err);
        return false;
    }
}

/* ===============================
   Create Secure Session
================================ */
export async function createSession(
    userId: string,
    jti: string,
    expiresIn: number = 3600 * 2 // 2 hours default
): Promise<boolean> {
    try {
        const ip = await getClientIp();
        const userAgent = await getUserAgent();
        const expiresAt = new Date(Date.now() + expiresIn * 1000);

        await db.execute(
            `INSERT INTO UserSessions (user_id, session_id, ip_address, user_agent, expires_at, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE 
                is_valid = 1, 
                ip_address = VALUES(ip_address),
                user_agent = VALUES(user_agent),
                expires_at = VALUES(expires_at),
                created_at = NOW()`,
            [userId, jti, ip, userAgent, expiresAt]
        );

        // Invalidate old sessions (keep last 5)
        await db.execute(
            `DELETE FROM UserSessions 
             WHERE user_id = ? 
             AND is_valid = 1
             AND session_id NOT IN (
                 SELECT session_id FROM (
                     SELECT session_id FROM UserSessions 
                     WHERE user_id = ? AND is_valid = 1 
                     ORDER BY created_at DESC LIMIT 5
                 ) AS recent
             )`,
            [userId, userId]
        );

        return true;
    } catch (err) {
        console.error("[AUTH] Create session error:", err);
        return false;
    }
}

/* ===============================
   Invalidate Session
================================ */
export async function invalidateSession(userId: string, jti: string): Promise<boolean> {
    try {
        await db.execute(
            `UPDATE UserSessions SET is_valid = 0 WHERE user_id = ? AND session_id = ?`,
            [userId, jti]
        );
        return true;
    } catch (err) {
        console.error("[AUTH] Invalidate session error:", err);
        return false;
    }
}

/* ===============================
   Invalidate All User Sessions
================================ */
export async function invalidateAllUserSessions(userId: string): Promise<boolean> {
    try {
        await db.execute(
            `UPDATE UserSessions SET is_valid = 0 WHERE user_id = ?`,
            [userId]
        );
        return true;
    } catch (err) {
        console.error("[AUTH] Invalidate all sessions error:", err);
        return false;
    }
}

/* ===============================
   Get Authenticated Session User
================================ */
export async function getSessionUser(): Promise<SessionUser | null> {
    try {
        /* ===============================
           1. Read JWT from cookie
        ================================ */
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) return null;

        /* ===============================
           2. Verify JWT signature
        ================================ */
        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

        let payload: TokenPayload;
        try {
            const { payload: verifiedPayload } = await jwtVerify(token, secret, {
                issuer: process.env.NEXT_PUBLIC_BASE_URL || "https://upkyp.com",
                audience: process.env.NEXT_PUBLIC_BASE_URL || "https://upkyp.com",
            });
            payload = verifiedPayload as unknown as TokenPayload;
        } catch (jwtError) {
            console.error("[AUTH] JWT verification failed:", jwtError);
            return null;
        }

        const user_id = payload?.user_id;
        const jti = payload?.jti as string;

        if (!user_id || !jti) {
            return null;
        }

        /* ===============================
           3. Validate session in database
        ================================ */
        const isValidSession = await validateSessionInDb(user_id, jti);
        if (!isValidSession) {
            console.warn("[AUTH] Session not found or expired in database");
            return null;
        }

        /* ===============================
           4. Check IP binding (optional security)
        ================================ */
        const currentIp = await getClientIp();
        const [sessions]: any = await db.query(
            `SELECT ip_address FROM UserSessions WHERE user_id = ? AND session_id = ? AND is_valid = 1`,
            [user_id, jti]
        );

        if (sessions.length > 0 && sessions[0].ip_address) {
            // Uncomment to enforce IP binding (may cause issues with rotating IPs)
            // if (sessions[0].ip_address !== currentIp) {
            //     console.warn("[AUTH] IP address mismatch");
            //     return null;
            // }
        }

        /* ===============================
           5. Fetch user + role context
        ================================ */
        const [rows]: any = await db.query(
            `
            SELECT
                u.user_id,
                u.userType,
                u.emailVerified,
                t.tenant_id,
                l.landlord_id
            FROM rentalley_db.User u
            LEFT JOIN rentalley_db.Tenant t ON t.user_id = u.user_id
            LEFT JOIN rentalley_db.Landlord l ON l.user_id = u.user_id
            WHERE u.user_id = ?
            LIMIT 1
            `,
            [user_id]
        );

        const user = rows?.[0];
        if (!user) {
            return null;
        }

        /* ===============================
           6. Check user status
        ================================ */
        if (user.status === "suspended" || user.status === "deactivated" || user.status === "archived") {
            console.warn(`[AUTH] User status: ${user.status}`);
            return null;
        }

        /* ===============================
           7. Return normalized session
        ================================ */
        return {
            user_id: user.user_id,
            tenant_id: user.tenant_id ?? null,
            landlord_id: user.landlord_id ?? null,
            userType: user.userType,
            session_id: jti,
            emailVerified: !!user.emailVerified,
        };
    } catch (err) {
        console.error("[AUTH] Session error:", err);
        return null;
    }
}

/* ===============================
   Generate Secure JTI
================================ */
export function generateJti(): string {
    return crypto.randomUUID();
}

/* ===============================
   Create Signed JWT Token
================================ */
export async function createSecureToken(
    payload: {
        user_id: string;
        userType: string;
        emailVerified: boolean;
        status: string;
        displayName?: string;
    },
    expiresInSeconds: number = 3600 * 2
): Promise<{ token: string; jti: string }> {
    const jti = generateJti();
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

    const token = await new SignJWT({
        ...payload,
    })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuer(process.env.NEXT_PUBLIC_BASE_URL || "https://upkyp.com")
        .setAudience(process.env.NEXT_PUBLIC_BASE_URL || "https://upkyp.com")
        .setIssuedAt()
        .setExpirationTime(`${Math.floor(expiresInSeconds)}s`)
        .setSubject(payload.user_id)
        .setJti(jti)
        .sign(secret);

    return { token, jti };
}
