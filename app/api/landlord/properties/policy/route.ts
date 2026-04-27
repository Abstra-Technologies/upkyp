import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionUser();
        if (!session || session.userType !== "landlord") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const property_id = searchParams.get("property_id");

        if (!property_id) {
            return NextResponse.json({ error: "Missing property_id" }, { status: 400 });
        }

        const [ownership]: any = await db.query(
            `SELECT property_id FROM Property WHERE property_id = ? AND landlord_id = ?`,
            [property_id, session.landlord_id]
        );

        if (!ownership.length) {
            return NextResponse.json({ error: "Unauthorized property access" }, { status: 403 });
        }

        const [rows]: any = await db.query(
            `SELECT house_policy FROM Property WHERE property_id = ?`,
            [property_id]
        );

        return NextResponse.json({ policy: rows?.[0]?.house_policy || "" });
    } catch (error) {
        console.error("[POLICY_GET_ERROR]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionUser();
        if (!session || session.userType !== "landlord") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { property_id, policy } = await req.json();

        if (!property_id) {
            return NextResponse.json({ error: "Missing property_id" }, { status: 400 });
        }

        const [ownership]: any = await db.query(
            `SELECT property_id FROM Property WHERE property_id = ? AND landlord_id = ?`,
            [property_id, session.landlord_id]
        );

        if (!ownership.length) {
            return NextResponse.json({ error: "Unauthorized property access" }, { status: 403 });
        }

        await db.query(
            `UPDATE Property SET house_policy = ? WHERE property_id = ?`,
            [policy, property_id]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[POLICY_POST_ERROR]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
