
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ landlord_id: string }> }
) {
    try {
        const { landlord_id } = await params;

        const [rows] = await db.query(
            `SELECT 
                subscription_id,
                plan_name,
                start_date,
                end_date,
                payment_status,
                subscription_status,
                request_reference_number,
                is_trial,
                amount_paid,
                cancelled_at,
                cancel_reason
            FROM Subscription
            WHERE landlord_id = ?
              AND subscription_status = 'cancelled'
            ORDER BY end_date DESC`,
            [landlord_id]
        );

        return NextResponse.json(rows);
    } catch (err: any) {
        console.error("Error fetching past subscriptions:", err);
        return NextResponse.json(
            { error: "Database query failed" },
            { status: 500 }
        );
    }
}
