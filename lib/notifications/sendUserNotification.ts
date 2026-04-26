import webpush from "web-push";
import { db } from "@/lib/db";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
    "mailto:support@upkyp.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

type SendUserNotificationParams = {
    userId: string;
    title: string;
    body: string;
    url?: string;
    conn?: any;
};

export async function sendUserNotification({
                                               userId,
                                               title,
                                               body,
                                               url,
                                               conn,
                                           }: SendUserNotificationParams) {
    const dbConn = conn ?? (await db.getConnection());
    const shouldRelease = !conn;

    try {
        /* ===============================
           1️⃣ Store DB notification
        =============================== */
        await dbConn.query(
            `
            INSERT INTO Notification (user_id, title, body, url, is_read, created_at)
            VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
            `,
            [userId, title, body, url ?? null]
        );

        /* ===============================
           2️⃣ Fetch push subscriptions
        =============================== */
        const [subs]: any = await dbConn.query(
            `
            SELECT endpoint, p256dh, auth
            FROM user_push_subscriptions
            WHERE user_id = ?
            `,
            [userId]
        );

        /* ===============================
           3️⃣ Send web push
        =============================== */
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
                    JSON.stringify({
                        title,
                        body,
                        url,
                    })
                );
            } catch (err: any) {
                // Clean up dead subscriptions
                if (err.statusCode === 404 || err.statusCode === 410) {
                    await dbConn.query(
                        `DELETE FROM user_push_subscriptions WHERE endpoint = ?`,
                        [sub.endpoint]
                    );
                }
            }
        }
    } finally {
        if (shouldRelease) {
            dbConn.release();
        }
    }
}
