import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
    "mailto:support@upkyp.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

/**
 * Extend Lease Agreement
 * POST /api/landlord/lease/extend
 */
export async function POST(req: NextRequest) {
    let connection;
    try {
        const body = await req.json();
        const {
            agreement_id,
            new_end_date,
            new_rent_amount,
        } = body;

        /* ===============================
           VALIDATION
        ================================ */
        if (!agreement_id || !new_end_date) {
            return NextResponse.json(
                { message: "agreement_id and new_end_date are required" },
                { status: 400 }
            );
        }

        connection = await db.getConnection();

        /* ===============================
           FETCH LEASE + TENANT
        ================================ */
        const [[lease]]: any = await connection.query(
            `
            SELECT 
                la.agreement_id,
                la.status,
                la.unit_id,
                la.tenant_id,
                la.end_date,
                u.unit_name,
                p.property_name,
                t.user_id AS tenant_user_id
            FROM LeaseAgreement la
            JOIN Unit u ON u.unit_id = la.unit_id
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
           STATE CHECK
        ================================ */
        const ALLOWED = ["active", "expired", "completed"];
        if (!ALLOWED.includes(lease.status)) {
            return NextResponse.json(
                { message: `Lease cannot be extended in '${lease.status}' state` },
                { status: 409 }
            );
        }

        /* ===============================
           DATE CHECK
        ================================ */
        const currentEnd = lease.end_date
            ? new Date(lease.end_date)
            : null;

        const newEnd = new Date(new_end_date);

        if (currentEnd && newEnd <= currentEnd) {
            return NextResponse.json(
                { message: "New end date must be later than current end date" },
                { status: 422 }
            );
        }

        /* ===============================
           TRANSACTION
        ================================ */
        await connection.beginTransaction();

        // 1️⃣ Extend lease
        await connection.query(
            `
            UPDATE LeaseAgreement
            SET 
                end_date = ?,
                status = 'active',
                updated_at = NOW()
            WHERE agreement_id = ?
            `,
            [new_end_date, agreement_id]
        );

        // 2️⃣ Optional rent update
        if (new_rent_amount !== null && new_rent_amount !== undefined) {
            if (Number(new_rent_amount) <= 0) {
                await connection.rollback();
                return NextResponse.json(
                    { message: "Invalid rent amount" },
                    { status: 422 }
                );
            }

            await connection.query(
                `
                UPDATE Unit
                SET rent_amount = ?
                WHERE unit_id = ?
                `,
                [new_rent_amount, lease.unit_id]
            );
        }

        /* ===============================
           🔔 NOTIFICATION CONTENT
        ================================ */
        const title = "📄 Lease Extended";
        const bodyHtml = `
            Your lease for <b>${lease.property_name}</b> – <b>${lease.unit_name}</b>
            has been extended until <b>${new_end_date}</b>.
        `;
        const redirectUrl = "/tenant/leases";

        /* ===============================
           SAVE NOTIFICATION
        ================================ */
        await connection.query(
            `
            INSERT INTO Notification (user_id, title, body, url, is_read, created_at)
            VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
            `,
            [lease.tenant_user_id, title, bodyHtml, redirectUrl]
        );

        /* ===============================
           WEB PUSH
        ================================ */
        const [subs]: any = await connection.query(
            `
            SELECT endpoint, p256dh, auth
            FROM user_push_subscriptions
            WHERE user_id = ?
            `,
            [lease.tenant_user_id]
        );

        if (subs.length > 0) {
            const payload = JSON.stringify({
                title,
                body: bodyHtml.replace(/<[^>]*>/g, ""),
                url: redirectUrl,
                icon: `${process.env.NEXT_PUBLIC_BASE_URL}/icons/notification-icon.png`,
            });

            for (const sub of subs) {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.p256dh,
                                auth: sub.auth,
                            },
                        },
                        payload
                    );
                } catch (err: any) {
                    console.warn("❌ Web push failed:", err?.message || err);
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await connection.query(
                            `DELETE FROM user_push_subscriptions WHERE endpoint = ?`,
                            [sub.endpoint]
                        );
                    }
                }
            }
        }

        await connection.commit();

        return NextResponse.json({
            success: true,
            message: "Lease extended and tenant notified",
        });
    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error("EXTEND LEASE ERROR:", error);
        return NextResponse.json(
            { message: "Failed to extend lease" },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
