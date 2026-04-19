import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import { sendInviteTenantEmail } from "@/lib/email/sendInviteTenantEmail";
import { sendUserNotification } from "@/lib/notifications/sendUserNotification";

function generateShortCode(length: number = 4): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const unitId = searchParams.get("unitId");

        if (!unitId) {
            return NextResponse.json(
                { error: "Unit ID is required." },
                { status: 400 }
            );
        }

        const [invites]: any = await db.query(
            `SELECT id, code, email, status, expiresAt, start_date, end_date, createdAt 
             FROM InviteCode 
             WHERE unitId = ? AND expiresAt > NOW() AND status = 'PENDING'
             ORDER BY createdAt DESC 
             LIMIT 1`,
            [unitId]
        );

        if (invites.length === 0) {
            return NextResponse.json({ exists: false });
        }

        const invite = invites[0];
        const expiresAt = new Date(invite.expiresAt);
        const now = new Date();
        const timeLeft = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

        return NextResponse.json({
            exists: true,
            invite: {
                id: invite.id,
                code: invite.code,
                email: invite.email,
                status: invite.status,
                expiresAt: invite.expiresAt,
                startDate: invite.start_date,
                endDate: invite.end_date,
                createdAt: invite.createdAt,
                timeLeft: timeLeft > 0 ? timeLeft : 0,
            },
        });
    } catch (error) {
        console.error("Error fetching invite:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const {
            email,
            unitId,
            propertyName: incomingName,
            unitName,
            startDate,
            endDate,
            datesDeferred = false,
        } = await req.json();

        if (!email || !unitId || !unitName) {
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        if (!datesDeferred) {
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

        const conn = await db.getConnection();
        await conn.beginTransaction();

        try {
            const [existingInvites]: any = await conn.query(
                `SELECT id, code, expiresAt FROM InviteCode 
                 WHERE unitId = ? AND expiresAt > NOW() AND status = 'PENDING'
                 ORDER BY createdAt DESC LIMIT 1`,
                [unitId]
            );

            if (existingInvites.length > 0) {
                const existing = existingInvites[0];
                const expiresAt = new Date(existing.expiresAt);
                const now = new Date();
                const timeLeft = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

                await conn.rollback();
                return NextResponse.json({
                    success: true,
                    existing: true,
                    code: existing.code,
                    expiresAt: existing.expiresAt,
                    timeLeft: timeLeft > 0 ? timeLeft : 0,
                    message: "Existing invite code found.",
                });
            }

            const [unitRows]: any = await conn.query(
                `
                SELECT property_id, status
                FROM Unit
                WHERE unit_id = ?
                FOR UPDATE
                `,
                [unitId]
            );

            if (!unitRows.length) {
                await conn.rollback();
                return NextResponse.json(
                    { error: "Unit not found." },
                    { status: 404 }
                );
            }

            const { property_id: propertyId, status: unitStatus } = unitRows[0];

            if (unitStatus !== "unoccupied") {
                await conn.rollback();
                return NextResponse.json(
                    {
                        error: `Unit is not available (current status: ${unitStatus}).`,
                    },
                    { status: 409 }
                );
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

            await conn.query(
                `
                INSERT INTO InviteCode (
                    code,
                    email,
                    unitId,
                    propertyId,
                    start_date,
                    end_date,
                    status,
                    expiresAt
                )
                VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)
                `,
                [
                    inviteCode,
                    email,
                    unitId,
                    propertyId,
                    datesDeferred ? null : startDate,
                    datesDeferred ? null : endDate,
                    expiresAt,
                ]
            );

            let propertyName = incomingName;

            if (!propertyName) {
                const [propRows]: any = await conn.query(
                    `SELECT property_name FROM Property WHERE property_id = ?`,
                    [propertyId]
                );

                if (!propRows.length) {
                    await conn.rollback();
                    return NextResponse.json(
                        { error: "Property not found." },
                        { status: 404 }
                    );
                }

                propertyName = propRows[0].property_name;
            }

            await conn.query(
                `UPDATE Unit SET status = 'reserved' WHERE unit_id = ?`,
                [unitId]
            );

            await conn.commit();

            await sendInviteTenantEmail({
                email,
                propertyName,
                unitName,
                inviteCode,
                datesDeferred,
            });

            const emailHash = crypto
                .createHash("sha256")
                .update(email.toLowerCase())
                .digest("hex");

            const [existingUser]: any = await conn.query(
                `SELECT user_id FROM User WHERE emailHashed = ? LIMIT 1`,
                [emailHash]
            );

            if (existingUser.length > 0) {
                const notificationBody = datesDeferred
                    ? `You've been invited to ${propertyName} - Unit ${unitName}. Accept to get started!`
                    : `You've been invited to ${propertyName} - Unit ${unitName}. Lease period: ${startDate} to ${endDate}`;

                sendUserNotification({
                    userId: existingUser[0].user_id,
                    title: "New Tenant Invitation",
                    body: notificationBody,
                    url: "/tenant/viewInvites",
                }).catch((err) => console.error("Push notification failed:", err));
            }

            return NextResponse.json({
                success: true,
                code: inviteCode,
                expiresAt: expiresAt.toISOString(),
                timeLeft: 600,
                propertyName,
                datesDeferred,
                message: "Invite sent and unit reserved.",
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
