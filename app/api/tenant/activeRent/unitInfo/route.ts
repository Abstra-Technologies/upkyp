import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { parse } from "cookie";
import { jwtVerify } from "jose";

//  used in inner rental portal page.

export async function GET(req: NextRequest) {
    /* ---------------- AUTH ---------------- */
    const cookieHeader = req.headers.get("cookie");
    const cookies = cookieHeader ? parse(cookieHeader) : null;

    if (!cookies?.token) {
        return NextResponse.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }

    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(cookies.token, secretKey);

    const userId = payload.user_id as string;
    if (!userId) {
        return NextResponse.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }

    /* ---------------- PARAM ---------------- */
    const { searchParams } = new URL(req.url);
    const agreementId = searchParams.get("agreement_id");

    if (!agreementId) {
        return NextResponse.json(
            { message: "Missing agreement_id" },
            { status: 400 }
        );
    }

    try {
        /* ---------------- OWNERSHIP + STATUS ---------------- */
        const [rows]: any = await db.query(
            `
            SELECT 
              la.agreement_id,
              u.unit_name,
              p.property_name
            FROM LeaseAgreement la
            JOIN Tenant t ON la.tenant_id = t.tenant_id
            JOIN Unit u ON la.unit_id = u.unit_id
            JOIN Property p ON u.property_id = p.property_id
            WHERE la.agreement_id = ?
              AND t.user_id = ?
              AND la.status IN ('active', 'draft', 'expired')
            LIMIT 1
            `,
            [agreementId, userId]
        );

        /* ---------------- HARD BLOCK ---------------- */
        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { message: "Forbidden: Lease does not belong to user" },
                { status: 403 }
            );
        }

        /* ---------------- RESPONSE ---------------- */
        return NextResponse.json({
            agreement_id: rows[0].agreement_id,
            unit_name: rows[0].unit_name,
            property_name: rows[0].property_name,
        });
    } catch (error) {
        console.error("Secure tenant unitInfo error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
