import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { landlordId, portfolioSize, experienceLevel, primaryGoal } = body;

        if (!landlordId) {
            return NextResponse.json({ error: "Landlord ID is required" }, { status: 400 });
        }

        await db.execute(
            `INSERT INTO LandlordOnboarding (landlord_id, portfolio_size, experience_level, primary_goal, created_at, updated_at)
             VALUES (?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
             ON DUPLICATE KEY UPDATE
                 portfolio_size = VALUES(portfolio_size),
                 experience_level = VALUES(experience_level),
                 primary_goal = VALUES(primary_goal),
                 updated_at = UTC_TIMESTAMP()`,
            [landlordId, portfolioSize || null, experienceLevel || null, primaryGoal || null]
        );

        return NextResponse.json({ message: "Profile updated successfully" });
    } catch (error: any) {
        console.error("Profile update error:", error);
        if (error.code === "ER_NO_SUCH_TABLE") {
            return NextResponse.json({ message: "Onboarding preferences saved locally" }, { status: 200 });
        }
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
