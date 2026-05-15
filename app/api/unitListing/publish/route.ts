import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidateTag } from "next/cache";

/**
 * @route   PUT /api/unitListing/publish
 * @desc    Toggle a unit's published visibility
 * @body    { unit_id: string, publish: boolean }
 */

export async function PUT(req: NextRequest) {
    try {
        const { unit_id, publish } = await req.json();

        /* ---------- VALIDATION ---------- */
        if (!unit_id || typeof publish !== "boolean") {
            return NextResponse.json(
                { success: false, message: "Missing or invalid parameters." },
                { status: 400 }
            );
        }

        /* ---------- GET PROPERTY ID ---------- */
        const [unitRows]: any = await db.execute(
            `SELECT property_id FROM rentalley_db.Unit WHERE unit_id = ?`,
            [unit_id]
        );

        if (!unitRows.length) {
            return NextResponse.json(
                { success: false, message: "Unit not found." },
                { status: 404 }
            );
        }

        const property_id = unitRows[0].property_id;

        /* ---------- CHECK PROPERTY VERIFICATION ---------- */
        if (publish) {
            const [propRows]: any = await db.execute(
                `SELECT p.landlord_id FROM rentalley_db.Property p WHERE p.property_id = ?`,
                [property_id]
            );

            const landlord_id = propRows[0]?.landlord_id;

            // Check if property is verified
            const [verificationRows]: any = await db.execute(
                `SELECT pv.status, pv.verified FROM rentalley_db.PropertyVerification pv 
                 WHERE pv.property_id = ? 
                 ORDER BY pv.verification_id DESC LIMIT 1`,
                [property_id]
            );

            const isVerified = verificationRows.length > 0 && verificationRows[0].verified === 1;

            if (!isVerified) {
                return NextResponse.json(
                    { 
                        success: false, 
                        message: "This property must be verified before publishing units. Please submit your property documents for verification.",
                        property_id,
                        needs_verification: true,
                    },
                    { status: 403 }
                );
            }

            // Check if landlord has TIN
            const [tinRows]: any = await db.execute(
                `SELECT tin_number FROM LandlordTaxProfile WHERE landlord_id = ? LIMIT 1`,
                [landlord_id]
            );

            if (!tinRows.length || !tinRows[0].tin_number) {
                return NextResponse.json(
                    { 
                        success: false, 
                        message: "Please set up your Tax Profile (TIN) before publishing units.",
                        needs_tin: true,
                    },
                    { status: 403 }
                );
            }
        }

        /* ---------- UPDATE UNIT ---------- */
        const [result]: any = await db.execute(
            `
      UPDATE rentalley_db.Unit
      SET publish = ?, updated_at = CURRENT_TIMESTAMP
      WHERE unit_id = ?
      `,
            [publish ? 1 : 0, unit_id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { success: false, message: "Unit not found or update failed." },
                { status: 404 }
            );
        }

        revalidateTag(`units-${property_id}`);
        revalidateTag("units-all");

        return NextResponse.json({
            success: true,
            message: publish
                ? "Unit successfully published."
                : "Unit successfully hidden.",
        });

    } catch (error: any) {
        console.error("🔥 Publish toggle failed:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Internal server error",
                error: error.message,
            },
            { status: 500 }
        );
    }
}
