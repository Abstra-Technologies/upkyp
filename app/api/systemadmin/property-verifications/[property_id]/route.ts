import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";

const SECRET = process.env.ENCRYPTION_SECRET!;

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ property_id: string }> }
) {
    const { property_id } = await params;

    if (!property_id) {
        return NextResponse.json(
            { message: "Property ID is required." },
            { status: 400 }
        );
    }

    try {
        const [propertyRows] = await db.query<any[]>(
            `SELECT property_id, landlord_id, property_name, property_type, property_subtype,
                    amenities, street, brgy_district, city, province, zip_code
             FROM Property
             WHERE property_id = ?
             LIMIT 1`,
            [property_id]
        );

        if (!propertyRows || propertyRows.length === 0) {
            return NextResponse.json(
                { message: "Property not found" },
                { status: 404 }
            );
        }

        const [verificationRows] = await db.query<any[]>(
            `SELECT *
             FROM PropertyVerification
             WHERE property_id = ?
             ORDER BY created_at DESC
             LIMIT 1`,
            [property_id]
        );

        const verification =
            verificationRows.length > 0
                ? {
                    ...verificationRows[0],
                    submitted_doc: verificationRows[0].submitted_doc
                        ? decryptData(
                            JSON.parse(verificationRows[0].submitted_doc),
                            SECRET
                        )
                        : null,
                }
                : null;

        return NextResponse.json({
            property: propertyRows[0],
            verification,
        });
    } catch (error: any) {
        console.error("[GET PROPERTY VERIFICATION DETAILS]", error);
        return NextResponse.json(
            { message: "Database error", error: error.message },
            { status: 500 }
        );
    }
}
