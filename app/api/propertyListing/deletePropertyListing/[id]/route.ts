import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth";
import { decryptData } from "@/crypto/encrypt";
import { deleteFromS3 } from "@/lib/s3";

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: propertyId } = await params;

    if (!propertyId) {
        return NextResponse.json(
            { error: "Property ID is required" },
            { status: 400 }
        );
    }

    const sessionUser = await getSessionUser();

    if (!sessionUser || !sessionUser.landlord_id) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    let connection;

    try {
        connection = await db.getConnection();

        const [propertyRows]: any = await connection.execute(
            `SELECT property_id, landlord_id FROM Property WHERE property_id = ?`,
            [propertyId]
        );

        if (propertyRows.length === 0) {
            return NextResponse.json(
                { error: "Property not found" },
                { status: 404 }
            );
        }

        if (propertyRows[0].landlord_id !== sessionUser.landlord_id) {
            return NextResponse.json(
                { error: "Forbidden - you do not own this property" },
                { status: 403 }
            );
        }

        const [activeLeases]: any = await connection.execute(
            `
            SELECT la.agreement_id
            FROM LeaseAgreement la
            JOIN Unit u ON la.unit_id = u.unit_id
            WHERE u.property_id = ? AND la.status = 'active'
            `,
            [propertyId]
        );

        if (activeLeases.length > 0) {
            return NextResponse.json(
                { error: "Cannot delete property with active leases" },
                { status: 400 }
            );
        }

        const [propertyPhotos]: any = await connection.execute(
            `SELECT photo_url FROM PropertyPhoto WHERE property_id = ?`,
            [propertyId]
        );

        const [unitPhotos]: any = await connection.execute(
            `
            SELECT up.photo_url
            FROM UnitPhoto up
            JOIN Unit u ON up.unit_id = u.unit_id
            WHERE u.property_id = ?
            `,
            [propertyId]
        );

        await connection.beginTransaction();

        await connection.execute(
            `DELETE FROM Property WHERE property_id = ?`,
            [propertyId]
        );

        await connection.commit();

        const allPhotos = [...propertyPhotos, ...unitPhotos];

        await Promise.allSettled(
            allPhotos.map((row) => {
                try {
                    const decryptedUrl = decryptData(
                        JSON.parse(row.photo_url),
                        encryptionSecret
                    );
                    return deleteFromS3(decryptedUrl);
                } catch (err) {
                    console.error("Failed to delete S3 file:", err);
                    return Promise.resolve();
                }
            })
        );

        await db.execute(
            `
            INSERT INTO ActivityLog (user_id, action, timestamp)
            VALUES (?, ?, NOW())
            `,
            [sessionUser.user_id, `Deleted Property: ${propertyId}`]
        );

        const cacheKey = `properties:landlord:${sessionUser.landlord_id}`;
        await redis.del(cacheKey);

        return NextResponse.json(
            { message: "Property and related data deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error deleting property:", error);

        return NextResponse.json(
            { error: "Failed to delete property" },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}