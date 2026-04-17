import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

//  GET: from the inner property page of the landlord get bank accounts

export async function GET(req: NextRequest) {
    try {

        /* ================= AUTH ================= */
        const session = await getSessionUser();

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (session.userType !== "landlord" && session.userType !== "admin") {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        const landlord_id = session.landlord_id;

        if (!landlord_id) {
            return NextResponse.json(
                { error: "Landlord profile not found" },
                { status: 404 }
            );
        }

        /* ================= PARAMS ================= */
        const { searchParams } = new URL(req.url);
        const property_id = searchParams.get("property_id");

        if (!property_id) {
            return NextResponse.json(
                { error: "Missing property_id" },
                { status: 400 }
            );
        }

        /* ================= QUERY ================= */
        const [rows]: any = await db.query(
            `
            SELECT 
                pa.payout_id,
                pa.account_name,
                pa.account_number,
                pa.bank_name,
                pa.channel_code,
                pa.is_active
            FROM PayoutProperty pp
            JOIN Property p ON p.property_id = pp.property_id
            JOIN LandlordPayoutAccount pa ON pa.payout_id = pp.payout_id
            WHERE pp.property_id = ?
              AND p.landlord_id = ?
            LIMIT 1
            `,
            [property_id, landlord_id]
        );

        /* ================= RESPONSE ================= */
        if (!rows.length) {
            // 👇 return null instead of error (better UX)
            return NextResponse.json(null, { status: 200 });
        }

        return NextResponse.json(rows[0], { status: 200 });

    } catch (error) {
        console.error("Get property payout error:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}