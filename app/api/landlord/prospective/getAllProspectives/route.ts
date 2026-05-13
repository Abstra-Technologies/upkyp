import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const landlordId = searchParams.get("landlordId");

    if (!landlordId) {
        return NextResponse.json({ error: "Missing landlord_id" }, { status: 400 });
    }

    try {
        // 🧩 Fetch Prospective Tenants by landlord ID
        const [rows]: any = await db.query(
            `
      SELECT 
          pt.id,
          pt.status,
          pt.proceeded,
          pt.created_at,
          u.unit_id,
          u.unit_name,
          p.property_id,
          p.property_name,
          t.tenant_id,
          usr.user_id,
          usr.firstName,
          usr.lastName,
          usr.profilePicture
      FROM ProspectiveTenant pt
      JOIN Tenant t ON pt.tenant_id = t.tenant_id
      JOIN Unit u ON pt.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      JOIN User usr ON t.user_id = usr.user_id
      WHERE p.landlord_id = ?
      ORDER BY pt.created_at DESC
      `,
            [landlordId]
        );

        // 🧩 Decrypt sensitive fields
        const tenants = await Promise.all(
            rows.map(async (row: any) => {
                const firstName =
                    row.firstName && row.firstName.startsWith("{")
                        ? await decryptData(JSON.parse(row.firstName), process.env.ENCRYPTION_SECRET!)
                        : row.firstName;

                const lastName =
                    row.lastName && row.lastName.startsWith("{")
                        ? await decryptData(JSON.parse(row.lastName), process.env.ENCRYPTION_SECRET!)
                        : row.lastName;

                const profilePicture =
                    row.profilePicture && row.profilePicture.startsWith("{")
                        ? await decryptData(JSON.parse(row.profilePicture), process.env.ENCRYPTION_SECRET!)
                        : row.profilePicture;

                return {
                    id: row.id,
                    tenant_id: row.tenant_id, // ✅ Explicitly included
                    unit_id: row.unit_id,     // ✅ Explicitly included
                    status: row.status,
                    proceeded: row.proceeded,
                    created_at: row.created_at,
                    property_id: row.property_id,
                    property_name: row.property_name,
                    unit_name: row.unit_name,
                    user: {
                        user_id: row.user_id,
                        firstName,
                        lastName,
                        profilePicture,
                    },
                };
            })
        );

        return NextResponse.json({ tenants }, { status: 200 });
    } catch (err: any) {
        console.error("❌ Error fetching prospective tenants:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
