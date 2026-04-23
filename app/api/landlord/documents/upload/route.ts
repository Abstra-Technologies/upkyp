import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";
import { uploadDocumentToS3 } from "@/lib/s3";
import { v4 as uuidv4 } from "uuid";

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

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const reference_type = formData.get("reference_type") as string;
        const reference_id = formData.get("reference_id") as string;
        const folder_id = formData.get("folder_id") as string | null;
        const document_type = formData.get("document_type") as string | null;

        if (!file || !reference_type || !reference_id) {
            return NextResponse.json(
                { error: "file, reference_type, and reference_id are required." },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileUrl = await uploadDocumentToS3(
            buffer,
            session.landlord_id,
            reference_type,
            reference_id,
            file.name,
            file.type
        );

        const documentId = uuidv4();
        await db.query(
            `INSERT INTO rentalley_db.Document 
             (document_id, landlord_id, reference_type, reference_id, document_type, file_name, file_url, file_size, file_mime_type, folder_id, uploaded_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                documentId,
                session.landlord_id,
                reference_type,
                reference_id,
                document_type || "others",
                file.name,
                fileUrl,
                buffer.length,
                file.type,
                folder_id ? parseInt(folder_id) : null,
                session.user_id,
            ]
        );

        return NextResponse.json(
            {
                success: true,
                document_id: documentId,
                file_url: fileUrl,
                message: "File uploaded successfully.",
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("[UPLOAD_DOCUMENT_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}