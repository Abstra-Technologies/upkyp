import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import crypto from "crypto";

/* =====================================================
   HELPERS
===================================================== */

function getClientIp(req: NextRequest): string | null {
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) return forwardedFor.split(",")[0].trim();

    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp;

    return null;
}

function hashIp(ip: string) {
    return crypto.createHash("sha256").update(ip).digest("hex");
}

async function verifyToken(token: string) {
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch {
        return null;
    }
}

function safeRedirect(target: string, req: NextRequest) {
    if (req.nextUrl.pathname === target) {
        return NextResponse.next();
    }
    return NextResponse.redirect(new URL(target, req.url));
}

/* =====================================================
   CONSTANTS
===================================================== */

const SYSTEM_ADMIN_ROLES = ["super-admin", "superadmin", "co-admin"];

// Auth pages to hide when logged in (both old /pages/ and new app structure)
const AUTH_PAGES = [
    "/auth/login",
    "/auth/register",
    "/auth/selectRole",
    "/pages/auth/login",
    "/pages/auth/register",
    "/pages/auth/selectRole",
];

const ADMIN_LOGIN_PAGES = [
    "/admin_login",
    "/pages/admin_login",
];

// Public pages that should be accessible even when logged in
const PUBLIC_PAGES = [
    "/",
    "/find-rent",
    "/public",
    "/api",
    "/_next",
];

const VERIFY_PAGE = "/auth/verify-email";

const permissionMapping: Record<string, string> = {
    "/system_admin/co_admin": "manage_users",
    "/system_admin/propertyManagement": "approve_properties",
    "/system_admin/announcement": "manage_announcements",
    "/system_admin/bug_report": "view_reports",
    "/system_admin/activityLog": "view_log",
    "/system_admin/beta_programs": "beta",
};

/* =====================================================
   PROXY
===================================================== */

