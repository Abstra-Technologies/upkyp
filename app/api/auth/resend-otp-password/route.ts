import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendPasswordResetOtpEmail } from "@/lib/email/sendPasswordResetOtpEmail";
import { safeDecrypt } from "@/utils/decrypt/safeDecrypt";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const emailHash = crypto.createHash("sha256").update(email.toLowerCase()).digest("hex");

    const [userRows]: any[] = await db.query(
      "SELECT user_id, firstName, timezone FROM User WHERE emailHashed = ?",
      [emailHash]
    );

    if (!userRows || userRows.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const userId = userRows[0].user_id;

    // Clean up old OTP
    await db.query(
      "DELETE FROM UserToken WHERE user_id = ? AND token_type = 'password_reset'",
      [userId]
    );

    // Generate new OTP
    const newOtp = crypto.randomInt(100000, 999999).toString();

    await db.query(
      `INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at)
       VALUES (?, 'password_reset', ?, UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 MINUTE))
       ON DUPLICATE KEY UPDATE 
         token = VALUES(token), 
         created_at = VALUES(created_at), 
         expires_at = VALUES(expires_at)`,
      [userId, newOtp]
    );

    const [expiryRows] = await db.query<any[]>(
      `SELECT CONVERT_TZ(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 MINUTE), '+00:00', ?) AS local_expiry`,
      [userRows[0].timezone || "UTC"]
    );

    const localExpiry = expiryRows[0]?.local_expiry;
    const expiresAtStr = localExpiry instanceof Date
      ? localExpiry.toLocaleString()
      : String(localExpiry ?? "5 minutes");

    const decryptedFirstName = safeDecrypt(userRows[0].firstName);

    await sendPasswordResetOtpEmail({
      email,
      firstName: decryptedFirstName || "there",
      otp: newOtp,
      expiresAt: expiresAtStr,
      timezone: userRows[0].timezone || "UTC",
    });

    return NextResponse.json(
      { message: "New OTP has been sent to your email." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resending OTP:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
