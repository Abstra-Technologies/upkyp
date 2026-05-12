import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { uploadToS3 } from "@/lib/s3";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const { property_id } = await req.json();

        if (!property_id) {
            return NextResponse.json(
                { message: "property_id is required" },
                { status: 400 }
            );
        }

        // 1️⃣ Fetch units
        const [units]: any[] = await db.query(
            `
            SELECT
                unit_id,
                unit_name,
                qr_code_url
            FROM rentalley_db.Unit
            WHERE property_id = ?
              AND status != 'archived'
            `,
            [property_id]
        );

        if (!units || units.length === 0) {
            return NextResponse.json(
                { message: "No units found for this property" },
                { status: 404 }
            );
        }

        let generatedCount = 0;

        // 2️⃣ Generate QR only if missing
        for (const unit of units) {
            if (unit.qr_code_url) {
                // ✅ Already exists → skip
                continue;
            }

            const landingUrl = `${process.env.APP_URL}/unit/${unit.unit_id}/qr`;

            const qrBuffer = await QRCode.toBuffer(landingUrl, {
                type: "png",
                width: 500,
                margin: 2,
                errorCorrectionLevel: "H",
            });

            const s3Key = `unit-qr-codes/${property_id}/${unit.unit_id}/qr.png`;

            const qrUrl = await uploadToS3(
                qrBuffer,
                s3Key,
                "image/png"
            );

            await db.query(
                `
                UPDATE rentalley_db.Unit
                SET qr_code_url = ?
                WHERE unit_id = ?
                `,
                [qrUrl, unit.unit_id]
            );

            generatedCount++;
        }

        return NextResponse.json({
            success: true,
            generated: generatedCount,
            skipped: units.length - generatedCount,
        });
    } catch (error) {
        console.error("❌ QR generation failed:", error);
        return NextResponse.json(
            { message: "Failed to generate QR codes" },
            { status: 500 }
        );
    }
}
