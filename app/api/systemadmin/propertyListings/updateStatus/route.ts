import { NextRequest } from "next/server";
import mysql from "mysql2/promise";
import { parse } from "cookie";
import { jwtVerify } from "jose";
import webpush from "web-push";

const NotificationTemplates = {
    VERIFIED: {
        TITLE: "Property Verified",
        BODY: (points: number) =>
            `🎉 Congratulations! Your property has been verified. You’ve earned ${points} FlexiPoints.`,
    },
    REJECTED_TWICE: {
        TITLE: (status: string) => `Property ${status}`,
        BODY: (status: string, message?: string) =>
            `Your property listing has been ${status.toLowerCase()} twice. ${
                message ? `Message: ${message}` : ""
            }`,
    },
    GENERAL: {
        TITLE: (status: string) => `Property ${status}`,
        BODY: (status: string, message?: string) =>
            `Your property listing has been ${status.toLowerCase()}. ${
                message ? `Message: ${message}` : ""
            }`,
    },
};

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
    "mailto:your-email@example.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

export async function POST(req: NextRequest) {
    let connection: mysql.Connection | null = null;

    try {
        // ------------------ AUTH ------------------
        const cookieHeader = req.headers.get("cookie") || "";
        const cookies = parse(cookieHeader);
        const token = cookies.token;

        if (!token) {
            return new Response(
                JSON.stringify({ success: false, message: "Unauthorized" }),
                { status: 401 }
            );
        }

        let decoded;
        try {
            const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
            const { payload } = await jwtVerify(token, secretKey);
            decoded = payload;
        } catch (err: any) {
            return new Response(
                JSON.stringify({ success: false, message: err.message }),
                { status: 401 }
            );
        }

        const currentadmin_id = decoded?.admin_id;
        if (!currentadmin_id) {
            return new Response(
                JSON.stringify({ success: false, message: "Invalid Token Data" }),
                { status: 401 }
            );
        }

        // ------------------ INPUT ------------------
        const { property_id, status, message } = await req.json();
        if (!property_id || !status) {
            return new Response(
                JSON.stringify({ message: "Missing required fields" }),
                { status: 400 }
            );
        }

        // ------------------ DB ------------------
        connection = await mysql.createConnection({
            host: process.env.DB_HOST!,
            user: process.env.DB_USER!,
            password: process.env.DB_PASSWORD!,
            database: process.env.DB_NAME!,
            timezone: "+08:00",
        });

        // CLEAN SQL — NO WEIRD CHARACTERS
        const [rows]: any = await connection.execute(
            `SELECT pv.status, pv.attempts, l.user_id
       FROM PropertyVerification pv
       JOIN Property p ON pv.property_id = p.property_id
       JOIN Landlord l ON p.landlord_id = l.landlord_id
       JOIN User u ON l.user_id = u.user_id
       WHERE pv.property_id = ?`,
            [property_id]
        );

        if (rows.length === 0) {
            await connection.end();
            return new Response(JSON.stringify({ message: "Property not found" }), {
                status: 404,
            });
        }

        const { status: currentStatus, attempts, user_id } = rows[0];

        if (!user_id) {
            await connection.end();
            return new Response(
                JSON.stringify({ message: "Landlord not found for this property." }),
                { status: 500 }
            );
        }

        // ------------------ NOTIFICATION CONTENT ------------------
        let finalNotificationTitle = NotificationTemplates.GENERAL.TITLE(status);
        let finalNotificationBody = NotificationTemplates.GENERAL.BODY(
            status,
            message
        );

        // First case: Rejected twice
        if (currentStatus === "Rejected" && attempts >= 2) {
            finalNotificationTitle =
                NotificationTemplates.REJECTED_TWICE.TITLE(status);
            finalNotificationBody = NotificationTemplates.REJECTED_TWICE.BODY(
                status,
                message
            );

            await connection.execute(
                `INSERT INTO Notification (user_id, title, body, is_read, created_at)
         VALUES (?, ?, ?, 0, NOW())`,
                [user_id, finalNotificationTitle, finalNotificationBody]
            );
        }

        const PROPERTY_VERIFIED_POINTS = 100;

        // Verified case
        if (status === "Verified") {
            finalNotificationTitle = NotificationTemplates.VERIFIED.TITLE;
            finalNotificationBody = NotificationTemplates.VERIFIED.BODY(
                PROPERTY_VERIFIED_POINTS
            );

            await connection.execute(
                `INSERT INTO Notification (user_id, title, body, is_read, created_at)
         VALUES (?, ?, ?, 0, NOW())`,
                [user_id, finalNotificationTitle, finalNotificationBody]
            );

            await connection.execute(
                `UPDATE User SET points = points + ? WHERE user_id = ?`,
                [PROPERTY_VERIFIED_POINTS, user_id]
            );
        }

        // Generic case
        if (
            status !== "Verified" &&
            !(currentStatus === "Rejected" && attempts >= 2)
        ) {
            await connection.execute(
                `INSERT INTO Notification (user_id, title, body, is_read, created_at)
         VALUES (?, ?, ?, 0, NOW())`,
                [user_id, finalNotificationTitle, finalNotificationBody]
            );
        }

        // ------------------ UPDATE ATTEMPTS ------------------
        const newAttempts = status === "Rejected" ? attempts + 1 : attempts;

        // CLEAN UPDATE QUERY
        await connection.execute(
            `UPDATE PropertyVerification
       SET status = ?, admin_message = ?, reviewed_by = ?, attempts = ?
       WHERE property_id = ?`,
            [status, message || null, currentadmin_id, newAttempts, property_id]
        );

        // ------------------ PUSH SUBSCRIPTIONS ------------------
        const [subs]: any = await connection.execute(
            `SELECT endpoint, p256dh, auth
       FROM user_push_subscriptions
       WHERE user_id = ?`,
            [user_id]
        );

        await connection.end();
        connection = null;

        // Send push notifications
        if (subs.length > 0) {
            const payload = JSON.stringify({
                title: finalNotificationTitle,
                body: finalNotificationBody,
                url: "/",
            });

            for (const sub of subs) {
                const subscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth,
                    },
                };

                try {
                    await webpush.sendNotification(subscription, payload);
                } catch (err: any) {
                    console.error("❌ Failed push:", err);

                    if (err.statusCode === 410 || err.statusCode === 404) {
                        const conn = await mysql.createConnection({
                            host: process.env.DB_HOST!,
                            user: process.env.DB_USER!,
                            password: process.env.DB_PASSWORD!,
                            database: process.env.DB_NAME!,
                        });

                        await conn.execute(
                            `DELETE FROM user_push_subscriptions WHERE endpoint = ?`,
                            [sub.endpoint]
                        );

                        await conn.end();
                    }
                }
            }
        }

        return new Response(
            JSON.stringify({
                message: `Property ${status.toLowerCase()} reviewed by Admin ${currentadmin_id}.`,
                attempts: newAttempts,
            }),
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error updating property status:", error);

        if (connection) await connection.end();

        return new Response(
            JSON.stringify({ message: "Error updating property status" }),
            { status: 500 }
        );
    }
}
