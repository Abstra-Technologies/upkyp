import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

type VerificationStatus =
    | "pending"
    | "approved"
    | "rejected"
    | "not verified";

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionUser();

        if (!session || session.userType !== "landlord") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const landlord_id = session.landlord_id;

        if (!landlord_id) {
            return NextResponse.json(
                { error: "Landlord not found" },
                { status: 404 }
            );
        }

        const [landlords]: any = await db.query(
            `SELECT is_verified FROM Landlord WHERE landlord_id = ? LIMIT 1`,
            [landlord_id]
        );

        if (!landlords.length) {
            return NextResponse.json(
                { error: "Landlord not found" },
                { status: 404 }
            );
        }

        if (landlords[0].is_verified === 1) {
            return NextResponse.json({ status: "approved" });
        }

        const [verifications]: any = await db.query(
            `
            SELECT status
            FROM LandlordVerification
            WHERE landlord_id = ?
            ORDER BY updated_at DESC
            LIMIT 1
            `,
            [landlord_id]
        );

        let status: VerificationStatus = "not verified";

        if (verifications.length) {
            status = verifications[0].status;
        }

        return NextResponse.json({ status });

    } catch (err) {
        console.error("[VERIFICATION_STATUS_ERROR]", err);

        return NextResponse.json(
            { error: "Failed to fetch verification status" },
            { status: 500 }
        );
    }
}
