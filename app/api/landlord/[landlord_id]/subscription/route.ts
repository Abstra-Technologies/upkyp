
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
                s.subscription_id,
                p.name AS plan_name,
                s.start_date,
                s.end_date,
                s.payment_status,
                s.subscription_status,
                s.request_reference_number,
                s.is_trial,
                s.cancelled_at,
                s.cancel_reason
            FROM Subscription s
            JOIN Plan p ON s.plan_id = p.plan_id
            WHERE s.landlord_id = ?
              AND s.subscription_status = 'cancelled'
            ORDER BY s.start_date DESC`,
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
