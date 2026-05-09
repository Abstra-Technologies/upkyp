import { NextRequest } from "next/server";
import mysql from "mysql2/promise";
import { decryptData } from "@/crypto/encrypt";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ propertyId: string }> }
) {
    const { propertyId } = await params;

    if (!propertyId) {
        return new Response(
            JSON.stringify({ message: "Missing property ID" }),
            { status: 400 }
        );
    }

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            timezone: "+08:00",
        });

        const [rows] = await connection.execute(
            `SELECT
                 verification_id,
                 property_id,
                 doc_type,
                 submitted_doc,
                 tin_number,
                 status,
                 admin_message,
                 reviewed_by,
                 created_at,
                 updated_at,
                 verified,
                 attempts
             FROM PropertyVerification
             WHERE property_id = ?`,
            [propertyId]
        );

        if (!Array.isArray(rows) || rows.length === 0) {
            return new Response(
                JSON.stringify({ message: "Verification documents not found" }),
                { status: 404 }
            );
        }

        const secretKey = process.env.ENCRYPTION_SECRET;
        if (!secretKey) {
            console.error("Missing ENCRYPTION_SECRET");
            return new Response(
                JSON.stringify({ message: "Encryption key missing" }),
                { status: 500 }
            );
        }

        const decryptIfValid = (field: string | null) => {
            if (!field || typeof field !== "string") return null;
            try {
                const parsed = field.trim().startsWith("{")
                    ? JSON.parse(field)
                    : null;
                return parsed ? decryptData(parsed, secretKey) : null;
            } catch (err) {
                console.error("Failed to decrypt field:", err);
                return null;
            }
        };

        const decryptedData = (rows as any[]).map((row) => ({
            verification_id: row.verification_id,
            property_id: row.property_id,
            doc_type: row.doc_type,
            submitted_doc: decryptIfValid(row.submitted_doc),
            tin_number: row.tin_number,
            status: row.status,
            admin_message: row.admin_message,
            reviewed_by: row.reviewed_by,
            created_at: row.created_at,
            updated_at: row.updated_at,
            verified: row.verified,
            attempts: row.attempts,
        }));

        return new Response(JSON.stringify(decryptedData), { status: 200 });
    } catch (err) {
        console.error("Database Error:", err);
        return new Response(
            JSON.stringify({ message: "Internal Server Error" }),
            { status: 500 }
        );
    }
}
