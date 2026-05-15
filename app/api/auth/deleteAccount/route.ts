import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

export async function DELETE(req: NextRequest) {
    const conn = await db.getConnection();

    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { user_id } = body;

        if (!user_id) {
            return NextResponse.json(
                { error: "Missing user_id" },
                { status: 400 }
            );
        }

        if (session.user_id !== user_id) {
            return NextResponse.json(
                { error: "Session mismatch. Cannot delete another user's account." },
                { status: 403 }
            );
        }

        await conn.beginTransaction();

        await conn.query(
            `UPDATE User SET status = 'deactivated', updatedAt = NOW() WHERE user_id = ?`,
            [user_id]
        );

        await conn.commit();

        const response = NextResponse.json(
            { message: "Your account has been deactivated." },
            { status: 200 }
        );

        response.cookies.set("token", "", {
            httpOnly: true,
            path: "/",
            maxAge: 0,
            sameSite: "strict",
        });

        return response;
    } catch (error) {
        await conn.rollback();
        console.error("❌ Error deactivating account:", error);
        return NextResponse.json(
            { error: "Failed to deactivate account." },
            { status: 500 }
        );
    } finally {
        conn.release();
    }
}
