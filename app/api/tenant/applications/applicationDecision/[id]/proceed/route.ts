import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import webpush from "web-push";
import { generateLeaseId } from "@/utils/id_generator";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
  "mailto:support@upkyp.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: prospectiveTenantId } = await params;
  const { decision } = await req.json();

  if (!["yes", "no"].includes(decision)) {
    return NextResponse.json(
      { error: "Invalid decision value. Must be 'yes' or 'no'." },
      { status: 400 },
    );
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // ✅ Verify approved prospective tenant
    const [rows]: any = await connection.query(
      `SELECT * FROM ProspectiveTenant WHERE id = ? AND status = 'approved'`,
      [prospectiveTenantId],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Application not found or not approved." },
        { status: 404 },
      );
    }

    const prospective = rows[0];
    const { unit_id: unitId, tenant_id: tenantId } = prospective;

    // ✅ Update ProspectiveTenant.proceeded
    await connection.query(
      `UPDATE ProspectiveTenant SET proceeded = ? WHERE id = ?`,
      [decision, prospectiveTenantId],
    );

    // ✅ Fetch landlord + property info
    const [landlordRows]: any = await connection.query(
      `
      SELECT 
        l.user_id AS landlord_user_id, 
        p.property_id, p.property_name, 
        u.unit_id, u.unit_name
      FROM Unit u
      JOIN Property p ON u.property_id = p.property_id
      JOIN Landlord l ON p.landlord_id = l.landlord_id
      WHERE u.unit_id = ?
      `,
      [unitId],
    );

    if (!landlordRows.length) {
      return NextResponse.json(
        { error: "Landlord or property not found." },
        { status: 404 },
      );
    }

    const { landlord_user_id, property_name, property_id, unit_name } =
      landlordRows[0];

    const url = `/landlord/properties/${property_id}/activeLease`;
    let notifTitle = "";
    let notifBody = "";

    // ✅ Tenant proceeds with lease
    if (decision === "yes") {
      notifTitle = `Tenant Proceeded - ${property_name} (${unit_name})`;
      notifBody = `A tenant has confirmed proceeding with the lease for ${property_name} - ${unit_name}. Please prepare the draft lease.`;

      // Check existing lease
      const [existingLease]: any = await connection.query(
        `SELECT agreement_id FROM LeaseAgreement WHERE tenant_id = ? AND unit_id = ? LIMIT 1`,
        [tenantId, unitId],
      );

      // Create new draft lease if none exists
      if (!existingLease.length) {
        let leaseId = generateLeaseId();
        let unique = false;

        while (!unique) {
          const [exists]: any = await connection.query(
            `SELECT 1 FROM LeaseAgreement WHERE agreement_id = ? LIMIT 1`,
            [leaseId],
          );
          if (!exists.length) unique = true;
          else leaseId = generateLeaseId();
        }

        await connection.query(
          `
          INSERT INTO LeaseAgreement (
            agreement_id, tenant_id, unit_id, start_date, end_date, status, created_at
          )
          VALUES (?, ?, ?, NULL, NULL, 'draft', CURRENT_TIMESTAMP)
          `,
          [leaseId, tenantId, unitId],
        );
        console.log("✅ Lease draft created:", leaseId);
      }

      // Update unit status to occupied
      await connection.query(
        `UPDATE Unit SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE unit_id = ?`,
        [unitId],
      );
    }
    // ❌ Tenant declines
    else {
      notifTitle = `Tenant Declined - ${property_name} (${unit_name})`;
      notifBody = `A tenant has declined to proceed with the lease for ${property_name} - ${unit_name}. The unit is now available again.`;

      await connection.query(
        `UPDATE Unit SET status = 'unoccupied', updated_at = CURRENT_TIMESTAMP WHERE unit_id = ?`,
        [unitId],
      );
    }

    // ✅ Insert Notification
    await connection.query(
      `
      INSERT INTO Notification (user_id, title, body, url, is_read, created_at)
      VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      `,
      [landlord_user_id, notifTitle, notifBody, url],
    );

    // ✅ Send Web Push Notification
    const [subs]: any = await connection.query(
      `SELECT endpoint, p256dh, auth FROM user_push_subscriptions WHERE user_id = ?`,
      [landlord_user_id],
    );

    if (subs.length > 0) {
      const payload = JSON.stringify({
        title: notifTitle,
        body: notifBody,
        url,
        icon: `${process.env.NEXT_PUBLIC_BASE_URL}/icons/notification-icon.png`,
      });

      for (const sub of subs) {
        const subscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };
        try {
          await webpush.sendNotification(subscription, payload);
          console.log("✅ Sent push notification:", sub.endpoint);
        } catch (err: any) {
          console.error("❌ Push failed:", err);
          if (err.statusCode === 410 || err.statusCode === 404) {
            await connection.query(
              `DELETE FROM user_push_subscriptions WHERE endpoint = ?`,
              [sub.endpoint],
            );
          }
        }
      }
    }

    await connection.commit();
    return NextResponse.json({
      success: true,
      proceeded: decision,
      message:
        decision === "yes"
          ? "Lease created and unit marked as occupied."
          : "Tenant declined. Unit marked as unoccupied.",
    });
  } catch (error) {
    console.error("❌ Error processing tenant decision:", error);
    if (connection) await connection.rollback();
    return NextResponse.json(
      { error: "Server error while processing tenant decision." },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}
