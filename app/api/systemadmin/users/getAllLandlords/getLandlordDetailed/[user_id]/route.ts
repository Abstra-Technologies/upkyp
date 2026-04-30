import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeDecrypt } from "@/utils/decrypt/safeDecrypt";
import { generateWalletId } from "@/utils/id_generator";
import { generateXenditAccountId } from "@/utils/generateXenditAccountId";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ user_id: string }> }
) {
    try {
        const { user_id } = await context.params;

        if (!user_id || !/^[0-9a-fA-F-]{36}$/.test(user_id)) {
            return NextResponse.json(
                { error: "Invalid user_id" },
                { status: 400 }
            );
        }

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

        const firstName = safeDecrypt(landlord.firstName);
        const lastName = safeDecrypt(landlord.lastName);
        const email = safeDecrypt(landlord.email);
        const phoneNumber = safeDecrypt(landlord.phoneNumber);

        const [walletRows]: any = await db.execute(
            `SELECT wallet_id, available_balance FROM LandlordWallet WHERE landlord_id = ?`,
            [landlord.landlord_id]
        );

        const wallet = walletRows.length > 0 ? walletRows[0] : null;

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

        const response = {
            user_id: landlord.user_id,
            landlord_id: landlord.landlord_id,

            firstName,
            lastName,
            email,
            phoneNumber,

            profilePicture: landlord.profilePicture,

            emailVerified: landlord.emailVerified,

            landlordCreatedAt: landlord.landlordCreatedAt,

            is_active: landlord.status === "active" ? 1 : 0,

            is_verified: landlord.is_verified,
            citizenship: landlord.citizenship,

            xendit_account_id: landlord.xendit_account_id,

            wallet: wallet,

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

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ user_id: string }> }
) {
    try {
        const { user_id } = await context.params;
        const { action } = await req.json();

        if (action === "create_wallet") {
            const [landlordRows]: any = await db.execute(
                `SELECT landlord_id FROM Landlord WHERE user_id = ?`,
                [user_id]
            );

            if (!landlordRows.length) {
                return NextResponse.json(
                    { error: "Landlord not found" },
                    { status: 404 }
                );
            }

            const landlord_id = landlordRows[0].landlord_id;

            const [existingWallet]: any = await db.execute(
                `SELECT wallet_id FROM LandlordWallet WHERE landlord_id = ?`,
                [landlord_id]
            );

            if (existingWallet.length > 0) {
                return NextResponse.json({
                    message: "Wallet already exists",
                    wallet_id: existingWallet[0].wallet_id,
                });
            }

            let wallet_id = generateWalletId();
            let attempts = 0;
            const maxAttempts = 5;

            while (attempts < maxAttempts) {
                const [existingId]: any = await db.execute(
                    `SELECT wallet_id FROM LandlordWallet WHERE wallet_id = ?`,
                    [wallet_id]
                );

                if (existingId.length === 0) {
                    break;
                }

                wallet_id = generateWalletId();
                attempts++;
            }

            await db.execute(
                `INSERT INTO LandlordWallet (wallet_id, landlord_id, available_balance, created_at, updated_at) VALUES (?, ?, 0, NOW(), NOW())`,
                [wallet_id, landlord_id]
            );

            const [newWallet]: any = await db.execute(
                `SELECT wallet_id, available_balance FROM LandlordWallet WHERE wallet_id = ?`,
                [wallet_id]
            );

            return NextResponse.json({
                message: "Wallet created successfully",
                wallet: newWallet[0],
            });
        }

        if (action === "generate_xendit_account") {
            const [landlordRows]: any = await db.execute(
                `SELECT landlord_id FROM Landlord WHERE user_id = ?`,
                [user_id]
            );

            if (!landlordRows.length) {
                return NextResponse.json(
                    { error: "Landlord not found" },
                    { status: 404 }
                );
            }

            const landlord_id = landlordRows[0].landlord_id;

            const xenditAccountId = await generateXenditAccountId(landlord_id);

            return NextResponse.json({
                message: "Xendit account generated successfully",
                xendit_account_id: xenditAccountId,
            });
        }

        if (action === "update_xendit") {
            const { xendit_account_id } = await req.json();

            if (!xendit_account_id) {
                return NextResponse.json(
                    { error: "xendit_account_id is required" },
                    { status: 400 }
                );
            }

            await db.execute(
                `UPDATE Landlord SET xendit_account_id = ? WHERE user_id = ?`,
                [xendit_account_id, user_id]
            );

            return NextResponse.json({
                message: "Xendit account updated successfully",
                xendit_account_id,
            });
        }

        return NextResponse.json(
            { error: "Invalid action" },
            { status: 400 }
        );

    } catch (error: any) {
        console.error("Error updating landlord:", error);
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        );
    }
}
