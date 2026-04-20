import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { parse } from "cookie";
import { jwtVerify } from "jose";
import webpush from "web-push";
import { io } from "socket.io-client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
webpush.setVapidDetails(
  "mailto:support@upkyp.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
);

export const runtime = "nodejs";

function detectDevice(ua: string) {
  const agent = ua.toLowerCase();
  if (agent.includes("mobile")) return "mobile";
  if (agent.includes("tablet") || agent.includes("ipad")) return "tablet";
  return "web";
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
  const userAgent = req.headers.get("user-agent") || "unknown";
  const deviceType = detectDevice(userAgent);
  const endpoint = req.url;
  const method = req.method;

  const cookieHeader = req.headers.get("cookie");
  const cookies = cookieHeader ? parse(cookieHeader) : null;

  if (!cookies?.token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  const { payload } = await jwtVerify(cookies.token, secret);
  const tenantUserId = payload.user_id;
  const sessionId = payload.session_id || payload.jti || null;

  if (!tenantUserId) {
    return NextResponse.json(
      { success: false, message: "Invalid token payload" },
      { status: 401 },
    );
  }

  const conn = await db.getConnection();
  try {
    const body = await req.json();
    const { request_id } = body;

    if (!request_id) {
      return NextResponse.json(
        { error: "Missing request_id" },
        { status: 400 },
      );
    }

    await conn.beginTransaction();

    const [existingRows]: any = await conn.query(
      `SELECT mr.*, 
              COALESCE(p.landlord_id, p_via_unit.landlord_id) AS landlord_id
       FROM MaintenanceRequest mr
       LEFT JOIN Unit u ON mr.unit_id = u.unit_id
       LEFT JOIN Property p ON mr.property_id = p.property_id
       LEFT JOIN Property p_via_unit ON u.property_id = p_via_unit.property_id
       WHERE mr.request_id = ?`,
      [request_id],
    );

    if (!existingRows.length) {
      await conn.rollback();
      return NextResponse.json(
        { error: "Maintenance request not found." },
        { status: 404 },
      );
    }

    const existing = existingRows[0];

    if (existing.status.toLowerCase() !== "pending") {
      await conn.rollback();
      return NextResponse.json(
        { error: "Only pending requests can be cancelled." },
        { status: 400 },
      );
    }

    const [tenantInfo]: any = await conn.query(
      `SELECT t.user_id AS tenant_user_id, t.tenant_id
       FROM Tenant t
       WHERE t.user_id = ? AND t.tenant_id = ?`,
      [tenantUserId, existing.tenant_id],
    );

    if (!tenantInfo.length) {
      await conn.rollback();
      return NextResponse.json(
        { error: "You can only cancel your own maintenance requests." },
        { status: 403 },
      );
    }

    const oldData = { ...existing };

    await conn.query(
      `UPDATE MaintenanceRequest SET status = 'cancelled', updated_at = NOW() WHERE request_id = ?`,
      [request_id],
    );

    if (existing.landlord_id) {
      try {
        await redis.del(`maintenance:requests:${existing.landlord_id}`);
      } catch (cacheError) {
        console.warn("Failed to invalidate cache:", cacheError);
      }
    }

    const [landlordInfo]: any = await conn.query(
      `SELECT l.user_id AS landlord_user_id
       FROM Landlord l
       WHERE l.landlord_id = ?`,
      [existing.landlord_id],
    );

    const landlordUserId = landlordInfo[0]?.landlord_user_id;

    if (landlordUserId) {
      await conn.query(
        `INSERT INTO Notification (user_id, title, body, url, is_read, created_at)
         VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
        [
          landlordUserId,
          "Maintenance Request Cancelled",
          `Tenant cancelled maintenance request "${existing.subject}".`,
          `/landlord/maintenance-request?id=${request_id}`,
        ],
      );

      const [subs]: any = await conn.query(
        `SELECT endpoint, p256dh, auth FROM user_push_subscriptions WHERE user_id = ?`,
        [landlordUserId],
      );

      if (subs.length > 0) {
        const pushPayload = JSON.stringify({
          title: "Maintenance Request Cancelled",
          body: `Tenant cancelled maintenance request "${existing.subject}".`,
          url: `/landlord/maintenance-request?id=${request_id}`,
        });

        for (const sub of subs) {
          const subscription = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          };

          try {
            await webpush.sendNotification(subscription, pushPayload);
          } catch (err: any) {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await conn.query(
                `DELETE FROM user_push_subscriptions WHERE endpoint = ?`,
                [sub.endpoint],
              );
            }
          }
        }
      }
    }

    try {
      const socket = io(
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
        {
          autoConnect: true,
          transports: ["websocket"],
        },
      );

      if (landlordUserId) {
        const chat_room = `chat_${[tenantUserId, landlordUserId].sort().join("_")}`;
        socket.emit("sendMessage", {
          sender_id: tenantUserId,
          sender_type: "tenant",
          receiver_id: existing.tenant_id,
          receiver_type: "landlord",
          message: `Maintenance request "${existing.subject}" has been cancelled.`,
          chat_room,
        });
      }

      setTimeout(() => socket.disconnect(), 300);
    } catch (socketError) {
      console.warn("Socket notification failed:", socketError);
    }

    const [updatedRows]: any = await conn.query(
      `SELECT * FROM MaintenanceRequest WHERE request_id = ?`,
      [request_id],
    );
    const newData = updatedRows[0];

    await conn.query(
      `INSERT INTO ActivityLog
       (user_id, action, description, target_table, target_id, old_value, new_value,
        endpoint, http_method, status_code, ip_address, user_agent, device_type, session_id, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        tenantUserId,
        "Maintenance Request Cancelled",
        `Tenant cancelled maintenance request "${existing.subject}".`,
        "MaintenanceRequest",
        String(request_id),
        JSON.stringify(oldData),
        JSON.stringify(newData),
        endpoint,
        method,
        200,
        ip,
        userAgent,
        deviceType,
        sessionId,
      ],
    );

    await conn.commit();

    return NextResponse.json({
      success: true,
      message: "Maintenance request cancelled successfully.",
      data: {
        request_id,
        status: "cancelled",
      },
    });
  } catch (error: any) {
    console.error("❌ Maintenance cancel error:", error);
    await conn.rollback();
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  } finally {
    conn.release();
  }
}
