import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";

export async function GET() {
    try {
        let cookieStore;
        try {
            cookieStore = await cookies();
        } catch {
            return NextResponse.json(
                { error: "Unauthenticated" },
                { status: 401 }
            );
        }

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

        const [rows]: any = await db.query(
            "SELECT admin_id, username, email, role, status FROM Admin WHERE admin_id = ?",
            [payload.admin_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { error: "Admin not found" },
                { status: 401 }
            );
        }

        return NextResponse.json({ admin: rows[0] });
    } catch (err) {
        console.error("[systemadmin/session]", err);
        return NextResponse.json(
            { error: "Invalid session" },
            { status: 401 }
        );
    }
}
