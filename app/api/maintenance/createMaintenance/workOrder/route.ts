import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { generateMaintenanceId } from "@/utils/id_generator";
import { uploadToS3 } from "@/lib/s3";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      subject,
      category,
      priority_level,
      description,
      landlord_id,
      property_id,
      unit_id,
      lease_id,
      asset_id,
      assigned_to,
      user_id,
      photo_urls,
      status: requestedStatus,
    } = body;

    if (!subject || !landlord_id || !property_id) {
      return NextResponse.json(
        { success: false, message: "Missing required fields." },
        { status: 400 },
      );
    }

    // Generate custom ID
    const request_id = generateMaintenanceId();

    // Determine status:
    // - If lease_id exists → tenant submitted → 'pending' (needs approval)
    // - If no lease_id → landlord created → 'approved' (ready to schedule)
    // - Allow override via requestedStatus if provided
    const finalStatus = requestedStatus || (lease_id ? "pending" : "approved");

    // Insert work order
    await db.query(
      `
            INSERT INTO MaintenanceRequest (
                request_id,
                lease_id,
                unit_id,
                asset_id,
                subject,
                description,
                status,
                category,
                priority_level,
                property_id,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `,
      [
        request_id,
        lease_id || null,
        unit_id || null,
        asset_id || null,
        subject,
        description || null,
        finalStatus,
        category || "General",
        priority_level || "Low",
        property_id,
      ],
    );

    // Handle photo uploads
    if (Array.isArray(photo_urls) && photo_urls.length > 0) {
      for (const base64 of photo_urls) {
        if (!base64) continue;

        const matches = base64.match(/^data:(.+);base64,(.+)$/);
        if (!matches) continue;

        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], "base64");

        const extension = mimeType.split("/")[1] || "jpg";
        const fileName = `${request_id}.${Date.now()}.${extension}`;

        const s3Url = await uploadToS3(
          buffer,
          fileName,
          mimeType,
          `maintenancePhoto/${request_id}`,
        );

        await db.query(
          `
                    INSERT INTO MaintenancePhoto (
                        request_id,
                        photo_url,
                        created_at
                    )
                    VALUES (?, ?, NOW())
                    `,
          [request_id, s3Url],
        );
      }
    }

    // Activity log
    await db.query(
      `
            INSERT INTO ActivityLog (user_id, action, timestamp)
            VALUES (?, ?, NOW())
            `,
      [user_id, `Created new work order ${request_id}`],
    );

    // Invalidate Redis cache so the list refreshes immediately
    try {
      await redis.del(`maintenance:requests:${landlord_id}`);
    } catch (cacheError) {
      console.warn("Failed to invalidate cache:", cacheError);
      // Non-fatal - continue
    }

    // Fetch property and unit names for response
    let property_name = null;
    let unit_name = null;

    try {
      const [propertyRows]: any = await db.query(
        `SELECT property_name FROM Property WHERE property_id = ?`,
        [property_id],
      );
      if (propertyRows.length > 0) {
        property_name = propertyRows[0].property_name;
      }

      if (unit_id) {
        const [unitRows]: any = await db.query(
          `SELECT unit_name FROM Unit WHERE unit_id = ?`,
          [unit_id],
        );
        if (unitRows.length > 0) {
          unit_name = unitRows[0].unit_name;
        }
      }
    } catch (lookupError) {
      console.warn("Failed to lookup property/unit names:", lookupError);
    }

    return NextResponse.json({
      success: true,
      message: "Work order created successfully.",
      data: {
        request_id,
        subject,
        category: category || "General",
        priority_level: priority_level || "Low",
        description: description || null,
        landlord_id,
        property_id,
        property_name,
        unit_id: unit_id || null,
        unit_name,
        lease_id: lease_id || null,
        asset_id: asset_id || null,
        assigned_to: assigned_to || null,
        status: finalStatus,
        created_at: new Date().toISOString(),
        photo_urls: [],
      },
    });
  } catch (error: any) {
    console.error("Error creating work order:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message ?? error,
      },
      { status: 500 },
    );
  }
}
