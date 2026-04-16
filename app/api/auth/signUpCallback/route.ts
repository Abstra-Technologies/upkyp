import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import crypto from "crypto";
import { SignJWT } from "jose";
import { Resend } from "resend";

import { encryptData } from "@/crypto/encrypt";
import { generateLandlordId, generateTenantId } from "@/utils/id_generator";
import { generateNameHash, generateNameTokens } from "@/utils/nameHash";
import { EmailTemplate } from "@/components/email-template";

/* =====================================================
   CONFIG
===================================================== */

const resend = new Resend(process.env.RESEND_API_KEY!);

const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI,
    ENCRYPTION_SECRET,
    JWT_SECRET,
    NEXT_PUBLIC_BASE_URL,
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
} = process.env;

const dbConfig = {
    host: DB_HOST!,
    user: DB_USER!,
    password: DB_PASSWORD!,
    database: DB_NAME!,
};

/* =====================================================
   HELPERS
===================================================== */

const generateOTP = () =>
    crypto.randomInt(100000, 999999).toString();

/* ---------- SAFE ROLE INSERT ---------- */
async function insertRoleRecord(
    db: mysql.Connection,
    role: "tenant" | "landlord",
    user_id: string
) {
    let attempts = 0;

    while (attempts < 5) {
        try {
            if (role === "tenant") {
                await db.execute(
                    "INSERT INTO Tenant (tenant_id, user_id, employment_type, monthly_income) VALUES (?, ?, '', '')",
                    [generateTenantId(), user_id]
                );
            } else {
                await db.execute(
                    "INSERT INTO Landlord (landlord_id, user_id) VALUES (?, ?)",
                    [generateLandlordId(), user_id]
                );
            }
            return;
        } catch (err: any) {
            if (err.code === "ER_DUP_ENTRY") {
                attempts++;
                continue;
            }
            throw err;
        }
    }

    throw new Error("Failed to generate unique role ID");
}

/* ---------- STORE OTP ---------- */
async function storeOTP(db: mysql.Connection, user_id: string) {
    const otp = generateOTP();

    await db.execute(
        `
    INSERT INTO UserToken
    (user_id, token_type, token, created_at, expires_at)
    VALUES (?, 'email_verification', ?, UTC_TIMESTAMP(),
            DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE))
    ON DUPLICATE KEY UPDATE
        token = VALUES(token),
        created_at = UTC_TIMESTAMP(),
        expires_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE)
    `,
        [user_id, otp]
    );

    return otp;
}

/* ---------- SEND OTP EMAIL (NON BLOCKING) ---------- */
async function sendOtpEmail(
    email: string,
    firstName: string,
    otp: string
) {
    resend.emails
        .send({
            from: "Upkyp Registration <hello@upkyp.com>",
            to: [email],
            subject: "[Upkyp Registration]: Verify your account",
            react: EmailTemplate({
                title: "Verify your Upkyp account",
                firstName: firstName || "there",
                otp,
                expiry: "10 minutes",
                timezone: "UTC",
            }),
        })
        .catch((err) =>
            console.error("OTP email failed:", err)
        );
}

