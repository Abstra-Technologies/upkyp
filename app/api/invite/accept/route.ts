import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateLeaseId } from "@/utils/id_generator";
import { sendUserNotification } from "@/lib/notifications/sendUserNotification";
import { getSessionUser } from "@/lib/auth/auth";
import { revalidateTag } from "next/cache";

//  TENANT: invitation accept. process with lease draft.

export async function POST(req: Request) {
    const session = await getSessionUser();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conn = await db.getConnection();

    let leaseId: string;

    try {
        const { inviteCode } = await req.json();

        if (!inviteCode) {
            return NextResponse.json(
                { error: "Missing invite code" },
                { status: 400 }
            );
        }

        await conn.beginTransaction();

        /* ===============================
           1️⃣ Validate invite
        =============================== */
        const [inviteRows]: any = await conn.query(
            `SELECT * FROM InviteCode WHERE code = ? AND status = 'PENDING'`,
            [inviteCode]
        );

        const invite = inviteRows[0];
        if (!invite) {
            await conn.rollback();
            return NextResponse.json(
                { error: "Invite not found or already used." },
                { status: 404 }
            );
        }

        if (new Date(invite.expiresAt) < new Date()) {
            await conn.rollback();
            return NextResponse.json(
                { error: "Invite has expired." },
                { status: 410 }
            );
        }

        /* ===============================
           2️⃣ Get tenant
        =============================== */
        const [tenantRows]: any = await conn.query(
            `SELECT tenant_id FROM Tenant WHERE user_id = ?`,
            [session.user_id]
        );

        const tenant = tenantRows[0];
        if (!tenant) {
            await conn.rollback();
            return NextResponse.json(
                { error: "Tenant account not found." },
                { status: 404 }
            );
        }

        /* ===============================
           3️⃣ Find or create LeaseAgreement
           First check if a draft lease was created at invite time
        =============================== */
        const [existingLeases]: any = await conn.query(
            `SELECT agreement_id, rent_amount FROM LeaseAgreement WHERE unit_id = ? AND status = 'draft' LIMIT 1`,
            [invite.unitId]
        );

        if (existingLeases.length > 0) {
            leaseId = existingLeases[0].agreement_id;
            const draftRent = existingLeases[0].rent_amount;

            await conn.query(
                `UPDATE LeaseAgreement SET tenant_id = ?, status = 'active', updated_at = NOW() WHERE agreement_id = ?`,
                [tenant.tenant_id, leaseId]
            );

            if (draftRent && parseFloat(draftRent) > 0) {
                const [unitRows]: any = await conn.query(
                    `SELECT rent_amount FROM Unit WHERE unit_id = ?`,
                    [invite.unitId]
                );
                if (unitRows.length > 0 && parseFloat(unitRows[0].rent_amount) !== parseFloat(draftRent)) {
                    await conn.query(
                        `UPDATE Unit SET rent_amount = ? WHERE unit_id = ?`,
                        [draftRent, invite.unitId]
                    );
                }
            }
        } else {
            while (true) {
                leaseId = generateLeaseId();

                try {
                    await conn.query(
                        `
                        INSERT INTO LeaseAgreement (
                            agreement_id,
                            tenant_id,
                            unit_id,
                            start_date,
                            end_date,
                            status,
                            created_at
                        )
                        VALUES (?, ?, ?, ?, ?, 'draft', NOW())
                        `,
                        [
                            leaseId,
                            tenant.tenant_id,
                            invite.unitId,
                            invite.start_date ?? null,
                            invite.end_date ?? null,
                        ]
                    );

                    break;
                } catch (err: any) {
                    if (err.code === "ER_DUP_ENTRY") {
                        continue;
                    }
                    throw err;
                }
            }
        }

/* ===============================
            4️⃣ Mark invite as USED
         =============================== */
        await conn.query(
            `UPDATE InviteCode SET status = 'USED' WHERE code = ?`,
            [inviteCode]
        );

        /* ===============================
            4b️⃣ Get property_id for cache purging
         =============================== */
        const [unitRows]: any = await conn.query(
            `SELECT property_id FROM Unit WHERE unit_id = ?`,
            [invite.unitId]
        );
        const property_id = unitRows[0]?.property_id;

        /* ===============================
            5️⃣ Mark unit as OCCUPIED
         =============================== */
        await conn.query(
            `
            UPDATE Unit
            SET status = 'occupied',
                updated_at = CURRENT_TIMESTAMP
            WHERE unit_id = ?
            `,
            [invite.unitId]
        );

        /* ===============================
           6️⃣ Notify landlord (REUSABLE)
        =============================== */
        const [landlordRows]: any = await conn.query(
            `
            SELECT l.user_id,
                   p.property_name,
                   u.unit_name,
                   u.unit_id,
                   p.property_id
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
                title: `Tenant Accepted – ${landlord.property_name} / ${landlord.unit_name}`,
                body: "A tenant has accepted the invite. Lease is now in draft status.",
                url: `/landlord/property-listing/view-unit/${landlord.property_id}/unit-details/${landlord.unit_id}`,
                conn,
            });
        }

        await conn.commit();

        if (property_id) {
            revalidateTag(`units-${property_id}`);
            revalidateTag("units-all");
        }

        return NextResponse.json({
            success: true,
            message: "Invite accepted. Lease created in draft state.",
            lease_id: leaseId,
        });
    } catch (error) {
        console.error("Invite accept error:", error);
        await conn.rollback();
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    } finally {
        conn.release();
    }
}
