import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import webpush from "web-push";
import { db } from "@/lib/db";
import { encryptData } from "@/crypto/encrypt";

const s3 = new S3Client({
    region: process.env.NEXT_AWS_REGION!,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

// --- Web Push (VAPID) ---
webpush.setVapidDetails(
    "mailto:support@upkyp.com",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

function sanitizeFilename(filename: string) {
    return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

function encryptDataString(data: string) {
    return JSON.stringify(encryptData(data, process.env.ENCRYPTION_SECRET!));
}

async function uploadToS3(file: File, folder: string) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const safeName = sanitizeFilename(file.name);
    const key = `${folder}/${Date.now()}_${safeName}`;

    await s3.send(
        new PutObjectCommand({
            Bucket: process.env.NEXT_S3_BUCKET_NAME!,
            Key: key,
            Body: buffer,
            ContentType: file.type,
        })
    );

    const url = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${key}`;
    return encryptDataString(url);
}

// landlord lookup
async function getLandlordUserIdByAgreement(connection: any, agreementId: string | number) {
    const [rows]: any = await connection.query(
        `
            SELECT u.user_id
            FROM LeaseAgreement la
                     JOIN Unit un ON un.unit_id = la.unit_id
                     JOIN Property p ON p.property_id = un.property_id
                     JOIN Landlord l ON l.landlord_id = p.landlord_id
                     JOIN User u ON u.user_id = l.user_id
            WHERE la.agreement_id = ?
            LIMIT 1
        `,
        [agreementId]
    );
    return rows?.[0]?.user_id || null;
}

async function sendWebPushToUser(connection: any, userId: string, payload: any) {
    const [subs]: any = await connection.query(
        `SELECT id, endpoint, p256dh, auth FROM user_push_subscriptions WHERE user_id = ?`,
        [userId]
    );

    const jsonPayload = JSON.stringify(payload);

    await Promise.all(
        subs.map(async (s: any) => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: s.endpoint,
                        keys: { p256dh: s.p256dh, auth: s.auth },
                    },
                    jsonPayload
                );
            } catch (err: any) {
                if (err?.statusCode === 404 || err?.statusCode === 410) {
                    await connection.query(`DELETE FROM user_push_subscriptions WHERE id = ?`, [s.id]);
                } else {
                    console.warn("Web push send failed:", err?.statusCode || err?.message);
                }
            }
        })
    );
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const agreement_id = formData.get("agreement_id")?.toString();
        const paymentMethod = formData.get("paymentMethod")?.toString();
        const amountPaid = parseFloat(formData.get("amountPaid")?.toString() || "0");
        const paymentType = formData.get("paymentType")?.toString();
        const billingId = formData.get("billingId")?.toString() || null;
        const proofFile = formData.get("proof") as File | null;

        if (!agreement_id || !paymentMethod || !amountPaid || !paymentType) {
            return NextResponse.json(
                { error: "Missing required fields", received: { agreement_id, paymentMethod, amountPaid, paymentType } },
                { status: 400 }
            );
        }

        if (!["billing", "security_deposit", "advance_rent"].includes(paymentType)) {
            return NextResponse.json(
                { error: "Invalid payment type", allowed: ["billing", "security_deposit", "advance_rent"] },
                { status: 400 }
            );
        }

        const receiptRef = `PAY-${agreement_id}-${paymentType.toUpperCase()}-${Date.now()}`;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [existing]: any = await connection.query(
                "SELECT payment_id FROM Payment WHERE receipt_reference = ? LIMIT 1",
                [receiptRef]
            );
            if (existing.length > 0) {
                await connection.rollback();
                return NextResponse.json({ message: "Duplicate payment detected, ignored." }, { status: 200 });
            }

            let proofUrl: string | null = null;
            if (proofFile && proofFile.size > 0) {
                proofUrl = await uploadToS3(proofFile, "proofOfPayment");
            }

            // ✅ Check if billingId is valid (avoid FK error)
            if (billingId) {
                const [billCheck]: any = await connection.query(
                    "SELECT billing_id FROM Billing WHERE billing_id = ? LIMIT 1",
                    [billingId]
                );
                if (billCheck.length === 0) {
                    await connection.rollback();
                    return NextResponse.json(
                        { error: `Invalid billingId: ${billingId} does not exist in Billing table.` },
                        { status: 400 }
                    );
                }
            }

            // ✅ FIXED: include bill_id in INSERT
            const [result]: any = await connection.query(
                `
        INSERT INTO Payment
        (agreement_id, bill_id, payment_type, amount_paid, payment_method_id,
         payment_status, proof_of_payment, receipt_reference,
         created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, NOW(), NOW())
        `,
                [agreement_id, billingId || null, paymentType, amountPaid, 9, proofUrl, receiptRef]
            );

            // Update Billing → unpaid
            if (billingId) {
                await connection.query(
                    `UPDATE Billing SET status = 'unpaid', updated_at = NOW() WHERE billing_id = ? AND lease_id = ?`,
                    [billingId, agreement_id]
                );
            }

            // landlord notifications
            const landlordUserId = await getLandlordUserIdByAgreement(connection, agreement_id);
            if (landlordUserId) {
                await connection.query(
                    `INSERT INTO Notification (user_id, title, body, url, is_read, created_at)
                     VALUES (?, ?, ?, ?, 0, NOW())`,
                    [
                        landlordUserId,
                        "New payment proof uploaded",
                        `A tenant submitted a payment proof for agreement #${agreement_id}. Receipt: ${receiptRef}.`,
                        billingId ? `/landlord/billing/${billingId}` : `/landlord/billing`,
                    ]
                );
            }

            await connection.commit();

            // 🔔 Push after commit
            if (landlordUserId) {
                await sendWebPushToUser(connection, landlordUserId, {
                    title: "Payment proof uploaded",
                    body: billingId
                        ? `A tenant uploaded proof for Billing #${billingId}. Status set to "Unpaid" pending review.`
                        : `A tenant uploaded a payment proof. Please review.`,
                    url: billingId ? `/landlord/billing/${billingId}` : `/landlord/billing`,
                    tag: `payment-proof-${receiptRef}`,
                    data: { receiptRef, agreement_id, billingId },
                });
            }

            return NextResponse.json(
                {
                    success: true,
                    message: "Payment proof uploaded. Billing set to UNPAID and landlord notified.",
                    paymentId: result.insertId,
                    receiptReference: receiptRef,
                },
                { status: 201 }
            );
        } catch (err: any) {
            await connection.rollback();
            console.error("❌ DB Transaction Error:", err);
            return NextResponse.json({ error: "Database transaction failed", details: err.message }, { status: 500 });
        } finally {
            connection.release();
        }
    } catch (err: any) {
        console.error("❌ Upload error:", err);
        return NextResponse.json({ error: "Upload failed", details: err.message }, { status: 500 });
    }
}
