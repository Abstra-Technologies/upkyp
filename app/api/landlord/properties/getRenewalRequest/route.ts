import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { cacheLife, cacheTag } from "next/cache";

async function getCachedRenewalRequests(landlord_id: string) {
    "use cache";
    cacheLife("hours");
    cacheTag(`renewal-requests-${landlord_id}`);

    const [rows]: any = await db.query(
        `
        SELECT 
            rr.id,
            rr.agreement_id,
            rr.unit_id,
            rr.requested_start_date,
            rr.requested_end_date,
            rr.requested_rent_amount,
            rr.status,
            rr.notes,
            u.unit_name,
            p.property_name,
            us.firstName,
            us.lastName,
            us.email,
            us.phoneNumber
        FROM RenewalRequest rr
        INNER JOIN Unit u ON rr.unit_id = u.unit_id
        INNER JOIN Property p ON u.property_id = p.property_id
        INNER JOIN Tenant t ON rr.tenant_id = t.tenant_id
        INNER JOIN User us ON t.user_id = us.user_id
        WHERE p.landlord_id = ?
        ORDER BY rr.created_at DESC
      `,
        [landlord_id]
    );

    const decryptedRows = await Promise.all(
        rows.map(async (r: any) => {
            let firstName = "";
            let lastName = "";
            let email = "";
            let phoneNumber = "";

            try {
                firstName = await decryptData(JSON.parse(r.firstName), process.env.ENCRYPTION_SECRET!);
                lastName = await decryptData(JSON.parse(r.lastName), process.env.ENCRYPTION_SECRET!);
                email = await decryptData(JSON.parse(r.email), process.env.ENCRYPTION_SECRET!);
                phoneNumber = r.phoneNumber
                    ? await decryptData(JSON.parse(r.phoneNumber), process.env.ENCRYPTION_SECRET!)
                    : "";
            } catch (err) {
                console.warn("⚠️ Decryption failed for user:", r.user_id, err);
            }

            return {
                id: r.id,
                agreement_id: r.agreement_id,
                unit_id: r.unit_id,
                property_name: r.property_name,
                unit_name: r.unit_name,
                requested_start_date: r.requested_start_date,
                requested_end_date: r.requested_end_date,
                requested_rent_amount: r.requested_rent_amount,
                status: r.status,
                notes: r.notes,
                tenant_name: `${firstName} ${lastName}`.trim(),
                email,
                phoneNumber,
            };
        })
    );

    return decryptedRows;
}

export async function GET(req: NextRequest) {
    try {
        const landlord_id = req.nextUrl.searchParams.get("landlord_id");

        if (!landlord_id) {
            return NextResponse.json(
                { error: "Missing landlord_id parameter" },
                { status: 400 }
            );
        }

        const decryptedRows = await getCachedRenewalRequests(landlord_id);
        return NextResponse.json(decryptedRows, { status: 200 });
    } catch (error: any) {
        console.error("❌ Error fetching renewal requests:", error);
        return NextResponse.json(
            { error: "Failed to fetch renewal requests", details: error.message },
            { status: 500 }
        );
    }
}