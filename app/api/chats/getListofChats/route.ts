import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { decryptChatMessage } from "@/crypto/decryptChatMessage";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    try {
        const [chatList] = await db.query(
            `
                SELECT DISTINCT
                    m.chat_room,
                    u.firstName AS encryptedFirstName,
                    u.lastName AS encryptedLastName,
                    u.profilePicture AS encryptedProfilePicture,
                    JSON_OBJECT(
                            'encrypted_message', sub.encrypted_message,
                            'iv', sub.iv
                    ) AS lastMessageData,
                    u.user_id AS chatUserId,
                    t.tenant_id,
                    l.landlord_id
                FROM Message m
                         JOIN User u ON (m.receiver_id = u.user_id OR m.sender_id = u.user_id)
                         LEFT JOIN Tenant t ON u.user_id = t.user_id
                         LEFT JOIN Landlord l ON u.user_id = l.user_id
                         LEFT JOIN (
                    SELECT m1.chat_room, m1.encrypted_message, m1.iv
                    FROM Message m1
                             INNER JOIN (
                        SELECT chat_room, MAX(timestamp) AS latest_timestamp
                        FROM Message
                        GROUP BY chat_room
                    ) AS latest
                                        ON m1.chat_room = latest.chat_room AND m1.timestamp = latest.latest_timestamp
                ) AS sub ON sub.chat_room = m.chat_room
                WHERE (m.sender_id = ? OR m.receiver_id = ?)
                  AND u.user_id != ?
                ORDER BY m.timestamp DESC
            `,
            [userId, userId, userId]
        );

// @ts-ignore
        const decryptedChatList = chatList.map((chat: any) => {
            let decryptedFirstName = "Unknown";
            let decryptedLastName = "Unknown";
            let decryptedProfilePicture = "https://res.cloudinary.com/dptmeluy0/image/upload/v1764120619/Portrait_Placeholder_hexdd5.png";
            let lastMessage = "No messages yet";

            // 🔐 Decrypt user info safely
            try {
                decryptedFirstName = decryptData(
                    JSON.parse(chat.encryptedFirstName),
                    process.env.ENCRYPTION_SECRET!
                );
                decryptedLastName = decryptData(
                    JSON.parse(chat.encryptedLastName),
                    process.env.ENCRYPTION_SECRET!
                );
                if (chat.encryptedProfilePicture) {
                    decryptedProfilePicture = decryptData(
                        JSON.parse(chat.encryptedProfilePicture),
                        process.env.ENCRYPTION_SECRET!
                    );
                }
            } catch {
                console.warn("⚠ Failed to decrypt user profile data");
            }

            // 💬 Decrypt last message
            try {
                if (chat.lastMessageData) {
                    const msg = chat.lastMessageData; // already object ✅
                    if (msg.encrypted_message && msg.iv) {
                        lastMessage = decryptChatMessage(msg.encrypted_message, msg.iv);
                    }
                }
            } catch {
                console.warn("⚠ Failed to decrypt last message");
            }

            return {
                chat_room: chat.chat_room,
                name: `${decryptedFirstName} ${decryptedLastName}`,
                profilePicture: decryptedProfilePicture,
                lastMessage,
                chatUserId: chat.chatUserId,
                tenant_id: chat.tenant_id || null,
                landlord_id: chat.landlord_id || null,
            };
        });

        return NextResponse.json(decryptedChatList);
    } catch (error) {
        console.error("Error fetching chat list:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
