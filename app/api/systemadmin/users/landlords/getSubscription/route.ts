import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
        return NextResponse.json(
            { success: false, message: "user_id is required" },
            { status: 400 }
        );
    }

    try {
        const [subscriptions]: any = await db.query(
            `SELECT 
                s.*,
                l.landlord_id
            FROM Subscription s
            JOIN Landlord l ON s.landlord_id = l.landlord_id
            WHERE l.user_id = ?
            ORDER BY s.created_at DESC`,
            [user_id]
        );

        return NextResponse.json(
            { success: true, subscriptions },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching subscriptions:", error);
        return NextResponse.json(
            { success: false, message: "DB Server Error" },
            { status: 500 }
        );
    }
}
