import { NextRequest, NextResponse } from "next/server";
import { parse } from "cookie";
import { jwtVerify } from "jose";

export async function verifyAdmin(request: NextRequest) {
    try {
        const cookieHeader = request.headers.get("cookie");
        const cookies = cookieHeader ? parse(cookieHeader) : null;


        // should be the same as the set token name.
        if (!cookies?.admin_token) {
            return { error: "Unauthorized", status: 401 };
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET!);

        const { payload } = await jwtVerify(cookies.admin_token, secretKey, {
            issuer: process.env.NEXT_PUBLIC_BASE_URL || "https://upkyp.com",
            audience: process.env.NEXT_PUBLIC_BASE_URL || "https://upkyp.com",
        });

        if (!payload.admin_id) {
            return { error: "Invalid token", status: 401 };
        }

        return {
            admin_id: payload.admin_id as string,
            role: payload.role as string,
        };
    } catch (error) {
        return { error: "Invalid or expired token", status: 401 };
    }
}
