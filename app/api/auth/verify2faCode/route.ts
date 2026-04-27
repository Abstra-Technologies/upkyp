import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { SignJWT } from "jose";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { user_id, otp } = body;

        if (!user_id || !otp) {
            return new Response(
                JSON.stringify({ error: "User ID and OTP are required" }),
                { status: 400 }
            );
        }

        const [tokens]: any[] = await db.query(
            "SELECT * FROM UserToken WHERE user_id = ? AND token_type = '2fa' AND token = ? AND expires_at > NOW()",
            [user_id, otp]
        );

        if (tokens.length === 0) {
            return new Response(JSON.stringify({ error: "Invalid or expired OTP" }), {
                status: 401,
            });
        }

        const [users]: any[] = await db.query(
            "SELECT user_id, userType FROM User WHERE user_id = ?",
            [user_id]
        );

        if (users.length === 0) {
            return new Response(JSON.stringify({ error: "User not found" }), {
                status: 404,
            });
        }

        const user = users[0];

        await db.query(
            "DELETE FROM UserToken WHERE user_id = ? AND token_type = '2fa'",
            [user_id]
        );

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const token = await new SignJWT({ user_id, userType: user.userType })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuer(process.env.NEXT_PUBLIC_BASE_URL || "https://upkyp.com")
            .setAudience(process.env.NEXT_PUBLIC_BASE_URL || "https://upkyp.com")
            .setExpirationTime("2h")
            .setSubject(user_id)
            .setIssuedAt()
            .sign(secret);

        const cookie = `token=${token}; HttpOnly; Path=/; Secure; SameSite=Lax`;

        return new Response(
            JSON.stringify({
                message: "Login successful",
                token,
                user: {
                    user_id,
                    userType: user.userType,
                },
            }),
            {
                status: 200,
                headers: {
                    "Set-Cookie": cookie,
                    "Content-Type": "application/json",
                },
            }
        );
    } catch (error) {
        console.error("OTP Verification Error:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
        });
    }
}
