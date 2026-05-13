import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cacheLife, cacheTag } from "next/cache";

async function getCachedInvitations(email: string) {
    "use cache";
    cacheLife("hours");
    cacheTag(`invitations-${email}`);

    const [rows]: any = await db.query(
        `
        SELECT
            ic.code,
            ic.status,
            ic.createdAt,
            ic.expiresAt,
            ic.start_date,
            ic.end_date,
            u.unit_name,
            p.property_name
        FROM InviteCode ic
        JOIN Unit u ON ic.unitId = u.unit_id
        JOIN Property p ON u.property_id = p.property_id
        WHERE ic.email = ? AND ic.status = 'PENDING'
        ORDER BY ic.createdAt DESC
        `,
        [email]
    );

    return rows.map((row: any) => ({
        code: row.code,
        propertyName: row.property_name,
        unitName: row.unit_name,
        createdAt: row.createdAt,
        expiresAt: row.expiresAt,
        start_date: row.start_date,
        end_date: row.end_date,
        status: row.status,
    }));
}

export async function GET(req: NextRequest) {
    try {
        const email = req.nextUrl.searchParams.get("email");

        if (!email) {
            return NextResponse.json(
                { error: "Email parameter is required." },
                { status: 400 }
            );
        }

        const invites = await getCachedInvitations(email);

        return NextResponse.json({ invites }, { status: 200 });
    } catch (error) {
        console.error("Error fetching invitations:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
