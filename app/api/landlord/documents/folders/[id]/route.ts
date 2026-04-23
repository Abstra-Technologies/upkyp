import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

        const folderId = parseInt(resolvedParams.id);
        if (!folderId) {
            return NextResponse.json(
                { error: "Invalid folder_id." },
                { status: 400 }
            );
        }

        await db.query(
            `DELETE FROM rentalley_db.DocumentFolder WHERE folder_id = ? AND landlord_id = ?`,
            [folderId, session.landlord_id]
        );

        return NextResponse.json(
            { success: true, message: "Folder deleted successfully." },
            { status: 200 }
        );
    } catch (error) {
        console.error("[DELETE_FOLDER_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}

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

        const folderId = parseInt(resolvedParams.id);
        if (!folderId) {
            return NextResponse.json(
                { error: "Invalid folder_id." },
                { status: 400 }
            );
        }

        const { name } = await req.json();
        if (!name?.trim()) {
            return NextResponse.json(
                { error: "Name is required." },
                { status: 400 }
            );
        }

        await db.query(
            `UPDATE rentalley_db.DocumentFolder SET name = ? WHERE folder_id = ? AND landlord_id = ?`,
            [name.trim(), folderId, session.landlord_id]
        );

        return NextResponse.json(
            { success: true, message: "Folder renamed successfully." },
            { status: 200 }
        );
    } catch (error) {
        console.error("[RENAME_FOLDER_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}