import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { parse } from "cookie";
import { jwtVerify } from "jose";
import { decryptData } from "@/crypto/encrypt";

export async function GET(req: NextRequest) {
    console.log("Fetching all admins except the logged-in user...");

    /* ================= AUTH ================= */
    const cookieHeader = req.headers.get("cookie");
    const cookies = cookieHeader ? parse(cookieHeader) : null;

    if (!cookies?.token) {
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
        );
    }

    const { payload } = await jwtVerify(
        cookies.token,
        new TextEncoder().encode(process.env.JWT_SECRET!)
    );

    if (!payload?.admin_id) {
        return NextResponse.json(
            { success: false, message: "Invalid token data" },
            { status: 401 }
        );
    }

    const currentAdminId = payload.admin_id;
    const encryptionKey = process.env.ENCRYPTION_SECRET!;

    try {
        /* ================= QUERY ================= */
        const [rows]: any = await db.query(
            `
            SELECT 
                admin_id,
                username,
                email,
                status,
                permissions
            FROM Admin
            WHERE admin_id != ?
            `,
            [currentAdminId]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json({ admins: [] }, { status: 200 });
        }

        /* ================= HELPERS ================= */
        const safeDecryptEmail = (value: any) => {
            if (!value) return null;
            try {
                if (typeof value === "string" && value.trim().startsWith("{")) {
                    return decryptData(JSON.parse(value), encryptionKey);
                }
                return value;
            } catch {
                return value;
            }
        };

        const parsePermissions = (value: string | null): string[] => {
            if (!value) return [];
            return value
                .split(",")
                .map((p) => p.trim())
                .filter(Boolean);
        };

        /* ================= RESPONSE ================= */
        const admins = rows.map((admin: any) => ({
            admin_id: admin.admin_id,
            username: admin.username,
            email: safeDecryptEmail(admin.email),
            status: admin.status,
            permissions: parsePermissions(admin.permissions),
        }));

        return NextResponse.json({ admins }, { status: 200 });
    } catch (error) {
        console.error("Error fetching admin users:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
