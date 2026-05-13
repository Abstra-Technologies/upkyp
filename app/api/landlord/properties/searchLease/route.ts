import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { cacheLife, cacheTag } from "next/cache";
import crypto from "crypto";

async function getCachedSearchResults(q: string, landlord_id: string) {
    "use cache";
    cacheLife("hours");
    cacheTag(`lease-search-${landlord_id}-${q}`);

    const secret = process.env.ENCRYPTION_SECRET!;
    const isEmail = q.includes("@");
    const qLower = q.toLowerCase();

    let rows: any[] = [];

    if (isEmail) {
        const emailHashed = crypto
            .createHash("sha256")
            .update(qLower)
            .digest("hex");

        [rows] = await db.query(
            `
                SELECT
                    la.agreement_id,
                    la.status AS lease_status,
                    p.property_id,
                    p.property_name,
                    u.unit_name,
                    usr.firstName,
                    usr.lastName,
                    usr.email
                FROM LeaseAgreement la
                         JOIN Tenant t ON la.tenant_id = t.tenant_id
                         JOIN User usr ON t.user_id = usr.user_id
                         JOIN Unit u ON la.unit_id = u.unit_id
                         JOIN Property p ON u.property_id = p.property_id
                WHERE p.landlord_id = ?
                  AND usr.emailHashed = ?
                  AND la.status = 'active'
                LIMIT 10
            `,
            [landlord_id, emailHashed]
        );
    } else {
        [rows] = await db.query(
            `
                SELECT
                    la.agreement_id,
                    la.status AS lease_status,
                    p.property_id,
                    p.property_name,
                    u.unit_name,
                    usr.firstName,
                    usr.lastName,
                    usr.email
                FROM LeaseAgreement la
                         JOIN Tenant t ON la.tenant_id = t.tenant_id
                         JOIN User usr ON t.user_id = usr.user_id
                         JOIN Unit u ON la.unit_id = u.unit_id
                         JOIN Property p ON u.property_id = p.property_id
                WHERE p.landlord_id = ?
                  AND la.status = 'active'
                  AND (
                    usr.nameHashed = SHA2(LOWER(?), 256)
                        OR JSON_CONTAINS(usr.nameTokens, JSON_QUOTE(SHA2(LOWER(?), 256)))
                        OR p.property_name LIKE ?
                        OR u.unit_name LIKE ?
                    )
                LIMIT 20
            `,
            [landlord_id, q, q, `%${q}%`, `%${q}%`]
        );
    }

    const decrypted = rows.map((r: any) => {
        const safeDecrypt = (value: any) => {
            try {
                return decryptData(JSON.parse(value), secret);
            } catch {
                return "";
            }
        };

        return {
            agreement_id: r.agreement_id,
            lease_status: r.lease_status,
            property_id: r.property_id,
            property_name: r.property_name,
            unit_name: r.unit_name,
            firstName: safeDecrypt(r.firstName),
            lastName: safeDecrypt(r.lastName),
            email: safeDecrypt(r.email),
        };
    });

    return decrypted;
}

export async function GET(req: NextRequest) {
    try {
        const q = req.nextUrl.searchParams.get("q")?.trim();
        const landlord_id = req.nextUrl.searchParams.get("landlord_id");

        if (!q || !landlord_id) {
            return NextResponse.json(
                { error: "Missing query or landlord_id" },
                { status: 400 }
            );
        }

        const decrypted = await getCachedSearchResults(q, landlord_id);
        return NextResponse.json(decrypted);
    } catch (error) {
        console.error("❌ Error searching leases:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}