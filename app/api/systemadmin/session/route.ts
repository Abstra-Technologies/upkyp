import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import { cacheLife, cacheTag } from "next/cache";

export const dynamic = "force-dynamic";

const getCachedAdminSession = (adminId: string) => {
    "use cache";
    cacheLife("minutes");
    cacheTag(`admin-session-${adminId}`);

    const [rows]: any = db.query(
        "SELECT admin_id, username, email, role, status FROM Admin WHERE admin_id = ?",
        [adminId]
    );

    return rows?.[0] || null;
};

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Unauthenticated" },
                { status: 401 }
            );
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload }: any = await jwtVerify(token, secret);

        if (!payload.admin_id || payload.role !== "system_admin") {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const admin = await getCachedAdminSession(payload.admin_id);

        if (!admin) {
            return NextResponse.json(
                { error: "Admin not found" },
                { status: 401 }
            );
        }

        return NextResponse.json({ admin });
    } catch (err) {
        console.error("[systemadmin/session]", err);
        return NextResponse.json(
            { error: "Invalid session" },
            { status: 401 }
        );
    }
}
