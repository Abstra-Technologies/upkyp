import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";
import { createHmac, randomBytes } from "crypto";

function generateApiKey(): string {
    return `upkyp_${randomBytes(24).toString("hex")}`;
}

function generateSecretKey(): string {
    return randomBytes(32).toString("hex");
}

function hashSecretKey(secretKey: string): string {
    return createHmac("sha256", process.env.JWT_SECRET || "upkyp-secret")
        .update(secretKey)
        .digest("hex");
}

export async function POST(req: NextRequest) {
    let connection: any;

    try {
        const session = await getSessionUser();

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized. Please log in." },
                { status: 401 }
            );
        }

        if (session.userType !== "landlord" && session.userType !== "admin") {
            return NextResponse.json(
                { error: "Only landlords or admins can generate API keys." },
                { status: 403 }
            );
        }

        if (!session.landlord_id && session.userType === "landlord") {
            return NextResponse.json(
                { error: "Landlord profile not found." },
                { status: 404 }
            );
        }

        const body = await req.json();
        const { name, environment } = body;

        const validEnvironments = ["test", "live"];
        const env = validEnvironments.includes(environment) ? environment : "live";

        const api_key = generateApiKey();
        const secret_key = generateSecretKey();
        const secret_key_hash = hashSecretKey(secret_key);

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [result]: any = await connection.query(
            `
            INSERT INTO ApiKey
            (
                user_id,
                landlord_id,
                api_key,
                secret_key_hash,
                name,
                environment,
                is_active,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, 1, NOW())
            `,
            [
                session.user_id,
                session.landlord_id || null,
                api_key,
                secret_key_hash,
                name || null,
                env,
            ]
        );

        await connection.commit();

        return NextResponse.json(
            {
                success: true,
                message: "API keys generated successfully.",
                data: {
                    api_key_id: result.insertId,
                    api_key,
                    secret_key,
                    name: name || null,
                    environment: env,
                    created_at: new Date().toISOString(),
                },
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Generate API keys error:", error);
        if (connection) await connection.rollback();

        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionUser();

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized. Please log in." },
                { status: 401 }
            );
        }

        if (session.userType !== "landlord" && session.userType !== "admin") {
            return NextResponse.json(
                { error: "Only landlords or admins can view API keys." },
                { status: 403 }
            );
        }

        let query = `
            SELECT 
                api_key_id,
                api_key,
                name,
                environment,
                is_active,
                last_used_at,
                created_at,
                revoked_at
            FROM ApiKey
            WHERE user_id = ?
        `;
        const params: any[] = [session.user_id];

        if (session.userType === "landlord" && session.landlord_id) {
            query += " AND landlord_id = ?";
            params.push(session.landlord_id);
        }

        query += " ORDER BY created_at DESC";

        const [keys]: any = await db.query(query, params);

        const maskedKeys = keys.map((key: any) => ({
            api_key_id: key.api_key_id,
            api_key: key.api_key.substring(0, 12) + "...",
            name: key.name,
            environment: key.environment,
            is_active: !!key.is_active,
            last_used_at: key.last_used_at,
            created_at: key.created_at,
            revoked_at: key.revoked_at,
        }));

        return NextResponse.json(
            { success: true, data: maskedKeys },
            { status: 200 }
        );

    } catch (error) {
        console.error("Get API keys error:", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}
