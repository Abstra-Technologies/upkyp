import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/landlord/properties/assets/detailed?asset_id=ASSET123
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const asset_id = searchParams.get("asset_id");

    if (!asset_id) {
        return NextResponse.json(
            { error: "Missing asset_id parameter" },
            { status: 400 }
        );
    }

    try {
        // ✅ Fetch asset details + linked unit
        const [rows]: any = await db.query(
            `
      SELECT 
        a.asset_id,
        a.property_id,
        a.asset_name,
        a.category,
        a.model,
        a.manufacturer,
        a.serial_number,
        a.description,
        a.purchase_date,
        a.warranty_expiry,
        a.status,
        a.condition,
        a.unit_id,
        u.unit_name,
        a.image_urls,
        a.qr_code_url,
        a.created_at,
        a.updated_at
      FROM rentalley_db.Asset a
      LEFT JOIN rentalley_db.Unit u ON a.unit_id = u.unit_id
      WHERE a.asset_id = ?
      LIMIT 1
      `,
            [asset_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        const asset = rows[0];

        // ✅ Parse safe JSON values (avoid runtime crashes)
        let imageUrls: string[] = [];
        try {
            imageUrls =
                typeof asset.image_urls === "string"
                    ? JSON.parse(asset.image_urls)
                    : asset.image_urls || [];
        } catch {
            imageUrls = [];
        }

        return NextResponse.json({
            ...asset,
            image_urls: imageUrls,
            qr_code_url: asset.qr_code_url || null,
        });
    } catch (error: any) {
        console.error("❌ Asset Detailed API Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch asset details." },
            { status: 500 }
        );
    }
}
