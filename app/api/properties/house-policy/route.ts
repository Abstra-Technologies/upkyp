import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* =====================================================
   GET – Fetch House Policy via agreement_id
===================================================== */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const agreement_id = searchParams.get("agreement_id");

        if (!agreement_id) {
            return NextResponse.json(
                { error: "agreement_id is required" },
                { status: 400 }
            );
        }

        const [[row]]: any = await db.query(
            `
            SELECT p.house_policy
            FROM LeaseAgreement la
            JOIN Unit u ON la.unit_id = u.unit_id
            JOIN Property p ON u.property_id = p.property_id
            WHERE la.agreement_id = ?
            LIMIT 1
            `,
            [agreement_id]
        );

        return NextResponse.json({
            success: true,
            house_policy: row?.house_policy ?? "",
        });
    } catch (err) {
        console.error("GET HOUSE POLICY ERROR:", err);
        return NextResponse.json(
            { error: "Failed to load house policy" },
            { status: 500 }
        );
    }
}

/* =====================================================
   POST – Update House Policy via agreement_id
   (Landlord / Admin use)
===================================================== */
export async function POST(req: NextRequest) {
    try {
        const { agreement_id, house_policy } = await req.json();

        if (!agreement_id) {
            return NextResponse.json(
                { error: "agreement_id is required" },
                { status: 400 }
            );
        }

        await db.query(
            `
            UPDATE Property p
            JOIN Unit u ON p.property_id = u.property_id
            JOIN LeaseAgreement la ON la.unit_id = u.unit_id
            SET p.house_policy = ?, p.updated_at = NOW()
            WHERE la.agreement_id = ?
            `,
            [house_policy ?? null, agreement_id]
        );

        return NextResponse.json({
            success: true,
            message: "House policy saved successfully",
        });
    } catch (err) {
        console.error("SAVE HOUSE POLICY ERROR:", err);
        return NextResponse.json(
            { error: "Failed to save house policy" },
            { status: 500 }
        );
    }
}