export async function proxy(req: NextRequest) {
    const { pathname, search } = req.nextUrl;

    const isPricingPage = pathname.startsWith("/public/pricing");

// 👇 ONLY pricing should NOT be skipped
    const isPublicPage = PUBLIC_PAGES.some(
        (page) => pathname === page || pathname.startsWith(page + "/")
    );

// ✅ HANDLE PRICING FIRST (before public skip)
    if (isPricingPage) {
        const userToken = req.cookies.get("token")?.value;

        if (userToken) {
            const decodedUser: any = await verifyToken(userToken);

            if (decodedUser) {
                const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");

                // 👉 if callback exists → go there
                if (callbackUrl) {
                    return safeRedirect(callbackUrl, req);
                }

                // 👉 fallback redirect
                if (decodedUser.userType === "landlord") {
                    return safeRedirect("/landlord/dashboard", req);
                }

                if (decodedUser.userType === "tenant") {
                    return safeRedirect("/tenant/feeds", req);
                }
            }
        }

        // not logged in → allow access
        return NextResponse.next();
    }

    if (isPublicPage) {
        return NextResponse.next();
    }

    if (pathname === VERIFY_PAGE || pathname === "/pages/auth/verify-email") {
        return NextResponse.next();
    }

    const userToken = req.cookies.get("token")?.value;
    const adminToken = req.cookies.get("admin_token")?.value;

    const isAuthPage = AUTH_PAGES.some(
        (page) => pathname === page || pathname.startsWith(`${page}/`)
    );

    const isAdminLoginPage = ADMIN_LOGIN_PAGES.includes(pathname);

    /* -----------------------------------------------
       ALLOW WEBHOOKS
    ------------------------------------------------ */
    if (pathname.startsWith("/api/webhook")) {
        return NextResponse.next();
    }

    /* =====================================================
       HIDE AUTH PAGES IF LOGGED IN
    ===================================================== */

    if (userToken && isAuthPage) {
        const decodedUser: any = await verifyToken(userToken);

        if (decodedUser) {
            if (decodedUser.userType === "landlord") {
                return safeRedirect("/landlord/dashboard", req);
            }

            if (decodedUser.userType === "tenant") {
                return safeRedirect("/tenant/feeds", req);
            }
        }
    }

    if (adminToken && isAdminLoginPage) {
        const decodedAdmin: any = await verifyToken(adminToken);

        if (decodedAdmin && SYSTEM_ADMIN_ROLES.includes(decodedAdmin.role)) {
            return safeRedirect("/system_admin/dashboard", req);
        }
    }

    /* =====================================================
       ADMIN FLOW (Protected)
    ===================================================== */

    if (pathname.startsWith("/system_admin")) {
        if (!adminToken) {
            const adminLogin = new URL("/admin_login", req.url);
            adminLogin.searchParams.set("callbackUrl", pathname + search);
            return NextResponse.redirect(adminLogin);
        }

        const decodedAdmin: any = await verifyToken(adminToken);

        if (!decodedAdmin) {
            const res = NextResponse.redirect(
                new URL("/admin_login", req.url)
            );
            res.cookies.delete("admin_token");
            return res;
        }

        const { role, permissions = [], ip_hash, status } = decodedAdmin;

        const validStatuses = ["active", "pending", "unverified"];
        if (status && !validStatuses.includes(status)) {
            return safeRedirect("/error/accountSuspended", req);
        }

        if (!SYSTEM_ADMIN_ROLES.includes(role)) {
            return safeRedirect("/error/accessDenied", req);
        }

        const clientIp = getClientIp(req);

        if (!clientIp || !ip_hash || hashIp(clientIp) !== ip_hash) {
            const res = NextResponse.redirect(
                new URL("/admin_login?reason=ip_changed", req.url)
            );
            res.cookies.delete("admin_token");
            return res;
        }

        const matchedEntry = Object.entries(permissionMapping).find(
            ([route]) => pathname === route || pathname.startsWith(`${route}/`)
        );

        if (matchedEntry) {
            const [, requiredPermission] = matchedEntry;
            if (!permissions.includes(requiredPermission)) {
                return safeRedirect("/error/accessDenied", req);
            }
        }

        return NextResponse.next();
    }

    /* =====================================================
       USER FLOW (Protected Pages Only)
    ===================================================== */

    if (
        pathname.startsWith("/tenant") ||
        pathname.startsWith("/landlord") ||
        pathname.startsWith("/commons") ||
        pathname.startsWith("/pages/tenant") ||
        pathname.startsWith("/pages/landlord") ||
        pathname.startsWith("/pages/commons")
    ) {
        if (!userToken) {
            const loginUrl = new URL("/auth/login", req.url);
            loginUrl.searchParams.set("callbackUrl", pathname + search);
            return NextResponse.redirect(loginUrl);
        }

        const decodedUser: any = await verifyToken(userToken);

        if (!decodedUser) {
            const res = NextResponse.redirect(
                new URL("/auth/login", req.url)
            );
            res.cookies.delete("token");
            return res;
        }

        const { userType, emailVerified, status } = decodedUser;

        if (status && status !== "active") {
            return safeRedirect("/error/accountSuspended", req);
        }

        if (emailVerified === false && pathname !== VERIFY_PAGE) {
            return safeRedirect(VERIFY_PAGE, req);
        }

        if ((pathname.startsWith("/tenant") || pathname.startsWith("/pages/tenant")) && userType !== "tenant") {
            return safeRedirect("/error/accessDenied", req);
        }

        if ((pathname.startsWith("/landlord") || pathname.startsWith("/pages/landlord")) && userType !== "landlord") {
            return safeRedirect("/error/accessDenied", req);
        }
    }

    return NextResponse.next();
}

/* =====================================================
   MATCHER
===================================================== */

export const config = {
    matcher: [
        "/",
        "/auth/:path*",
        "/admin_login",
        "/tenant/:path*",
        "/landlord/:path*",
        "/commons/:path*",
        "/system_admin/:path*",
        "/find-rent/:path*",
        "/public/:path*",
        "/pages/auth/:path*",
        "/pages/admin_login",
        "/pages/tenant/:path*",
        "/pages/landlord/:path*",
        "/pages/commons/:path*",
        "/api/webhook/:path*",
    ],
};