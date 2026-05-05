import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agreementId = searchParams.get("agreement_id");

  if (!agreementId) {
    return NextResponse.json(
      { message: "Agreement ID is required" },
      { status: 400 },
    );
  }

  try {
    const [maintenanceRequests] = await db.query(
      `SELECT m.*, u.unit_name, p.property_name
       FROM MaintenanceRequest m
       LEFT JOIN Unit u ON m.unit_id = u.unit_id
       LEFT JOIN Property p ON u.property_id = p.property_id
       WHERE m.lease_id = ?
       ORDER BY m.created_at DESC`,
      [agreementId],
    );

    for (const request of maintenanceRequests as any[]) {
      const [photos] = await db.query(
        `SELECT photo_url FROM MaintenancePhoto WHERE request_id = ?`,
        [request.request_id],
      );

      request.photos = (photos as any[]).length
        ? (photos as any[])
            .map((photo: any) => {
              try {
                const parsed = JSON.parse(photo.photo_url);
                return decryptData(parsed, process.env.ENCRYPTION_SECRET!);
              } catch (err) {
                console.error("Failed to decrypt photo:", err);
                return null;
              }
            })
            .filter(Boolean)
        : [];
    }

    return NextResponse.json(maintenanceRequests, { status: 200 });
  } catch (error) {
    console.error("Error fetching maintenance requests:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
