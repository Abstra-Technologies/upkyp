import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { decryptData } from "@/crypto/encrypt";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const property_id = searchParams.get("property_id");
    const unit_id = searchParams.get("unit_id");

    let connection;

    try {
        connection = await db.getConnection();

        let query = `
      SELECT
          u.unit_id,
          u.property_id,
          u.unit_name,
          u.unit_size,
          u.unit_style,
          u.rent_amount,
          u.furnish,
          u.amenities,
          u.publish,
          u.qr_code_url,          -- 🆕
          u.qr_enabled,           -- 🆕
          u.qr_claim_enabled,
          u.status AS unit_status, 
          DATE_FORMAT(u.updated_at, '%Y-%m-%d %H:%i:%s') AS last_updated,
          la.agreement_id AS lease_agreement_id,
          la.start_date,
          la.end_date,
          la.billing_due_day,
          la.status AS lease_status,
          usr.firstName AS enc_firstName,
          usr.lastName AS enc_lastName
      FROM Unit u
      LEFT JOIN LeaseAgreement la 
        ON la.unit_id = u.unit_id 
        AND la.status IN ('active', 'completed', 'pending') -- optional context
      LEFT JOIN Tenant t 
        ON la.tenant_id = t.tenant_id
      LEFT JOIN User usr 
        ON t.user_id = usr.user_id
      WHERE 1=1
    `;

        const params: any[] = [];

        if (unit_id) {
            query += ` AND u.unit_id = ?`;
            params.push(unit_id);
        }

        if (property_id) {
            query += ` AND u.property_id = ?`;
            params.push(property_id);
        }

        query += ` ORDER BY u.created_at DESC`;

        const [rows] = await connection.execute(query, params);
        const result: any[] = [];

        for (const row of rows as any[]) {
            const decryptedRow = { ...row };
            let tenant_name = null;

            try {
                if (row.enc_firstName) {
                    const parsedFirst = JSON.parse(row.enc_firstName);
                    decryptedRow.enc_firstName = decryptData(parsedFirst, process.env.ENCRYPTION_SECRET);
                }

                if (row.enc_lastName) {
                    const parsedLast = JSON.parse(row.enc_lastName);
                    decryptedRow.enc_lastName = decryptData(parsedLast, process.env.ENCRYPTION_SECRET);
                }

                if (decryptedRow.enc_firstName || decryptedRow.enc_lastName) {
                    tenant_name = `${decryptedRow.enc_firstName || ""} ${decryptedRow.enc_lastName || ""}`.trim();
                }
            } catch (decryptionError) {
                console.error(`Decryption failed for unit ID ${row.unit_id}:`, decryptionError);
                decryptedRow.enc_firstName = null;
                decryptedRow.enc_lastName = null;
                tenant_name = null;
            }

            let unitPhotos: string[] = [];
            try {
                const [photoRows]: any = await connection.execute(
                    `SELECT photo_url FROM UnitPhoto WHERE unit_id = ? ORDER BY id ASC LIMIT 1`,
                    [row.unit_id]
                );
                if (photoRows && photoRows.length > 0) {
                    const secret = process.env.ENCRYPTION_SECRET;
                    if (secret) {
                        for (const photoRow of photoRows) {
                            try {
                                if (photoRow.photo_url) {
                                    const parsed = JSON.parse(photoRow.photo_url);
                                    const decrypted = decryptData(parsed as any, secret) as string | null;
                                    if (decrypted) unitPhotos.push(decrypted);
                                }
                            } catch {
                                // skip unreadable photos
                            }
                        }
                    }
                }
            } catch {
                // skip photo errors
            }

            result.push({
                unit_id: row.unit_id,
                property_id: row.property_id,
                unit_name: row.unit_name,
                unit_size: row.unit_size,
                unit_style: row.unit_style,
                rent_amount: row.rent_amount,
                furnish: row.furnish,
                publish: row.publish,
                amenities: row.amenities,
                status: row.unit_status,
                last_updated: row.last_updated,
                lease_agreement_id: row.lease_agreement_id || null,
                lease_status: row.lease_status || null,
                start_date: row.start_date || null,
                end_date: row.end_date || null,
                billing_due_day: row.billing_due_day || null,
                tenant_name,

                qr_code_url: row.qr_code_url || null,
                qr_enabled: !!row.qr_enabled,
                qr_claim_enabled: !!row.qr_claim_enabled,
                unitPhotos,
            });
        }

        if (unit_id && result.length === 0) {
            return new Response(
                JSON.stringify({ error: "No Units found for this Property" }),
                { status: 404 }
            );
        }

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error fetching unit listings:", error);
        return new Response(
            JSON.stringify({ error: "Failed to fetch unit listings" }),
            { status: 500 }
        );
    } finally {
        if (connection) {
            connection.release();
        }
    }
}
