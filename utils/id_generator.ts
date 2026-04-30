import crypto from "crypto";
import { db } from "@/lib/db";

export function generateWalletId(): string {
    return crypto.randomUUID();
}

function randomAlphaNumeric(length: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        result += chars[bytes[i] % chars.length];
    }
    return result;
}

export async function generateSubscriptionId(): Promise<string> {
    let subscriptionId: string;
    let isUnique = false;

    while (!isUnique) {
        subscriptionId = "SUB" + randomAlphaNumeric(17);

        const [rows] = await db.execute(
            "SELECT 1 FROM Subscription WHERE subscription_id = ? LIMIT 1",
            [subscriptionId]
        );

        if ((rows as any[]).length === 0) {
            isUnique = true;
            return subscriptionId;
        }
    }

    throw new Error("Failed to generate unique subscription ID");
}


export function generatePropertyId(): string {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `UPKYP${random}`;
}

export function generateUnitId(): string {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `UPKYU${random}`;
}

export function generateLandlordId(): string {
    return "UPKYPL" + randomAlphaNumeric(10);
}

export function generateTenantId(): string {
    return "UPKYPT" + randomAlphaNumeric(10);
}

export function generateProspectiveTenantId(): string {
    return "UPKYPPT" + randomAlphaNumeric(10);
}

export function generateLeaseId(): string {
    return "UPKYPL" + randomAlphaNumeric(10);
}

export function generateBillId(): string {
    return "UPKYPBILL" + randomAlphaNumeric(6);
}

export function generateMaintenanceId(): string {
    return "UPKYPWO" + randomAlphaNumeric(4);
}

export function generatAssetsId(): string {
    return "UPKY" + randomAlphaNumeric(4);
}