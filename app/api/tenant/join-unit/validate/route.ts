import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionUser();
        if (!session || session.userType !== "tenant") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { code } = body;

        if (!code || typeof code !== "string" || code.length !== 4) {
            return NextResponse.json(
                { error: "Invalid invite code format" },
                { status: 400 }
            );
        }

        const [rows]: any[] = await db.execute(
            `
            SELECT 
                ic.id,
                ic.code,
                ic.unitId,
                ic.propertyId,
                ic.status,
                ic.expiresAt,
                ic.email,
                ic.start_date,
                ic.end_date,
                u.unit_name,
                p.property_name,
                p.city,
                p.province
            FROM InviteCode ic
            INNER JOIN Unit u ON ic.unitId = u.unit_id
            INNER JOIN Property p ON ic.propertyId = p.property_id
            WHERE ic.code = ?
            LIMIT 1
            `,
            [code]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: "Invalid invite code" },
                { status: 404 }
            );
        }

        const invite = rows[0];

        if (invite.status === "USED") {
            return NextResponse.json(
                { error: "This invite code has already been used" },
                { status: 400 }
            );
        }

        if (invite.status === "EXPIRED") {
            return NextResponse.json(
                { error: "This invite code has expired" },
                { status: 400 }
            );
        }

        if (invite.status === "REJECTED") {
            return NextResponse.json(
                { error: "This invite has been rejected" },
                { status: 400 }
            );
        }

        if (new Date(invite.expiresAt) < new Date()) {
            return NextResponse.json(
                { error: "This invite code has expired" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                unit_name: invite.unit_name,
                property_name: invite.property_name,
                city: invite.city,
                province: invite.province,
                start_date: invite.start_date,
                end_date: invite.end_date,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("[JOIN-UNIT/VALIDATE] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
