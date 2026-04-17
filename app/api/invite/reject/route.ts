import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendUserNotification } from "@/lib/notifications/sendUserNotification";

export async function POST(req: NextRequest) {
    const conn = await db.getConnection();

    try {
        const { inviteCode } = await req.json();

        if (!inviteCode) {
            return NextResponse.json(
                { error: "Missing invite code." },
                { status: 400 }
            );
        }

        await conn.beginTransaction();

        /* ===============================
           1️⃣ Validate invite (LOCK)
        =============================== */
        const [inviteRows]: any = await conn.query(
            `
            SELECT code, unitId, status
            FROM InviteCode
            WHERE code = ?
            FOR UPDATE
            `,
            [inviteCode]
        );

        const invite = inviteRows[0];

        if (!invite) {
            await conn.rollback();
            return NextResponse.json(
                { error: "Invite not found." },
                { status: 404 }
            );
        }

        if (invite.status !== "PENDING") {
            await conn.rollback();
            return NextResponse.json(
                { error: "Invite already processed." },
                { status: 409 }
            );
        }

        /* ===============================
           2️⃣ Reject invite
        =============================== */
        await conn.query(
            `
            UPDATE InviteCode
            SET status = 'REJECTED'
            WHERE code = ?
            `,
            [inviteCode]
        );

        /* ===============================
           3️⃣ Release unit
        =============================== */
        await conn.query(
            `
            UPDATE Unit
            SET status = 'unoccupied',
                updated_at = CURRENT_TIMESTAMP
            WHERE unit_id = ?
            `,
            [invite.unitId]
        );

        /* ===============================
           4️⃣ Notify landlord (REUSABLE)
        =============================== */
        const [landlordRows]: any = await conn.query(
            `
            SELECT l.user_id,
                   p.property_name,
                   u.unit_name,
                   p.property_id,
                   u.unit_id
            FROM Unit u
            JOIN Property p ON u.property_id = p.property_id
            JOIN Landlord l ON p.landlord_id = l.landlord_id
            WHERE u.unit_id = ?
            `,
            [invite.unitId]
        );

        if (landlordRows.length > 0) {
            const landlord = landlordRows[0];

            await sendUserNotification({
                userId: landlord.user_id,
                title: `Invitation Declined – ${landlord.property_name} / ${landlord.unit_name}`,
                body: "The tenant declined the invitation. The unit is now available.",
                url: `/landlord/property-listing/view-unit/${landlord.property_id}/unit-details/${landlord.unit_id}`,
                conn,
            });
        }

        await conn.commit();

        return NextResponse.json({
            success: true,
            message: "Invitation declined. Unit is now available.",
        });
    } catch (error) {
        console.error("Reject invite error:", error);
        await conn.rollback();
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    } finally {
        conn.release();
    }
}
