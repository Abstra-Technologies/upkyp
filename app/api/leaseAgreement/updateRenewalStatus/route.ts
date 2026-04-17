import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateLeaseId } from "@/utils/id_generator";
import webpush from "web-push";

export const dynamic = "force-dynamic";

// ✅ Setup Web Push
webpush.setVapidDetails(
    "mailto:support@upkyp.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export async function PUT(req: NextRequest) {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const { id, status } = await req.json();

        if (!id || !status) {
            await connection.rollback();
            connection.release();
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // ✅ Fetch the renewal request first
        const [renewalRows]: any = await connection.query(
            `SELECT * FROM RenewalRequest WHERE id = ? FOR UPDATE`,
            [id]
        );

        if (!renewalRows || renewalRows.length === 0) {
            await connection.rollback();
            connection.release();
            return NextResponse.json({ error: "Renewal not found" }, { status: 404 });
        }

        const renewal = renewalRows[0];

        // ✅ Check if already processed (idempotency)
        if (["approved", "declined"].includes(renewal.status)) {
            await connection.rollback();
            connection.release();
            return NextResponse.json({
                success: true,
                message: `Renewal already ${renewal.status}`,
            });
        }

        // ✅ Update renewal request status
        await connection.query(
            `UPDATE RenewalRequest SET status = ?, updated_at = NOW() WHERE id = ?`,
            [status, id]
        );

        // ✅ If landlord approved
        if (status === "approved") {
            // Expire old lease
            await connection.query(
                `UPDATE LeaseAgreement SET status = 'expired' WHERE agreement_id = ?`,
                [renewal.agreement_id]
            );

            // Fetch the old lease
            const [oldLeaseData]: any = await connection.query(
                `SELECT * FROM LeaseAgreement WHERE agreement_id = ?`,
                [renewal.agreement_id]
            );

            const oldLease = oldLeaseData[0];
            if (!oldLease) throw new Error("Old lease not found");

            // ✅ Generate unique Lease ID (ensure no collision)
            let newLeaseId = generateLeaseId();
            let [exists]: any = await connection.query(
                `SELECT agreement_id FROM LeaseAgreement WHERE agreement_id = ?`,
                [newLeaseId]
            );
            let retryCount = 0;
            while (exists.length > 0 && retryCount < 5) {
                newLeaseId = generateLeaseId();
                [exists] = await connection.query(
                    `SELECT agreement_id FROM LeaseAgreement WHERE agreement_id = ?`,
                    [newLeaseId]
                );
                retryCount++;
            }
            if (exists.length > 0)
                throw new Error("Failed to generate unique lease ID after retries.");
            await connection.query(
                `
        INSERT INTO LeaseAgreement (
          agreement_id,
          is_renewal_of,
          tenant_id,
          unit_id,
          start_date,
          end_date,
          status,
          security_deposit_amount,
          advance_payment_amount,
          billing_due_day,
          grace_period_days,
          late_penalty_amount,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
                [
                    newLeaseId,
                    oldLease.agreement_id,
                    renewal.tenant_id,
                    renewal.unit_id,
                    renewal.requested_start_date,
                    renewal.requested_end_date,
                    "active",
                    oldLease.security_deposit_amount || 0,
                    oldLease.advance_payment_amount || 0,
                    oldLease.billing_due_day || 1,
                    oldLease.grace_period_days || 3,
                    oldLease.late_penalty_amount || 1000.0,
                ]
            );

            // ✅ Fetch tenant for notification
            const [tenantUser]: any = await connection.query(
                `
        SELECT U.user_id, U.firstName, U.lastName
        FROM Tenant T
        JOIN User U ON U.user_id = T.user_id
        WHERE T.tenant_id = ?
        `,
                [renewal.tenant_id]
            );

            if (tenantUser.length > 0) {
                const tenant = tenantUser[0];

                // ✅ Get all active push subscriptions for tenant
                const [subs]: any = await connection.query(
                    `SELECT * FROM user_push_subscriptions WHERE user_id = ?`,
                    [tenant.user_id]
                );

                const payload = JSON.stringify({
                    title: "Lease Renewal Approved 🎉",
                    body: `Your lease renewal for unit ${renewal.unit_id} has been approved.`,
                    url: `/tenant/leases/${newLeaseId}`,
                });

                for (const sub of subs) {
                    try {
                        await webpush.sendNotification(
                            {
                                endpoint: sub.endpoint,
                                keys: { p256dh: sub.p256dh, auth: sub.auth },
                            },
                            payload
                        );
                    } catch (err) {
                        console.warn("Failed to send push to tenant:", err.message);
                    }
                }

                // ✅ Also log notification into DB
                await connection.query(
                    `
          INSERT INTO Notification (user_id, title, body, url, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `,
                    [
                        tenant.user_id,
                        "Lease Renewal Approved 🎉",
                        `Your renewal for unit ${renewal.unit_id} was approved.`,
                        `/tenant/leases/${newLeaseId}`,
                    ]
                );
            }
        }

        await connection.commit();
        connection.release();

        return NextResponse.json({ success: true, status });
    } catch (err: any) {
        console.error("Error approving renewal:", err);
        await connection.rollback();
        connection.release();
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
