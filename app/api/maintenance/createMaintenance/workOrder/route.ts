//  use case: whan landlord is the one who created the order.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { generateMaintenanceId } from "@/utils/id_generator";
import { uploadToS3 } from "@/lib/s3";
import { encryptData } from "@/crypto/encrypt";
import { getSessionUser } from "@/lib/auth/auth";

export async function POST(req: Request) {
    const session = await getSessionUser();

    if (!session || !session.landlord_id) {
        return NextResponse.json(
            { success: false, message: "Unauthorized." },
            { status: 401 }
        );
    }

    const landlord_id = session.landlord_id;

    const connection = await db.getConnection();

    try {
        const body = await req.json();

        const {
            subject,
            category,
            priority_level,
            description,
            property_id,
            unit_id,
            lease_id: providedLeaseId,
            asset_id,
            assigned_to,
            photo_urls,
            status: requestedStatus,
        } = body;

        if (!subject || !property_id) {
            return NextResponse.json(
                { success: false, message: "Missing required fields." },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        let lease_id = providedLeaseId || null;

        if (unit_id && !lease_id) {
            const [[activeLease]]: any = await connection.query(
                `SELECT agreement_id FROM LeaseAgreement
                 WHERE unit_id = ? AND status = 'active'
                 LIMIT 1`,
                [unit_id]
            );
            if (activeLease?.agreement_id) {
                lease_id = activeLease.agreement_id;
            }
        }

        const request_id = generateMaintenanceId();

        const finalStatus = requestedStatus || (lease_id ? "pending" : "approved");

        await connection.query(
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
            ]
        );

        if (Array.isArray(photo_urls) && photo_urls.length > 0) {
            for (const base64 of photo_urls) {
                if (!base64) continue;

                const matches = base64.match(/^data:(.+);base64,(.+)$/);
                if (!matches) continue;

                const mimeType = matches[1];
                const buffer = Buffer.from(matches[2], "base64");

                const extension = mimeType.split("/")[1] || "jpg";
                const fileName = `${Date.now()}.${extension}`;
                const key = `${landlord_id}/${property_id}/${process.env.NEXT_AWS_MAINTENANCE_PHOTO}/${request_id}/${fileName}`;

                const s3Url = await uploadToS3(buffer, key, mimeType);
                const encryptedUrl = JSON.stringify(encryptData(s3Url, process.env.ENCRYPTION_SECRET!));

                await connection.query(
                    `
                    INSERT INTO MaintenancePhoto (
                        request_id,
                        photo_url,
                        created_at
                    )
                    VALUES (?, ?, NOW())
                    `,
                    [request_id, encryptedUrl]
                );
            }
        }

        await connection.query(
            `
            INSERT INTO ActivityLog (user_id, action, timestamp)
            VALUES (?, ?, NOW())
            `,
            [session.user_id, `Created new work order ${request_id}`]
        );

        await connection.commit();

        try {
            await redis.del(`maintenance:requests:${landlord_id}`);
        } catch (cacheError) {
            console.warn("Failed to invalidate cache:", cacheError);
        }

        let property_name = null;
        let unit_name = null;

        try {
            const [propertyRows]: any = await db.query(
                `SELECT property_name FROM Property WHERE property_id = ?`,
                [property_id]
            );
            if (propertyRows.length > 0) {
                property_name = propertyRows[0].property_name;
            }

            if (unit_id) {
                const [unitRows]: any = await db.query(
                    `SELECT unit_name FROM Unit WHERE unit_id = ?`,
                    [unit_id]
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
        await connection.rollback();
        console.error("Error creating work order:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Internal server error",
                error: error.message ?? error,
            },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
