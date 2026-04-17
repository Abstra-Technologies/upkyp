import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import { sendInviteTenantEmail } from "@/lib/email/sendInviteTenantEmail";
import { sendUserNotification } from "@/lib/notifications/sendUserNotification";

//  api to send ivbite current occupied tenant.

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

        /* ===============================
           Basic validation
        =============================== */
        if (!email || !unitId || !unitName) {
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        /* ===============================
           Conditional date validation
        =============================== */
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

        const inviteCode = crypto.randomBytes(8).toString("hex");

        const conn = await db.getConnection();
        await conn.beginTransaction();

        try {
            /* ===============================
               Lock unit row & validate status
            =============================== */
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

            /* ===============================
               Insert invite record
            =============================== */
            await conn.query(
                `
                INSERT INTO InviteCode (
                    code,
                    email,
                    unitId,
                    start_date,
                    end_date,
                    status,
                    expiresAt
                )
                VALUES (?, ?, ?, ?, ?, 'PENDING', DATE_ADD(NOW(), INTERVAL 7 DAY))
                `,
                [
                    inviteCode,
                    email,
                    unitId,
                    datesDeferred ? null : startDate,
                    datesDeferred ? null : endDate,
                ]
            );

            /* ===============================
               Resolve property name
            =============================== */
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

            /* ===============================
               Reserve unit
            =============================== */
            await conn.query(
                `UPDATE Unit SET status = 'reserved' WHERE unit_id = ?`,
                [unitId]
            );

            await conn.commit();

            /* ===============================
                Send email (Resend)
            =============================== */
            await sendInviteTenantEmail({
                email,
                propertyName,
                unitName,
                inviteCode,
                datesDeferred,
            });

            /* ===============================
                Send push notification to existing user
            =============================== */
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
