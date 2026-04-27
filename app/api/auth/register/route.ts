import crypto from "crypto";
import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { Resend } from "resend";

import { db } from "@/lib/db";
import { encryptData } from "@/crypto/encrypt";
import { generateLandlordId, generateTenantId } from "@/utils/id_generator";
import { EmailTemplate } from "@/components/email-template";

const resend = new Resend(process.env.RESEND_API_KEY!);

/* ================================================== */
/* HELPERS                                            */
/* ================================================== */

function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}

function hashSHA256(value: string) {
    return crypto.createHash("sha256").update(value).digest("hex");
}

async function storeOTP(connection: any, user_id: string, otp: string) {
    await connection.execute(
        `DELETE FROM UserToken
         WHERE user_id = ? AND token_type = 'email_verification'`,
        [user_id]
    );

    await connection.execute(
        `INSERT INTO UserToken
         (user_id, token_type, token, created_at, expires_at)
         VALUES (?, 'email_verification', ?, UTC_TIMESTAMP(),
         DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE))`,
        [user_id, otp]
    );
}

/* ---------- SAFE UNIQUE INSERT (NO RACE CONDITION) ---------- */

async function insertUniqueRoleRecord(
    connection: any,
    role: "tenant" | "landlord",
    user_id: string
) {
    let attempts = 0;

    while (attempts < 5) {
        try {
            if (role === "tenant") {
                const tenantId = generateTenantId();

                await connection.execute(
                    "INSERT INTO Tenant (tenant_id, user_id, employment_type, monthly_income) VALUES (?, ?, '', '')",
                    [tenantId, user_id]
                );

                return;
            }

            if (role === "landlord") {
                const landlordId = generateLandlordId();

                await connection.execute(
                    "INSERT INTO Landlord (landlord_id, user_id) VALUES (?, ?)",
                    [landlordId, user_id]
                );

                return;
            }

        } catch (err: any) {
            if (err.code === "ER_DUP_ENTRY") {
                attempts++;
                continue;
            }
            throw err;
        }
    }

    throw new Error("Failed to generate unique role ID.");
}

async function sendOtpEmail(
    email: string,
    firstName: string,
    otp: string
) {
    const title = "[Upkyp Registration]: Verify your Upkyp account";

    await resend.emails.send({
        from: "Upkyp Registration <hello@upkyp.com>",
        to: [email],
        subject: title,
        react: EmailTemplate({
            title,
            firstName: firstName || "there",
            otp,
            expiry: "10 minutes",
            timezone: "UTC",
        }),
        tags: [
            { name: "type", value: "transactional" },
            { name: "category", value: "otp" },
        ],
    });
}

/* ================================================== */
/* API                                                */
/* ================================================== */

export async function POST(req: NextRequest) {
    const connection = await db.getConnection();

    let emailLower = "";
    let firstNameForEmail = "";
    let otpToSend: string | null = null;

    try {
        await connection.beginTransaction();

        const body = await req.json();

        const {
            email,
            password,
            role,
            timezone = "UTC",
            firstName = "",
            lastName = "",
            google_id = null,
        } = body;

        if (!email || !role) {
            throw new Error("Email and role are required");
        }

        if (!["tenant", "landlord"].includes(role)) {
            throw new Error("Invalid role");
        }

        emailLower = email.toLowerCase();
        firstNameForEmail = firstName;

        const emailHash = hashSHA256(emailLower);
        const secret = process.env.ENCRYPTION_SECRET!;

        let user_id: string;
        let emailVerified = 0;

        /* ==========================================
           CHECK IF USER EXISTS
        ========================================== */

        const [existingUsers]: any = await connection.execute(
            "SELECT user_id, emailVerified, google_id, userType FROM User WHERE emailHashed = ? LIMIT 1",
            [emailHash]
        );

        if (existingUsers.length > 0) {
            const existing = existingUsers[0];
            user_id = existing.user_id;
            emailVerified = existing.emailVerified;

            if (existing.emailVerified && !google_id) {
                throw new Error("Account already exists.");
            }

            if (google_id && !existing.google_id) {
                await connection.execute(
                    "UPDATE User SET google_id = ?, emailVerified = 1 WHERE user_id = ?",
                    [google_id, user_id]
                );
                emailVerified = 1;
            }

            if (!existing.emailVerified && !google_id) {
                otpToSend = generateOTP();
                await storeOTP(connection, user_id, otpToSend);
            }

        } else {

            /* ==========================================
               CREATE NEW USER
            ========================================== */

            user_id = crypto.randomUUID();
            emailVerified = google_id ? 1 : 0;

            const hashedPassword = google_id
                ? null
                : await bcrypt.hash(password, 12);

            await connection.execute(
                `INSERT INTO User
                (user_id, email, emailHashed, password, userType,
                 createdAt, updatedAt, emailVerified, timezone,
                 firstName, lastName, google_id)
                VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP(),
                 ?, ?, ?, ?, ?)`,
                [
                    user_id,
                    JSON.stringify(await encryptData(emailLower, secret)),
                    emailHash,
                    hashedPassword,
                    role,
                    emailVerified,
                    timezone,
                    firstName
                        ? JSON.stringify(await encryptData(firstName, secret))
                        : null,
                    lastName
                        ? JSON.stringify(await encryptData(lastName, secret))
                        : null,
                    google_id || "",
                ]
            );

            await insertUniqueRoleRecord(connection, role, user_id);

            if (!google_id) {
                otpToSend = generateOTP();
                await storeOTP(connection, user_id, otpToSend);
            }
        }

        /* ==========================================
           ISSUE FULL JWT (IMPORTANT FIX)
        ========================================== */

        const tokenPayload = {
            user_id,
            userType: role,
            role: null,
            emailVerified,
            status: "pending",
            permissions: [],
            ip_hash: null,
        };

        const token = await new SignJWT(tokenPayload)
            .setProtectedHeader({ alg: "HS256" })
            .setIssuer(process.env.NEXT_PUBLIC_BASE_URL || "https://upkyp.com")
            .setAudience(process.env.NEXT_PUBLIC_BASE_URL || "https://upkyp.com")
            .setIssuedAt()
            .setExpirationTime("2h")
            .setSubject(user_id)
            .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

        await connection.commit();

        const response = NextResponse.json(
            {
                message: google_id
                    ? "Google registration successful."
                    : "User registered. Please verify OTP.",
            },
            { status: 201 }
        );

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 2,
        });

        /* ==========================================
           SEND EMAIL AFTER COMMIT
        ========================================== */

        if (otpToSend) {
            sendOtpEmail(emailLower, firstNameForEmail, otpToSend)
                .catch(err => console.error("Email sending failed:", err));
        }

        return response;

    } catch (error: any) {
        await connection.rollback();

        return NextResponse.json(
            { error: error.message || "Registration failed" },
            { status: 400 }
        );

    } finally {
        connection.release();
    }
}
