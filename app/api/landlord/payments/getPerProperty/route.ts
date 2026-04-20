import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const landlord_id = searchParams.get("landlord_id");
        const property_id = searchParams.get("property_id");

        if (!landlord_id || !property_id) {
            return NextResponse.json(
                { message: "landlord_id and property_id are required" },
                { status: 400 }
            );
        }

        const [ownership]: any = await db.query(
            `
      SELECT property_id
      FROM Property
      WHERE property_id = ?
        AND landlord_id = ?
      LIMIT 1
      `,
            [property_id, landlord_id]
        );

        if (!ownership.length) {
            return NextResponse.json(
                { message: "Unauthorized property access" },
                { status: 403 }
            );
        }


        const [rows]: any = await db.query(
            `
      SELECT
        p.payment_id,
        p.payment_type,
        p.amount_paid,
        p.payment_method_id,
        p.payment_status,
        p.payment_date,
        p.receipt_reference,
        p.payout_status,

        u.unit_id,
        u.unit_name,

        la.agreement_id,

        usr.firstName,
        usr.lastName

      FROM Payment p

      LEFT JOIN LeaseAgreement la
        ON la.agreement_id = p.agreement_id

      LEFT JOIN Unit u
        ON u.unit_id = la.unit_id

      LEFT JOIN Property pr
        ON pr.property_id = u.property_id

      LEFT JOIN Tenant t
        ON t.tenant_id = la.tenant_id

      LEFT JOIN User usr
        ON usr.user_id = t.user_id

      WHERE pr.property_id = ?
      ORDER BY p.payment_date DESC
      `,
            [property_id]
        );

        /* =========================================
           🔓 DECRYPT TENANT NAMES
        ========================================= */
        const payments = rows.map((row: any) => {
            let firstName = "";
            let lastName = "";

            try {
                if (row.firstName?.startsWith("{")) {
                    firstName = decryptData(
                        JSON.parse(row.firstName),
                        process.env.ENCRYPTION_SECRET!
                    );
                }

                if (row.lastName?.startsWith("{")) {
                    lastName = decryptData(
                        JSON.parse(row.lastName),
                        process.env.ENCRYPTION_SECRET!
                    );
                }
            } catch (err) {
                console.warn("Name decryption failed:", err);
            }

            return {
                ...row,
                tenant_name:
                    firstName || lastName
                        ? `${firstName} ${lastName}`.trim()
                        : "—",
            };
        });

        return NextResponse.json({
            payments,
            total: payments.length,
        });
    } catch (error) {
        console.error("PROPERTY PAYMENTS ERROR:", error);
        return NextResponse.json(
            { message: "Failed to fetch property payments" },
            { status: 500 }
        );
    }
}
