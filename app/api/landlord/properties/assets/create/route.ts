import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";
import { generatAssetsId } from "@/utils/id_generator";
import QRCode from "qrcode"; // npm install qrcode

function buildAssetId(property_id: string): string {
    const suffix = property_id.slice(-4);
    const baseId = generatAssetsId();
    return `${baseId}${suffix}`;
}

export async function POST(req: NextRequest) {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const formData = await req.formData();

        const property_id = formData.get("property_id") as string;
        const asset_name = formData.get("asset_name") as string;

        if (!property_id || !asset_name) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // ✅ Upload any asset images (optional)
        const uploadedFiles = formData.getAll("images") as File[];
        const imageUrls: string[] = [];

        for (const file of uploadedFiles) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const url = await uploadToS3(
                buffer,
                file.name,
                file.type,
                `propertyAssets/${property_id}`
            );
            imageUrls.push(url);
        }

        // ✅ Generate asset ID
        const asset_id = buildAssetId(property_id);

        // ✅ QR Code represents the ASSET itself, not its image
        // It links to your platform’s asset view page
        const qrValue = `${process.env.NEXT_PUBLIC_BASE_URL}/landlord/properties/${property_id}/assets/${asset_id}`;
        const qrCodeBuffer = await QRCode.toBuffer(qrValue, {
            width: 300,
            margin: 1,
        });

        // ✅ Upload QR Code to S3
        const qrFileName = `QR-${asset_id}.png`;
        const qrCodeUrl = await uploadToS3(
            qrCodeBuffer,
            qrFileName,
            "image/png",
            `propertyAssets/${property_id}/qrCodes`
        );

        // ✅ Collect other fields
        const category = formData.get("category");
        const model = formData.get("model");
        const manufacturer = formData.get("manufacturer");
        const serial_number = formData.get("serial_number");
        const description = formData.get("description");
        const purchase_date = formData.get("purchase_date");
        const warranty_expiry = formData.get("warranty_expiry");
        const unit_id = formData.get("unit_id");
        const status = formData.get("status") || "active";
        const condition = formData.get("condition") || "good";

        // ✅ Insert asset record
        await connection.query(
            `
      INSERT INTO rentalley_db.Asset
      (asset_id, property_id, unit_id, asset_name, category, model, manufacturer,
       serial_number, description, purchase_date, warranty_expiry, status, \`condition\`, image_urls, qr_code_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
            [
                asset_id,
                property_id,
                unit_id || null,
                asset_name,
                category,
                model,
                manufacturer,
                serial_number,
                description,
                purchase_date,
                warranty_expiry,
                status,
                condition,
                JSON.stringify(imageUrls),
                qrCodeUrl,
            ]
        );

        await connection.commit();
        await connection.release();

        return NextResponse.json({
            message: "Asset created successfully with QR code",
            asset_id,
            qr_code_url: qrCodeUrl,
            asset_qr_value: qrValue,
        });
    } catch (error: any) {
        console.error("❌ Asset Creation Error:", error);
        await connection.rollback();
        await connection.release();
        return NextResponse.json(
            { error: "Failed to create asset." },
            { status: 500 }
        );
    }
}
