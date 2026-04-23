import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
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

        if (!session.landlord_id) {
            return NextResponse.json(
                { error: "Landlord profile not found." },
                { status: 404 }
            );
        }

        const { searchParams } = new URL(req.url);
        const reference_type = searchParams.get("reference_type");
        const reference_id = searchParams.get("reference_id");
        const folder_id = searchParams.get("folder_id");

        let query = `
            SELECT document_id, file_name, file_mime_type, file_size, file_url, 
                   reference_type, reference_id, folder_id, uploaded_by, created_at, updated_at
            FROM rentalley_db.Document
            WHERE landlord_id = ?`;
        const params: any[] = [session.landlord_id];

        if (reference_type && reference_id) {
            query += ` AND reference_type = ? AND reference_id = ?`;
            params.push(reference_type, reference_id);
        }

        if (folder_id) {
            query += ` AND folder_id = ?`;
            params.push(folder_id);
        } else if (!reference_type || !reference_id) {
            query += ` AND folder_id IS NULL`;
        }

        query += ` ORDER BY created_at DESC`;

        const [rows]: any = await db.query(query, params);

        return NextResponse.json(
            { success: true, documents: rows },
            { status: 200 }
        );
    } catch (error) {
        console.error("[GET_DOCUMENTS_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}