import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* ======================================================
   GET — Fetch Post-Dated Checks for a Lease
====================================================== */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const agreement_id = searchParams.get("agreement_id");

    if (!agreement_id) {
        return NextResponse.json(
            { error: "Missing agreement_id" },
            { status: 400 }
        );
    }

    try {
        const [rows]: any = await db.query(
            `
            SELECT
                pdc_id,
                check_number,
                bank_name,
                amount,
                due_date,
                status,
                uploaded_image_url,
                notes,
                received_at,
                cleared_at,
                bounced_at,
                replaced_by_pdc_id
            FROM rentalley_db.PostDatedCheck
            WHERE lease_id = ?
            ORDER BY due_date ASC
            `,
            [agreement_id]
        );

        return NextResponse.json({
            success: true,
            lease_id: agreement_id,
            pdcs: rows || [],
        });
    } catch (error: any) {
        console.error("❌ Error fetching PDCs:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch post-dated checks.",
                error: error.message,
            },
            { status: 500 }
        );
    }
}
