import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import { sendInviteTenantEmail } from "@/lib/email/sendInviteTenantEmail";

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
        const {
            unitId,
            unitName,
            email,
            inviteMethod = "email",
            startDate,
            endDate,
            datesDeferred = false,
        } = await req.json();

        if (!unitId || !unitName) {
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        if (inviteMethod === "email" && !datesDeferred) {
            if (!startDate || !endDate) {
                return NextResponse.json(
                    { error: "Start and end date are required." },
                    { status: 400 }
                );
            }

            if (new Date(startDate) >= new Date(endDate)) {
                return NextResponse.json(
                    { error: "End date must be after start date." },
                    { status: 400 }
                );
            }
        }

        let inviteCode = generateShortCode(4);
        
        const [existingCode]: any = await db.query(
            "SELECT id FROM InviteCode WHERE code = ?",
            [inviteCode]
        );
        
        while (existingCode.length > 0) {
            inviteCode = generateShortCode(4);
            const [checkAgain]: any = await db.query(
                "SELECT id FROM InviteCode WHERE code = ?",
                [inviteCode]
            );
            if (checkAgain.length === 0) break;
        }

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        const conn = await db.getConnection();
        await conn.beginTransaction();

        try {
            const [unitRows]: any = await conn.query(
                `SELECT property_id, status FROM Unit WHERE unit_id = ? FOR UPDATE`,
                [unitId]
            );

            if (!unitRows.length) {
                await conn.rollback();
                return NextResponse.json(
                    { error: "Unit not found." },
                    { status: 404 }
                );
            }

            const { property_id: propertyId } = unitRows[0];

            let propertyName = "";
            const [propRows]: any = await conn.query(
                `SELECT property_name FROM Property WHERE property_id = ?`,
                [propertyId]
            );
            if (propRows.length) {
                propertyName = propRows[0].property_name;
            }

            await conn.query(
                `INSERT INTO InviteCode (code, email, unitId, start_date, end_date, status, expiresAt)
                 VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
                [
                    inviteCode,
                    email || null,
                    String(unitId),
                    datesDeferred ? null : startDate,
                    datesDeferred ? null : endDate,
                    expiresAt,
                ]
            );

            if (inviteMethod === "email" && email) {
                await conn.query(
                    `UPDATE Unit SET status = 'reserved' WHERE unit_id = ?`,
                    [unitId]
                );

                await sendInviteTenantEmail({
                    email,
                    propertyName,
                    unitName,
                    inviteCode,
                    datesDeferred,
                });
            }

            await conn.commit();

            return NextResponse.json({
                success: true,
                code: inviteCode,
                expiresAt: expiresAt.toISOString(),
                email: email || null,
                message: inviteMethod === "email" 
                    ? "Invite sent and unit reserved." 
                    : "Invite code generated.",
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
        console.error("Error sending invite:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}