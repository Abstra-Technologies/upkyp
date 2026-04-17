import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from "@/lib/auth/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionUser();

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized. Please log in." },
                { status: 401 }
            );
        }

        if (session.userType !== "landlord") {
            return NextResponse.json(
                { error: "Access denied." },
                { status: 403 }
            );
        }

        const landlord_id = session.landlord_id;

        if (!landlord_id) {
            return NextResponse.json(
                { error: "Landlord profile not found." },
                { status: 404 }
            );
        }

        /* ================= PARAMS ================= */
        const { searchParams } = new URL(req.url);
        const property_id = searchParams.get("property_id");

        /* ================= QUERY ================= */
        let query = `
            SELECT
                p.*,
                pv.status AS verification_status,
                pv.admin_message AS verification_message
            FROM Property p
            LEFT JOIN PropertyVerification pv 
                ON p.property_id = pv.property_id
            WHERE p.landlord_id = ?
        `;

        const params: (string | number)[] = [landlord_id];

        if (property_id) {
            query += ` AND p.property_id = ?`;
            params.push(property_id);
        }

        /* ================= EXECUTE ================= */
        const [rows]: any = await db.query(query, params);

        if (rows.length === 0) {
            return NextResponse.json(
                { error: "No properties found." },
                { status: 404 }
            );
        }

        return NextResponse.json(rows, { status: 200 });

    } catch (error) {

        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}