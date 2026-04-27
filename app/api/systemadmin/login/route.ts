// app/api/systemadmin/login/route.ts

import bcrypt from "bcrypt";
import { db } from "@/lib/db";
import { SignJWT } from "jose";
import nodeCrypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

/* =====================================================
   HELPERS
===================================================== */
function getClientIp(req: NextRequest): string | null {
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }

    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp;

    return null;
}

/* =====================================================
   ADMIN LOGIN
===================================================== */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { login, password } = body;

        if (!login || !password) {
            return NextResponse.json(
                { error: "Username or email and password are required." },
                { status: 400 }
            );
        }

        /* -----------------------------------------------
           FETCH ADMIN USER
        ------------------------------------------------ */
        let user: any = null;

        if (login.includes("@")) {
            const emailHash = nodeCrypto
                .createHash("sha256")
                .update(login.toLowerCase())
                .digest("hex");

            const [rows]: any = await db.query(
                `SELECT admin_id, username, password, email, role, status, permissions, profile_picture
                 FROM Admin
                 WHERE email_hash = ?`,
                [emailHash]
            );

            user = rows?.[0] || null;
        } else {
            const [rows]: any = await db.query(
                `SELECT admin_id, username, password, email, role, status, permissions, profile_picture
                 FROM Admin
                 WHERE username = ?`,
                [login]
            );

            user = rows?.[0] || null;
        }

        if (!user) {
            return NextResponse.json(
                { error: "Invalid credentials." },
                { status: 401 }
            );
        }

        if (user.status === "disabled") {
            return NextResponse.json(
                { error: "Your account has been disabled. Please contact support." },
                { status: 403 }
            );
        }

        /* -----------------------------------------------
           PASSWORD CHECK
        ------------------------------------------------ */
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json(
                { error: "Invalid credentials." },
                { status: 401 }
            );
        }

        /* -----------------------------------------------
           🔐 IP ADDRESS RESTRICTION (DB)
        ------------------------------------------------ */
        const clientIp = getClientIp(req);

        if (!clientIp) {
            return NextResponse.json(
                { error: "Unable to determine IP address." },
                { status: 400 }
            );
        }

        const [ipRows]: any = await db.query(
            "SELECT id FROM IpAddresses WHERE ip_address = ?",
            [clientIp]
        );

        if (!ipRows || ipRows.length === 0) {
            // Log blocked attempt
            try {
                await db.query(
                    "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, ?)",
                    [
                        user.admin_id,
                        `Blocked admin login from unauthorized IP: ${clientIp}`,
                        new Date().toISOString(),
                    ]
                );
            } catch (_) {}

            return NextResponse.json(
                {
                    error: "Access denied. Your IP address is not authorized.",
                    code: "IP_NOT_ALLOWED",
                },
                { status: 403 }
            );
        }

        /* -----------------------------------------------
           JWT GENERATION
        ------------------------------------------------ */
        /* -----------------------------------------------
    JWT GENERATION (WITH IP BINDING)
 ------------------------------------------------ */
        if (!process.env.JWT_SECRET) {
            console.error("[ADMIN LOGIN] JWT_SECRET is missing");
            return NextResponse.json(
                { error: "Server configuration error." },
                { status: 500 }
            );
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// 🔐 Hash IP (do NOT store raw IP in JWT)
        const ipHash = nodeCrypto
            .createHash("sha256")
            .update(clientIp)
            .digest("hex");

        const token = await new SignJWT({
            admin_id: user.admin_id,
            username: user.username,
            role: user.role,
            email: user.email,
            permissions: user.permissions
                ? user.permissions.split(",").map((p: string) => p.trim())
                : [],
            ip_hash: ipHash,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuer(process.env.NEXT_PUBLIC_BASE_URL || "https://upkyp.com")
            .setAudience(process.env.NEXT_PUBLIC_BASE_URL || "https://upkyp.com")
            .setIssuedAt()
            .setExpirationTime("2h")
            .setSubject(user.admin_id.toString())
            .sign(secret);

        /* -----------------------------------------------
           RESPONSE + COOKIE
        ------------------------------------------------ */
        const response = NextResponse.json(
            {
                message: "Login successful.",
                admin: {
                    admin_id: user.admin_id,
                    username: user.username,
                    role: user.role,
                    email: user.email,
                },
            },
            { status: 200 }
        );

        response.cookies.set("admin_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 2 * 60 * 60, // 2 hours
        });

        /* -----------------------------------------------
           ACTIVITY LOG
        ------------------------------------------------ */
        try {
            await db.query(
                "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, ?)",
                [user.admin_id, "Admin logged in", new Date().toISOString()]
            );
        } catch (_) {}

        return response;
    } catch (error) {
        console.error("[ADMIN LOGIN ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}
