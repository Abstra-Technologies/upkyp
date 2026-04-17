import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendUserNotification } from "@/lib/notifications/sendUserNotification";

export async function POST(req: NextRequest) {
    let connection;

    try {
        const { agreement_id } = await req.json();

        if (!agreement_id) {
            return NextResponse.json(
                { message: "agreement_id is required" },
                { status: 400 }
            );
        }

        connection = await db.getConnection();

        /* ===============================
           FETCH LEASE
        ================================ */
        const [[lease]]: any = await connection.query(
            `
            SELECT
                la.agreement_id,
                la.status,
                la.end_date,
                la.unit_id,
                u.unit_name,
                p.property_name,
                t.user_id AS tenant_user_id
            FROM LeaseAgreement la
            JOIN Unit u ON la.unit_id = u.unit_id
            JOIN Property p ON u.property_id = p.property_id
            JOIN Tenant t ON la.tenant_id = t.tenant_id
            WHERE la.agreement_id = ?
            `,
            [agreement_id]
        );

        if (!lease) {
            return NextResponse.json(
                { message: "Lease not found" },
                { status: 404 }
            );
        }

        /* ===============================
           ⛔ STRICT END DATE CHECK
        ================================ */
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const leaseEnd = lease.end_date
            ? new Date(lease.end_date)
            : null;

        if (!leaseEnd || leaseEnd > today) {
            return NextResponse.json(
                { message: "Lease cannot be ended before its end date" },
                { status: 409 }
            );
        }

        if (!["active", "expired"].includes(lease.status)) {
            return NextResponse.json(
                {
                    message: `Lease cannot be completed in '${lease.status}' state`,
                },
                { status: 409 }
            );
        }

        /* ===============================
           TRANSACTION
        ================================ */
        await connection.beginTransaction();

        // 1️⃣ Mark lease as COMPLETED
        await connection.query(
            `
            UPDATE LeaseAgreement
            SET status = 'completed',
                updated_at = NOW()
            WHERE agreement_id = ?
            `,
            [agreement_id]
        );

        // 2️⃣ Release unit
        await connection.query(
            `
            UPDATE Unit
            SET status = 'unoccupied',
                updated_at = NOW()
            WHERE unit_id = ?
            `,
            [lease.unit_id]
        );

        // 3️⃣ 🔒 REVOKE eKYP ID
        await connection.query(
            `
            UPDATE LeaseEKyp
            SET status = 'revoked',
                updated_at = NOW()
            WHERE agreement_id = ?
            `,
            [agreement_id]
        );

        /* ===============================
           🔔 NOTIFICATION
        ================================ */
        const title = "📄 Lease Completed";
        const body = `Your lease for ${lease.property_name} – ${lease.unit_name} has officially ended and your tenant ID has been revoked.`;
        const redirectUrl = "/tenant/my-unit";

        await sendUserNotification({
            userId: lease.tenant_user_id,
            title,
            body,
            url: redirectUrl,
            conn: connection,
        });

        await connection.commit();

        return NextResponse.json({
            success: true,
            message: "Lease completed and eKYP revoked successfully",
        });
    } catch (error) {
        if (connection) await connection.rollback();

        console.error("END LEASE ERROR:", error);

        return NextResponse.json(
            { message: "Failed to complete lease" },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
