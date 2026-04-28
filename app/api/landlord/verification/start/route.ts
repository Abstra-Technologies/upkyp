import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import axios from "axios";
import { getSessionUser } from "@/lib/auth/auth";

export async function POST(req: NextRequest) {
    try {
        console.log("=== DIDIT VERIFICATION START ===");

        const session = await getSessionUser();

        if (!session || session.userType !== "landlord") {
            console.warn("Unauthorized access attempt");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const landlord_id = session.landlord_id;

        if (!landlord_id) {
            console.warn(`No landlord_id for user: ${session.user_id}`);
            return NextResponse.json({ error: "Landlord profile not found" }, { status: 404 });
        }

        const [rows]: any[] = await db.query(
            `SELECT is_verified FROM Landlord WHERE landlord_id = ? LIMIT 1`,
            [landlord_id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: "Landlord profile not found" }, { status: 404 });
        }

        if (rows[0].is_verified === 1) {
            return NextResponse.json({ error: "Identity already verified" }, { status: 400 });
        }

        if (!process.env.DIDDIT_API_KEY || !process.env.DIDDIT_WORKFLOW_ID) {
            console.error("Missing DIDIT API key or workflow ID in environment");
            return NextResponse.json(
                { error: "Server configuration error – please contact support" },
                { status: 500 }
            );
        }

        const diditRes = await axios.post(
            "https://verification.didit.me/v3/session/",
            {
                workflow_id: process.env.DIDDIT_WORKFLOW_ID,
                vendor_data: String(landlord_id),
                callback: process.env.DIDDIT_REDIRECT_URL,
            },
            {
                headers: {
                    "X-Api-Key": process.env.DIDDIT_API_KEY,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                timeout: 15000,
            }
        );

        const data = diditRes.data;

        const redirect_url = data.url;
        const verification_session_id = data.session_id;

        if (!redirect_url || !verification_session_id) {
            console.error("Didit response missing required fields", {
                status: diditRes.status,
                responseData: data,
            });
            throw new Error("Invalid response from Didit verification service");
        }

        await db.query(
            `
            INSERT INTO LandlordVerification 
                (landlord_id, didit_session_id, status, created_at)
            VALUES (?, ?, 'pending', NOW())
            ON DUPLICATE KEY UPDATE
                status = 'pending',
                didit_session_id = VALUES(didit_session_id),
                updated_at = NOW()
            `,
            [landlord_id, verification_session_id]
        );

        console.log(`Verification session created – landlord: ${landlord_id}, session: ${verification_session_id}`);

        return NextResponse.json({ redirect_url });

    } catch (err: any) {
        console.error("[DIDIT_VERIFICATION_START_FAILED]", {
            message: err.message,
            status: err.response?.status,
            diditError: err.response?.data || null,
            stack: err.stack?.split("\n").slice(0, 3).join("\n"),
        });

        let clientMessage = "Failed to initiate identity verification";
        let statusCode = 500;

        if (err.response) {
            const { status } = err.response;
            if (status === 401 || status === 403) {
                clientMessage = "Authentication failed with verification provider";
                statusCode = 502;
            } else if (status === 429) {
                clientMessage = "Rate limit reached – please try again in a minute";
                statusCode = 429;
            }
        }

        return NextResponse.json({ error: clientMessage }, { status: statusCode });
    }
}
