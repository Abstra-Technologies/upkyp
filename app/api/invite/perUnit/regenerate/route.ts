import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function generateShortCode(length: number = 4): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export async function POST(req: NextRequest) {
    try {
        const { unitId, existingInviteId } = await req.json();

        if (!unitId) {
            return NextResponse.json(
                { error: "Missing unitId." },
                { status: 400 }
            );
        }

        const conn = await db.getConnection();
        await conn.beginTransaction();

        try {
            if (existingInviteId) {
                await conn.query(
                    `DELETE FROM InviteCode WHERE id = ?`,
                    [existingInviteId]
                );
            } else {
                const [existingInvites]: any = await conn.query(
                    `SELECT id FROM InviteCode WHERE unitId = ? AND status = 'PENDING'`,
                    [String(unitId)]
                );

                if (existingInvites.length > 0) {
                    await conn.query(
                        `DELETE FROM InviteCode WHERE unitId = ? AND status = 'PENDING'`,
                        [String(unitId)]
                    );
                }
            }

            let inviteCode = generateShortCode(4);
            const [existingCode]: any = await conn.query(
                "SELECT id FROM InviteCode WHERE code = ?",
                [inviteCode]
            );

            while (existingCode.length > 0) {
                inviteCode = generateShortCode(4);
                const [checkAgain]: any = await conn.query(
                    "SELECT id FROM InviteCode WHERE code = ?",
                    [inviteCode]
                );
                if (checkAgain.length === 0) break;
            }

            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            const expiresAtStr = expiresAt.toISOString();

            const [result]: any = await conn.query(
                `INSERT INTO InviteCode (code, email, unitId, start_date, end_date, status, expiresAt)
                 VALUES (?, NULL, ?, NULL, NULL, 'PENDING', ?)`,
                [inviteCode, String(unitId), expiresAt]
            );

            const newInviteId = result.insertId;

            await conn.commit();

            return NextResponse.json({
                success: true,
                code: inviteCode,
                expiresAt: expiresAtStr,
                inviteId: newInviteId,
                timeLeft: 600,
                email: null,
                message: "New invite code generated.",
            });
        } catch (err) {
            await conn.rollback();
            console.error("DB transaction failed:", err);
            return NextResponse.json(
                { error: "Database transaction failed." },
                { status: 500 }
            );
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("Error regenerating invite code:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
