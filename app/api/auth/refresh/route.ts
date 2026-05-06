import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createSecureToken, createSession, getSessionUser } from "@/lib/auth/auth";

const DEFAULT_JWT_EXPIRY = 3600 * 2;

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json(
                { error: "No active session" },
                { status: 401 }
            );
        }

        const cookieStore = await cookies();
        const userToken = cookieStore.get("token")?.value;
        const adminToken = cookieStore.get("admin_token")?.value;

        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

        const response = NextResponse.json(
            { message: "Session refreshed successfully" },
            { status: 200 }
        );

        if (adminToken) {
            try {
                const { payload } = await jwtVerify(adminToken, secret);
                const { token, jti } = await createSecureToken(
                    {
                        user_id: payload.admin_id as string,
                        userType: "admin",
                        emailVerified: true,
                        status: "active",
                    },
                    DEFAULT_JWT_EXPIRY
                );

                await createSession(payload.admin_id as string, jti, DEFAULT_JWT_EXPIRY);

                response.cookies.set("admin_token", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "strict",
                    maxAge: DEFAULT_JWT_EXPIRY,
                    path: "/",
                });
            } catch {
                return NextResponse.json(
                    { error: "Failed to refresh admin session" },
                    { status: 401 }
                );
            }
        } else if (userToken) {
            try {
                const { payload } = await jwtVerify(userToken, secret);
                const { token, jti } = await createSecureToken(
                    {
                        user_id: payload.user_id as string,
                        userType: session.userType,
                        emailVerified: !!session.emailVerified,
                        status: "active",
                    },
                    DEFAULT_JWT_EXPIRY
                );

                await createSession(session.user_id, jti, DEFAULT_JWT_EXPIRY);

                response.cookies.set("token", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "strict",
                    maxAge: DEFAULT_JWT_EXPIRY,
                    path: "/",
                });
            } catch {
                return NextResponse.json(
                    { error: "Failed to refresh user session" },
                    { status: 401 }
                );
            }
        }

        return response;
    } catch (error) {
        console.error("[AUTH] Refresh session error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
