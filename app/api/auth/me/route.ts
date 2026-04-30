// app/api/auth/me/route.ts

import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

export const dynamic = "force-dynamic";

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET!;
const JWT_SECRET = process.env.JWT_SECRET!;

/* ======================================================
   HELPERS
====================================================== */

const safeDecrypt = (value?: string | null): string | null => {
    if (!value) return null;
    try {
        // @ts-ignore
        return decryptData(JSON.parse(value), ENCRYPTION_SECRET);
    } catch {
        return null;
    }
};

const parseAdminPermissions = (value?: string | null): string[] | null => {
    if (!value) return null;
    try {
        const trimmed = value.trim();

        if (trimmed.startsWith("[")) {
            return JSON.parse(trimmed);
        }

        return trimmed
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean);
    } catch {
        return null;
    }
};

/* ======================================================
   DATABASE QUERIES
====================================================== */

const getUser = async (userId: string) => {
    const [rows]: any[] = await db.execute(
        `
        SELECT
          u.*,
          t.tenant_id,
          l.landlord_id,
          l.is_verified,
          l.is_trial_used
        FROM rentalley_db.User u
        LEFT JOIN rentalley_db.Tenant t ON u.user_id = t.user_id
        LEFT JOIN rentalley_db.Landlord l ON u.user_id = l.user_id
        WHERE u.user_id = ?
        LIMIT 1
        `,
        [userId]
    );

    return rows?.[0] || null;
};

const getAdmin = async (adminId: string) => {
    const [rows]: any[] = await db.execute(
        `
        SELECT
          admin_id,
          username,
          first_name,
          last_name,
          email,
          role,
          status,
          profile_picture,
          permissions
        FROM rentalley_db.Admin
        WHERE admin_id = ?
        LIMIT 1
        `,
        [adminId]
    );

    return rows?.[0] || null;
};

/* ======================================================
   ROUTE HANDLER
====================================================== */

export async function GET() {
    try {
        const cookieStore = await cookies();

        const userToken = cookieStore.get("token")?.value;
        const adminToken = cookieStore.get("admin_token")?.value;

        const secret = new TextEncoder().encode(JWT_SECRET);

        /* ======================================================
           🔥 ADMIN SESSION (PRIORITY)
        ====================================================== */
        if (adminToken) {
            try {
                const { payload } = await jwtVerify(adminToken, secret);

                if (!payload?.admin_id) {
                    return NextResponse.json(
                        { error: "Invalid admin session" },
                        { status: 401 }
                    );
                }

                const rawAdmin = await getAdmin(payload.admin_id);

                if (!rawAdmin) {
                    return NextResponse.json(
                        { error: "Admin not found" },
                        { status: 404 }
                    );
                }

                if (rawAdmin.status !== "active") {
                    return NextResponse.json(
                        { error: `Admin account ${rawAdmin.status}` },
                        { status: 403 }
                    );
                }

                const admin = {
                    admin_id: rawAdmin.admin_id,
                    username: rawAdmin.username,
                    first_name: safeDecrypt(rawAdmin.first_name),
                    last_name: safeDecrypt(rawAdmin.last_name),
                    email: safeDecrypt(rawAdmin.email),
                    role: rawAdmin.role,
                    status: rawAdmin.status,
                    profile_picture: rawAdmin.profile_picture,
                    permissions: parseAdminPermissions(rawAdmin.permissions),
                };

                return NextResponse.json(admin, { status: 200 });

            } catch (err) {
                return NextResponse.json(
                    { error: "Admin session expired or invalid" },
                    { status: 401 }
                );
            }
        }

        /* ======================================================
           🔥 USER SESSION
        ====================================================== */
        if (userToken) {
            try {
                const { payload } = await jwtVerify(userToken, secret);

                if (!payload?.user_id) {
                    return NextResponse.json(
                        { error: "Invalid user session" },
                        { status: 401 }
                    );
                }

                const rawUser = await getUser(payload.user_id);

                if (!rawUser) {
                    return NextResponse.json(
                        { error: "User not found" },
                        { status: 404 }
                    );
                }

                const validStatuses = ["active", "pending", "unverified"];
                if (rawUser.status && !validStatuses.includes(rawUser.status)) {
                    return NextResponse.json(
                        { error: `Account is ${rawUser.status}` },
                        { status: 403 }
                    );
                }

                const user: any = {
                    user_id: rawUser.user_id,
                    firstName: safeDecrypt(rawUser.firstName),
                    lastName: safeDecrypt(rawUser.lastName),
                    companyName: rawUser.companyName,
                    email: safeDecrypt(rawUser.email),
                    profilePicture: safeDecrypt(rawUser.profilePicture),
                    phoneNumber: safeDecrypt(rawUser.phoneNumber),
                    birthDate: safeDecrypt(rawUser.birthDate),
                    address: rawUser.address,
                    occupation: rawUser.occupation,
                    citizenship: rawUser.citizenship,
                    civil_status: rawUser.civil_status,
                    userType: rawUser.userType,
                    is_2fa_enabled: !!rawUser.is_2fa_enabled,
                    points: rawUser.points || 0,
                    status: rawUser.status,
                    emailVerified: !!rawUser.emailVerified,
                    google_id: rawUser.google_id,
                    createdAt: rawUser.createdAt,
                    updatedAt: rawUser.updatedAt,
                    tenant_id: rawUser.tenant_id || null,
                    landlord_id: rawUser.landlord_id || null,
                    is_verified: rawUser.landlord_id
                        ? !!rawUser.is_verified
                        : null,
                    is_trial_used: rawUser.landlord_id
                        ? !!rawUser.is_trial_used
                        : null,
                };

                if (user.landlord_id) {
                    const [subs]: any[] = await db.execute(
                        `
                        SELECT *
                        FROM rentalley_db.Subscription
                        WHERE landlord_id = ?
                        ORDER BY created_at DESC
                        LIMIT 1
                        `,
                        [user.landlord_id]
                    );

                    user.subscription = subs?.[0] || null;
                }

                return NextResponse.json(user, { status: 200 });

            } catch (err) {
                return NextResponse.json(
                    { error: "User session expired or invalid" },
                    { status: 401 }
                );
            }
        }

        /* ======================================================
           NO SESSION
        ====================================================== */
        return NextResponse.json(
            { error: "No active session found" },
            { status: 401 }
        );

    } catch (error) {
        console.error("[AUTH /me] UNHANDLED ERROR:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
