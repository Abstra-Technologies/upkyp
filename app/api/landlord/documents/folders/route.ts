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

        let query = `
            SELECT f.folder_id, f.name, f.reference_type, f.reference_id, f.created_at, f.updated_at,
             (SELECT COUNT(d.document_id) FROM rentalley_db.Document d 
              WHERE d.folder_id = f.folder_id AND d.landlord_id = f.landlord_id) as file_count,
             (SELECT COALESCE(SUM(d.file_size), 0) FROM rentalley_db.Document d 
              WHERE d.folder_id = f.folder_id AND d.landlord_id = f.landlord_id) as total_size
            FROM rentalley_db.DocumentFolder f
            WHERE f.landlord_id = ?`;
        const params: any[] = [session.landlord_id];

        if (reference_type && reference_id) {
            query += ` AND f.reference_type = ? AND f.reference_id = ?`;
            params.push(reference_type, reference_id);
        }

        query += ` ORDER BY f.name ASC`;

        const [rows]: any = await db.query(query, params);

        return NextResponse.json(
            { success: true, folders: rows },
            { status: 200 }
        );
    } catch (error) {
        console.error("[GET_FOLDERS_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
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

        const { reference_type, reference_id, name } = await req.json();

        if (!name?.trim()) {
            return NextResponse.json(
                { error: "name is required." },
                { status: 400 }
            );
        }

        const [result]: any = await db.query(
            `INSERT INTO rentalley_db.DocumentFolder (landlord_id, reference_type, reference_id, name) VALUES (?, ?, ?, ?)`,
            [session.landlord_id, reference_type || null, reference_id || null, name.trim()]
        );

        return NextResponse.json(
            {
                success: true,
                folder_id: result.insertId,
                message: "Folder created successfully.",
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("[CREATE_FOLDER_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}