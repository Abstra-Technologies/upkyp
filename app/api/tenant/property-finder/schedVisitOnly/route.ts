import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { sendUserNotification } from "@/lib/notifications/sendUserNotification";

export async function POST(req: NextRequest) {
    try {
        const { tenant_id, unit_id, visit_date, visit_time } = await req.json();

        if (!tenant_id || !unit_id || !visit_date || !visit_time) {
            return NextResponse.json(
                { message: "Missing required fields." },
                { status: 400 }
            );
        }

        /* ===============================
           1️⃣ Insert visit
        =============================== */
        await db.query(
            `
      INSERT INTO PropertyVisit
        (tenant_id, unit_id, visit_date, visit_time)
      VALUES (?, ?, ?, ?)
      `,
            [tenant_id, unit_id, visit_date, visit_time]
        );

        /* ===============================
           2️⃣ Get landlord user_id
        =============================== */
        const [rows]: any = await db.query(
            `
      SELECT u.user_id AS landlord_user_id
      FROM Unit un
      JOIN Property p ON un.property_id = p.property_id
      JOIN Landlord l ON p.landlord_id = l.landlord_id
      JOIN User u ON l.user_id = u.user_id
      WHERE un.unit_id = ?
      LIMIT 1
      `,
            [unit_id]
        );

        if (rows.length > 0) {
            const landlordUserId = rows[0].landlord_user_id;

            /* ===============================
               3️⃣ Send notification
            =============================== */
            await sendUserNotification({
                userId: landlordUserId,
                title: "New Property Visit Scheduled",
                body: `A tenant scheduled a visit on ${visit_date} at ${visit_time.slice(
                    0,
                    5
                )}.`,
                url: `/landlord/calendar`, // adjust if needed
            });
        }

        return NextResponse.json(
            { message: "Visit scheduled successfully." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error scheduling visit:", error);
        return NextResponse.json(
            { message: "Internal server error." },
            { status: 500 }
        );
    }
}
