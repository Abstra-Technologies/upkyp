import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import webpush from "web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ✅ Set VAPID keys (use .env)
webpush.setVapidDetails(
    "mailto:support@upkyp.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export async function PUT(req: NextRequest) {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const body = await req.json();
        const { pdc_id, status } = body;

        if (!pdc_id || !status) {
            await connection.rollback();
            connection.release();
            return NextResponse.json(
                { error: "Missing required fields: pdc_id and status." },
                { status: 400 }
            );
        }

        const validStatuses = ["pending", "cleared", "bounced", "replaced"];
        if (!validStatuses.includes(status)) {
            await connection.rollback();
            connection.release();
            return NextResponse.json(
                {
                    error: `Invalid status. Allowed values: ${validStatuses.join(", ")}`,
                },
                { status: 400 }
            );
        }

        // ✅ Get PDC + related info
        const [existing]: any = await connection.query(
            `
                SELECT
                    pdc.pdc_id,
                    pdc.amount,
                    pdc.lease_id,
                    la.tenant_id,
                    un.unit_name,
                    p.property_name,
                    t.user_id
                FROM PostDatedCheck pdc
                         JOIN LeaseAgreement la ON pdc.lease_id = la.agreement_id
                         JOIN Unit un ON la.unit_id = un.unit_id
                         JOIN Property p ON un.property_id = p.property_id
                         JOIN Tenant t ON la.tenant_id = t.tenant_id
                WHERE pdc.pdc_id = ?
                LIMIT 1
            `,
            [pdc_id]
        );

        if (existing.length === 0) {
            await connection.rollback();
            connection.release();
            return NextResponse.json({ error: "PDC not found." }, { status: 404 });
        }

        const pdc = existing[0];

        // ✅ Update PDC status
        let timestampField = null;
        if (status === "cleared") timestampField = "cleared_at";
        if (status === "bounced") timestampField = "bounced_at";
        if (status === "replaced") timestampField = "replaced_at";

        let updateQuery = `
            UPDATE PostDatedCheck
            SET status = ?, updated_at = NOW()
                ${timestampField ? `, ${timestampField} = NOW()` : ""}
            WHERE pdc_id = ?
        `;
        await connection.query(updateQuery, [status, pdc_id]);

        // ✅ Prepare notification details
        if (status === "cleared") {
            const notifTitle = "Payment Received via PDC";
            const notifBody = `Your post-dated check for ₱${Number(
                pdc.amount
            ).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
            })} has been cleared for your rent at ${pdc.property_name} (${pdc.unit_name}).`;

            // Insert into Notification table
            await connection.query(
                `
        INSERT INTO Notification (user_id, title, body, url, is_read, created_at)
        VALUES (?, ?, ?, '/tenant/billing', 0, NOW())
        `,
                [pdc.user_id, notifTitle, notifBody]
            );

            // ✅ Fetch user's push subscriptions
            const [subscriptions]: any = await connection.query(
                `
        SELECT endpoint, p256dh, auth
        FROM user_push_subscriptions
        WHERE user_id = ? AND endpoint IS NOT NULL
        `,
                [pdc.user_id]
            );

            // ✅ Send web push to all active subscriptions
            for (const sub of subscriptions) {
                const pushPayload = JSON.stringify({
                    title: notifTitle,
                    body: notifBody,
                    icon: "/icons/notification-icon.png",
                    url: "/tenant/billing",
                });

                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.p256dh,
                                auth: sub.auth,
                            },
                        },
                        pushPayload
                    );
                    console.log(`🔔 Push sent to tenant user_id=${pdc.user_id}`);
                } catch (err: any) {
                    // Expired or invalid subscription cleanup
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await connection.query(
                            `DELETE FROM user_push_subscriptions WHERE endpoint = ?`,
                            [sub.endpoint]
                        );
                        console.warn(`⚠️ Removed invalid push subscription for user_id=${pdc.user_id}`);
                    } else {
                        console.error("❌ Push error:", err.message);
                    }
                }
            }
        }

        await connection.commit();
        connection.release();

        console.log(`✅ PDC ${pdc_id} status updated to "${status}".`);
        return NextResponse.json(
            {
                message: `PDC status updated to "${status}".`,
                pdc_id,
                status,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("❌ PDC Status Update Error:", error);
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error("⚠️ Rollback failed:", rollbackError);
        } finally {
            connection.release();
        }

        return NextResponse.json(
            {
                error: "Internal server error.",
                details: error.message,
            },
            { status: 500 }
        );
    }
}
