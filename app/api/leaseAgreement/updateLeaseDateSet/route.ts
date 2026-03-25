import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendUserNotification } from "@/lib/notifications/sendUserNotification";

export async function PUT(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        const body = await req.json();
        console.log('modify end date data: ', body);

        const {
            agreement_id,
            start_date,
            end_date,
            security_deposit_amount = 0,
            advance_payment_amount = 0,
        } = body;

        console.log('body', body);
        console.log('agreement_id', agreement_id);

        if (!agreement_id || !start_date) {
            return NextResponse.json(
                { error: "Agreement ID and start date are required" },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        const [leaseRows]: any = await connection.execute(
            `
        SELECT tenant_id, unit_id
        FROM LeaseAgreement
        WHERE agreement_id = ?
        LIMIT 1
      `,
            [agreement_id]
        );

        if (leaseRows.length === 0) {
            return NextResponse.json(
                { error: "No lease found with the provided agreement_id" },
                { status: 404 }
            );
        }

        const { tenant_id, unit_id } = leaseRows[0];

        await connection.execute(
            `
        UPDATE LeaseAgreement
        SET 
          start_date = ?,
          end_date = ?,
          status = 'active',
          security_deposit_amount = ?,
          advance_payment_amount = ?,
          grace_period_days = 3
        WHERE agreement_id = ?
      `,
            [
                start_date,
                end_date,
                security_deposit_amount,
                advance_payment_amount,
                agreement_id,
            ]
        );

        await connection.execute(
            `UPDATE Unit SET status = 'occupied' WHERE unit_id = ?`,
            [unit_id]
        );

        const [tenantRow]: any = await connection.execute(
            `
                SELECT
                    u.user_id, u.firstName, u.lastName,
                    p.property_name, un.unit_name
                FROM Tenant t
                         JOIN User u ON t.user_id = u.user_id
                         JOIN LeaseAgreement la ON la.tenant_id = t.tenant_id
                         JOIN Unit un ON la.unit_id = un.unit_id
                         JOIN Property p ON un.property_id = p.property_id
                WHERE t.tenant_id = ?
                LIMIT 1
            `,
            [tenant_id]
        );

        const user_id = tenantRow?.[0]?.user_id;
        const tenantName = `${tenantRow?.[0]?.firstName || ""} ${
            tenantRow?.[0]?.lastName || ""
        }`.trim();
        const propertyName = tenantRow?.[0]?.property_name || "Property";
        const unitName = tenantRow?.[0]?.unit_name || "Unit";

        const isOpenEnded = !end_date;
        const leasePeriodText = isOpenEnded
            ? `Lease period: ${start_date} until further notice (open-ended)`
            : `Lease period: ${start_date} to ${end_date}`;

        const notificationTitle = "Lease Dates Updated";
        const notificationBody = `🏠 Your lease for ${propertyName} - ${unitName} has been updated. ${leasePeriodText}.`;

        await sendUserNotification({
            userId: user_id,
            title: notificationTitle,
            body: notificationBody,
            url: "/pages/tenant/activeLease",
            conn: connection,
        });

        await connection.commit();

        return NextResponse.json(
            {
                message: "Lease updated successfully and tenant notified.",
                start_date,
                end_date,
                security_deposit_amount,
                advance_payment_amount,
            },
            { status: 200 }
        );
    } catch (error: any) {
        await connection.rollback();
        console.error("Error updating lease:", error);
        return NextResponse.json(
            { error: "Failed to update lease", details: error.message },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}