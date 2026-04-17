import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendUserNotification } from "@/lib/notifications/sendUserNotification";

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { visit_id, status, reason } = body;

        if (!visit_id) {
            return NextResponse.json(
                { message: "Missing visit_id." },
                { status: 400 }
            );
        }

        const validStatuses = ["approved", "disapproved", "cancelled", "pending"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { message: "Invalid status." },
                { status: 400 }
            );
        }

        if (status === "disapproved" && !reason) {
            return NextResponse.json(
                { message: "Disapproval reason is required." },
                { status: 400 }
            );
        }

        /* ===============================
           1️⃣ Update visit
        =============================== */
        let result;

        switch (status) {
            case "disapproved":
                [result] = await db.query(
                    `
          UPDATE PropertyVisit
          SET status = ?, disapproval_reason = ?, updated_at = NOW()
          WHERE visit_id = ?
          `,
                    [status, reason, visit_id]
                );
                break;

            case "cancelled":
                [result] = await db.query(
                    `
          UPDATE PropertyVisit
          SET status = ?, updated_at = NOW()
          WHERE visit_id = ?
          `,
                    [status, visit_id]
                );
                break;

            default:
                [result] = await db.query(
                    `
          UPDATE PropertyVisit
          SET status = ?, disapproval_reason = NULL, updated_at = NOW()
          WHERE visit_id = ?
          `,
                    [status, visit_id]
                );
        }

        // @ts-ignore
        if (result.affectedRows === 0) {
            return NextResponse.json(
                { message: "Visit not found or already updated." },
                { status: 404 }
            );
        }

        /* ===============================
           2️⃣ Get tenant user_id + visit info
        =============================== */
        const [rows]: any = await db.query(
            `
      SELECT 
        u.user_id AS tenant_user_id,
        pv.visit_date,
        pv.visit_time
      FROM PropertyVisit pv
      JOIN Tenant t ON pv.tenant_id = t.tenant_id
      JOIN User u ON t.user_id = u.user_id
      WHERE pv.visit_id = ?
      LIMIT 1
      `,
            [visit_id]
        );

        if (rows.length > 0) {
            const { tenant_user_id, visit_date, visit_time } = rows[0];

            /* ===============================
               3️⃣ Build notification message
            =============================== */
            let title = "Visit Update";
            let bodyText = "";

            switch (status) {
                case "approved":
                    title = "Visit Approved ✅";
                    bodyText = `Your visit on ${visit_date} at ${visit_time.slice(
                        0,
                        5
                    )} has been approved.`;
                    break;

                case "disapproved":
                    title = "Visit Disapproved ❌";
                    bodyText = `Your visit on ${visit_date} at ${visit_time.slice(
                        0,
                        5
                    )} was disapproved. Reason: ${reason}`;
                    break;

                case "cancelled":
                    title = "Visit Cancelled";
                    bodyText = `Your visit on ${visit_date} at ${visit_time.slice(
                        0,
                        5
                    )} has been cancelled.`;
                    break;

                default:
                    title = "Visit Updated";
                    bodyText = `Your visit on ${visit_date} at ${visit_time.slice(
                        0,
                        5
                    )} was updated.`;
            }

            /* ===============================
               4️⃣ Send notification
            =============================== */
            await sendUserNotification({
                userId: tenant_user_id,
                title,
                body: bodyText,
                url: "/tenant/visits", // adjust if you have a visit page
            });
        }

        return NextResponse.json({
            message: `Visit ${status} successfully.`,
            updatedStatus: status,
        });
    } catch (error) {
        console.error("Database Error:", error);
        return NextResponse.json(
            { message: "Server error." },
            { status: 500 }
        );
    }
}
