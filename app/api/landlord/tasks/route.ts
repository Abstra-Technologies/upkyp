import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const landlordId = searchParams.get("landlordId");

    if (!landlordId) {
        return NextResponse.json({ error: "Missing landlord_id" }, { status: 400 });
    }

    try {
        // 1. Pending property visits
        const [visits] = await db.query(
            `
      SELECT pv.visit_id, u.unit_name, pv.visit_date, pv.visit_time, p.property_name
      FROM PropertyVisit pv
      JOIN Unit u ON pv.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE p.landlord_id = ? AND pv.status = 'pending'
      `,
            [landlordId]
        );

        // 2. Maintenance requests not yet completed
        const [maintenance] = await db.query(
            `
      SELECT mr.request_id, u.unit_name, mr.subject, mr.status, p.property_name
      FROM MaintenanceRequest mr
      JOIN Unit u ON mr.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE p.landlord_id = ? AND mr.status != 'Completed'
      `,
            [landlordId]
        );

        // 3. Pending payments
        const [payments] = await db.query(
            `
      SELECT pay.payment_id, pay.amount_paid, pay.payment_type, la.agreement_id
      FROM Payment pay
      JOIN LeaseAgreement la ON pay.agreement_id = la.agreement_id
      JOIN Unit u ON la.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE p.landlord_id = ? AND pay.payment_status = 'pending'
      `,
            [landlordId]
        );

        // 4. Pending lease agreements
        const [agreements] = await db.query(
            `
      SELECT la.agreement_id, u.unit_name, la.start_date, la.end_date
      FROM LeaseAgreement la
      JOIN Unit u ON la.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE p.landlord_id = ? AND la.status = 'pending'
      `,
            [landlordId]
        );

        // 🔄 Combine into single task list
// 🔄 Combine into single task list

        const tasks = [
            // Visits
            // @ts-ignore
            ...visits.map((v: any) => {
                const dateStr = new Date(v.visit_date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                });

                const timeStr = v.visit_time
                    ? new Date(`1970-01-01T${v.visit_time}`).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                    })
                    : null;

                return {
                    type: "visit",
                    id: v.visit_id,
                    label: `Visit request • ${v.unit_name} (${v.property_name})`,
                    date: dateStr,
                    time: timeStr,
                };
            }),

            // Maintenance
            // @ts-ignore
            ...maintenance.map((m: any) => ({
                type: "maintenance",
                id: m.request_id,
                label: `Maintenance • "${m.subject}" • ${m.unit_name} (${m.property_name})`,
                status: m.status,
            })),

            // Payments
            // @ts-ignore
            ...payments.map((p: any) => ({
                type: "payment",
                id: p.payment_id,
                label: `Payment • ₱${p.amount_paid} (${p.payment_type})`,
                status: p.payment_status,
                agreement: p.agreement_id,
            })),

            // Agreements
            // @ts-ignore
            ...agreements.map((a: any) => ({
                type: "agreement",
                id: a.agreement_id,
                label: `Lease agreement • ${a.unit_name}`,
                date: `${a.start_date} → ${a.end_date}`,
            })),
        ];

        return NextResponse.json({ tasks });
    } catch (err: any) {
        console.error("Error fetching landlord tasks:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
