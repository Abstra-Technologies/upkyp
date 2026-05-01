import admin from "firebase-admin";
import { db } from "@/lib/auditlog/upkyp-logger-fb-admin";

export interface AuditLogEntry {
    userId?: string;
    adminId?: string;
    action: string;
    description?: string;
    targetTable?: string;
    targetId?: string;
    oldValue?: Record<string, any>;
    newValue?: Record<string, any>;
    endpoint?: string;
    httpMethod?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    statusCode?: number;
    ipAddress?: string;
    userAgent?: string;
    deviceType?: "web" | "mobile" | "tablet" | "api";
    location?: string;
    sessionId?: string;
    isSuspicious?: boolean;
}

export async function logActivity(entry: AuditLogEntry): Promise<void> {
    try {
        await db.collection("audit_logs").add({
            userId: entry.userId || null,
            adminId: entry.adminId || null,
            action: entry.action,
            description: entry.description || null,
            targetTable: entry.targetTable || null,
            targetId: entry.targetId || null,
            oldValue: entry.oldValue || null,
            newValue: entry.newValue || null,
            endpoint: entry.endpoint || null,
            httpMethod: entry.httpMethod || null,
            statusCode: entry.statusCode || null,
            ipAddress: entry.ipAddress || null,
            userAgent: entry.userAgent || null,
            deviceType: entry.deviceType || null,
            location: entry.location || null,
            sessionId: entry.sessionId || null,
            isSuspicious: entry.isSuspicious || false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
        console.error("[AUDIT LOG] Failed to insert activity log:", error);
    }
}

export function extractClientInfo(req: Request): Pick<AuditLogEntry, "ipAddress" | "userAgent" | "deviceType"> {
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                      req.headers.get("x-real-ip") ||
                      "unknown";

    const userAgent = req.headers.get("user-agent") || "";

    let deviceType: AuditLogEntry["deviceType"] = "web";
    if (/mobile/i.test(userAgent)) deviceType = "mobile";
    else if (/tablet/i.test(userAgent)) deviceType = "tablet";
    else if (/bot|crawl|spider/i.test(userAgent)) deviceType = "api";

    return { ipAddress, userAgent, deviceType };
}