/* =====================================================
   GOOGLE SIGNUP CALLBACK
===================================================== */

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
        return NextResponse.json(
            { error: "Invalid request" },
            { status: 400 }
        );
    }

    const parsedState =
        JSON.parse(decodeURIComponent(state)) || {};

    const userType =
        parsedState.userType?.trim().toLowerCase();

    const timezone = parsedState.timezone || "UTC";

    const role =
        userType === "landlord" ? "landlord" : "tenant";

    const db = await mysql.createConnection(dbConfig);

    try {
        await db.beginTransaction();

        /* =====================================================
           1️⃣ GET GOOGLE TOKEN
        ===================================================== */

        const tokenRes = await fetch(
            "https://oauth2.googleapis.com/token",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    code,
                    client_id: GOOGLE_CLIENT_ID!,
                    client_secret: GOOGLE_CLIENT_SECRET!,
                    redirect_uri: REDIRECT_URI!,
                    grant_type: "authorization_code",
                }),
            }
        );

        const tokenData = await tokenRes.json();

        if (!tokenData.access_token)
            throw new Error("Google OAuth failed");

        /* =====================================================
           2️⃣ GET GOOGLE USER
        ===================================================== */

        const userRes = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                },
            }
        );

        const gUser = await userRes.json();

        const email = gUser.email?.toLowerCase();
        const googleId = gUser.sub;

        if (!email || !googleId)
            throw new Error("Google user info missing");

        const firstName = gUser.given_name || "";
        const lastName = gUser.family_name || "";
        const profilePicture = gUser.picture || null;

        const emailHash = crypto
            .createHash("sha256")
            .update(email)
            .digest("hex");

        const nameHashed = generateNameHash(
            firstName,
            lastName
        );
        const nameTokens = generateNameTokens(
            firstName,
            lastName
        );

        /* =====================================================
           3️⃣ UPSERT USER
        ===================================================== */

        const [existing]: any = await db.execute(
            `SELECT user_id, emailVerified
       FROM User
       WHERE emailHashed = ? OR google_id = ?
       LIMIT 1`,
            [emailHash, googleId]
        );

        let user_id: string;
        let emailVerified = false;

        if (existing.length) {
            user_id = existing[0].user_id;
            emailVerified =
                !!existing[0].emailVerified;

            await db.execute(
                `
        UPDATE User
        SET google_id = ?,
            nameHashed = COALESCE(nameHashed, ?),
            nameTokens = COALESCE(nameTokens, ?)
        WHERE user_id = ?
        `,
                [googleId, nameHashed, nameTokens, user_id]
            );
        } else {
            user_id = crypto.randomUUID();

            await db.execute(
                `
        INSERT INTO User
        (user_id, email, emailHashed, google_id, userType,
         emailVerified, timezone,
         firstName, lastName, profilePicture,
         nameHashed, nameTokens,
         createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
        `,
                [
                    user_id,
                    JSON.stringify(
                        await encryptData(email, ENCRYPTION_SECRET!)
                    ),
                    emailHash,
                    googleId,
                    role,
                    timezone,
                    firstName
                        ? JSON.stringify(
                            await encryptData(
                                firstName,
                                ENCRYPTION_SECRET!
                            )
                        )
                        : null,
                    lastName
                        ? JSON.stringify(
                            await encryptData(
                                lastName,
                                ENCRYPTION_SECRET!
                            )
                        )
                        : null,
                    profilePicture
                        ? JSON.stringify(
                            await encryptData(
                                profilePicture,
                                ENCRYPTION_SECRET!
                            )
                        )
                        : null,
                    nameHashed,
                    nameTokens,
                ]
            );

            await insertRoleRecord(db, role, user_id);
        }

        /* =====================================================
           4️⃣ OTP + JWT
        ===================================================== */

        const otp = await storeOTP(db, user_id);

        const jwt = await new SignJWT({
            user_id,
            userType: role,
            emailVerified,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("2h")
            .sign(
                new TextEncoder().encode(JWT_SECRET!)
            );

        await db.commit();

        /* =====================================================
           5️⃣ SEND EMAIL AFTER COMMIT
        ===================================================== */

        sendOtpEmail(email, firstName, otp);

        const redirectUrl = role === "tenant"
            ? `${NEXT_PUBLIC_BASE_URL}/auth/verify-email`
            : `${NEXT_PUBLIC_BASE_URL}/landlord/dashboard`;

        const response = NextResponse.redirect(redirectUrl);

        response.cookies.set("token", jwt, {
            httpOnly: true,
            secure:
                process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 2 * 60 * 60,
        });

        return response;
    } catch (err) {
        await db.rollback();
        console.error(
            "Google signup error:",
            err
        );

        return NextResponse.json(
            { error: "Google signup failed" },
            { status: 500 }
        );
    } finally {
        await db.end();
    }
}