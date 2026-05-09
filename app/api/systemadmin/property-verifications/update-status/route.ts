import { db } from "@/lib/db";
import { deleteFromS3 } from "@/lib/s3";
import { decryptData } from "@/crypto/encrypt";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const SECRET = process.env.ENCRYPTION_SECRET!;
const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token")?.value;

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(JWT_SECRET)
        );

        if (!payload?.admin_id) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const adminId = payload.admin_id;

        const { property_id, status, message } = await req.json();

        if (!property_id || !status) {
            return NextResponse.json(
                { message: "Missing property_id or status" },
                { status: 400 }
            );
        }

        const [rows] = await db.execute<any[]>(
            `
            SELECT
                pv.verification_id,
                pv.submitted_doc,
                p.landlord_id
            FROM PropertyVerification pv
            JOIN Property p ON pv.property_id = p.property_id
            WHERE pv.property_id = ?
            ORDER BY pv.created_at DESC
            LIMIT 1
            `,
            [property_id]
        );

        if (!rows.length) {
            return NextResponse.json(
                { message: "Verification record not found" },
                { status: 404 }
            );
        }

        const { landlord_id, submitted_doc } = rows[0];

        if (status === "Rejected") {
            if (submitted_doc) {
                const url = decryptData(JSON.parse(submitted_doc), SECRET);
                await deleteFromS3(url);
            }

            await db.execute(
                `
                UPDATE PropertyVerification
                SET status = 'Rejected',
                    reviewed_by = ?,
                    updated_at = NOW(),
                    admin_message = ?,
                    attempts = attempts + 1
                WHERE property_id = ?
                `,
                [adminId, message ?? null, property_id]
            );

            await db.execute(
                `
                INSERT INTO Notification (user_id, title, body, is_read, created_at)
                SELECT u.user_id, ?, ?, 0, NOW()
                FROM User u
                JOIN Landlord l ON u.user_id = l.user_id
                WHERE l.landlord_id = ?
                `,
                [
                    "Property Verification Rejected",
                    message
                        ? `Your property verification was rejected: ${message}`
                        : "Your property verification was rejected. Please resubmit.",
                    landlord_id,
                ]
            );

            return NextResponse.json({ message: "Verification rejected." });
        }

        if (status === "Verified") {
            await db.execute(
                `
                UPDATE PropertyVerification
                SET status = 'Verified',
                    reviewed_by = ?,
                    updated_at = NOW(),
                    admin_message = ?,
                    verified = 1,
                    attempts = attempts + 1
                WHERE property_id = ?
                `,
                [adminId, message ?? null, property_id]
            );

            await db.execute(
                `
                INSERT INTO Notification (user_id, title, body, is_read, created_at)
                SELECT u.user_id, ?, ?, 0, NOW()
                FROM User u
                JOIN Landlord l ON u.user_id = l.user_id
                WHERE l.landlord_id = ?
                `,
                [
                    "Property Verification Approved",
                    "Your property verification has been approved.",
                    landlord_id,
                ]
            );

            return NextResponse.json({ message: "Verification approved." });
        }

        return NextResponse.json(
            { message: "Invalid status" },
            { status: 400 }
        );
    } catch (error) {
        console.error("[ADMIN VERIFY PROPERTY]", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
