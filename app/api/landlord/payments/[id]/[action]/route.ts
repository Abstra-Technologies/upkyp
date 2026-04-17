import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { db } from "@/lib/db";

// --- Web Push Setup ---
webpush.setVapidDetails(
    "mailto:support@upkyp.com",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

// 🧩 Tenant lookup (agreement → tenant → user)
async function getTenantUserIdByAgreement(connection: any, agreementId: string | number) {
    const [rows]: any = await connection.query(
        `
            SELECT u.user_id
            FROM LeaseAgreement la
                     JOIN Tenant t ON t.tenant_id = la.tenant_id
                     JOIN User u ON u.user_id = t.user_id
            WHERE la.agreement_id = ?
            LIMIT 1
        `,
        [agreementId]
    );
    return rows?.[0]?.user_id || null;
}

// 🔔 Send web push to all user subscriptions
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
                    { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
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

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string; action: "approve" | "reject" } }
) {
    const { id, action } = params;
    const paymentId = parseInt(id);

    if (!paymentId || isNaN(paymentId)) {
        return NextResponse.json({ error: "Invalid payment ID" }, { status: 400 });
    }

    const validActions = { approve: "confirmed", reject: "failed" } as const;
    const newStatus = validActions[action];
    if (!newStatus) {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Get payment details
        const [rows]: any = await connection.query(
            `
                SELECT payment_id, agreement_id, payment_type, bill_id, receipt_reference
                FROM Payment
                WHERE payment_id = ?
                    FOR UPDATE
            `,
            [paymentId]
        );

        if (rows.length === 0) {
            await connection.rollback();
            return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        }

        const payment = rows[0];

        // 1️⃣ Update Payment status
        await connection.query(
            `UPDATE Payment SET payment_status = ?, updated_at = NOW() WHERE payment_id = ?`,
            [newStatus, paymentId]
        );

        // 2️⃣ If approved and initial payment → update lease flags
        if (action === "approve" && payment.payment_type === "initial_payment") {
            await connection.query(
                `
                    UPDATE LeaseAgreement
                    SET
                        is_security_deposit_paid = 1,
                        is_advance_payment_paid = 1,
                        updated_at = NOW()
                    WHERE agreement_id = ?
                `,
                [payment.agreement_id]
            );
        }

        // 3️⃣ Update Billing depending on result
        if (payment.bill_id) {
            if (action === "approve") {
                await connection.query(
                    `
                        UPDATE Billing
                        SET status = 'paid',
                            paid_at = COALESCE(paid_at, NOW()),
                            updated_at = NOW()
                        WHERE billing_id = ? AND lease_id = ?
                    `,
                    [payment.bill_id, payment.agreement_id]
                );
            } else {
                await connection.query(
                    `
                        UPDATE Billing
                        SET status = 'unpaid', updated_at = NOW()
                        WHERE billing_id = ? AND lease_id = ?
                    `,
                    [payment.bill_id, payment.agreement_id]
                );
            }
        }

        // 4️⃣ Find tenant user_id
        const tenantUserId = await getTenantUserIdByAgreement(connection, payment.agreement_id);

        // 5️⃣ Create in-app Notification for tenant
        if (tenantUserId) {
            const title =
                action === "approve" ? "Payment approved" : "Payment rejected";
            const body =
                action === "approve"
                    ? `Your payment for billing ${payment.bill_id || ""} has been approved and marked as paid.`
                    : `Your payment for billing ${payment.bill_id || ""} has been rejected. Please review or re-upload proof.`;

            const url = payment.bill_id
                ? `/tenant/billing/${payment.bill_id}`
                : `/tenant/billing`;

            await connection.query(
                `
                    INSERT INTO Notification (user_id, title, body, url, is_read, created_at)
                    VALUES (?, ?, ?, ?, 0, NOW())
                `,
                [tenantUserId, title, body, url]
            );
        }

        await connection.commit();

        // 6️⃣ Web Push to tenant (after commit)
        if (tenantUserId) {
            await sendWebPushToUser(connection, tenantUserId, {
                title: action === "approve" ? "Payment approved ✅" : "Payment rejected ❌",
                body:
                    action === "approve"
                        ? `Your payment${payment.bill_id ? ` for billing #${payment.bill_id}` : ""} has been approved and marked as PAID.`
                        : `Your payment${payment.bill_id ? ` for billing #${payment.bill_id}` : ""} has been rejected. Please re-upload proof if needed.`,
                url: payment.bill_id
                    ? `/tenant/billing/${payment.bill_id}`
                    : `/tenant/billing`,
                tag: `payment-${paymentId}-${action}`,
                data: {
                    paymentId,
                    action,
                    agreement_id: payment.agreement_id,
                    bill_id: payment.bill_id,
                    receipt_reference: payment.receipt_reference,
                },
            });
        }

        return NextResponse.json({
            message:
                action === "approve"
                    ? "Payment approved and marked paid. Tenant notified."
                    : "Payment rejected. Tenant notified.",
        });
    } catch (err: any) {
        await connection.rollback();
        console.error("❌ Payment update failed:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
