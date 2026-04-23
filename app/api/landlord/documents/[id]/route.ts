import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
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

        const documentId = resolvedParams.id;
        if (!documentId) {
            return NextResponse.json(
                { error: "Invalid document_id." },
                { status: 400 }
            );
        }

        const { folder_id } = await req.json();

        await db.query(
            `UPDATE rentalley_db.Document SET folder_id = ? WHERE document_id = ? AND landlord_id = ?`,
            [folder_id, documentId, session.landlord_id]
        );

        return NextResponse.json(
            { success: true, message: "File moved successfully." },
            { status: 200 }
        );
    } catch (error) {
        console.error("[MOVE_DOCUMENT_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}