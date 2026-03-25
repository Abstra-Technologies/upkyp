import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeDecrypt } from "@/utils/decrypt/safeDecrypt";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ user_id: string }> }
) {
    try {
        const { user_id } = await context.params;

        // 🔐 Validate UUID
        if (!user_id || !/^[0-9a-fA-F-]{36}$/.test(user_id)) {
            return NextResponse.json(
                { error: "Invalid user_id" },
                { status: 400 }
            );
        }

        // 🔹 1. Fetch Landlord + User
        const [rows]: any = await db.execute(
            `
      SELECT 
        l.landlord_id,
        l.user_id,
        l.createdAt AS landlordCreatedAt,
        l.is_verified,
        l.citizenship,
        l.xendit_account_id,

        u.firstName,
        u.lastName,
        u.email,
        u.phoneNumber,
        u.profilePicture,
        u.emailVerified,
        u.status

      FROM Landlord l
      JOIN User u ON l.user_id = u.user_id
      WHERE l.user_id = ?
      LIMIT 1
      `,
            [user_id]
        );

        if (!rows.length) {
            return NextResponse.json(
                { error: "Landlord not found" },
                { status: 404 }
            );
        }

        const landlord = rows[0];

        // 🔐 2. Decrypt sensitive fields (User table)
        const firstName = safeDecrypt(landlord.firstName);
        const lastName = safeDecrypt(landlord.lastName);
        const email = safeDecrypt(landlord.email);
        const phoneNumber = safeDecrypt(landlord.phoneNumber);

        // 🔹 3. Activity Logs
        const [activityLogs]: any = await db.execute(
            `
      SELECT action, timestamp
      FROM ActivityLog
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT 10
      `,
            [user_id]
        );

        // 🔹 4. Final Response
        const response = {
            user_id: landlord.user_id,
            landlord_id: landlord.landlord_id,

            firstName,
            lastName,
            email,
            phoneNumber,

            profilePicture: landlord.profilePicture, // usually not encrypted

            emailVerified: landlord.emailVerified,

            landlordCreatedAt: landlord.landlordCreatedAt,

            is_active: landlord.status === "active" ? 1 : 0,

            is_verified: landlord.is_verified,
            citizenship: landlord.citizenship,

            xendit_account_id: landlord.xendit_account_id,

            activityLogs,
        };

        return NextResponse.json(response, { status: 200 });

    } catch (error: any) {
        console.error("Landlord details error:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}