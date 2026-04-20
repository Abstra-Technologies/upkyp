import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendUserNotification } from "@/lib/notifications/sendUserNotification";

export async function PUT(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        const body = await req.json();
        const { agreement_id, move_in_date, tenant_id } = body;

        if (!agreement_id || !move_in_date) {
            return NextResponse.json(
                { error: "Agreement ID and move-in date are required" },
                { status: 400 }
            );
        }

        const [existingLease]: any = await connection.execute(
            `SELECT la.tenant_id, la.unit_id, u.unit_name, p.property_name
             FROM LeaseAgreement la
             JOIN Unit u ON la.unit_id = u.unit_id
             JOIN Property p ON u.property_id = p.property_id
             WHERE la.agreement_id = ?`,
            [agreement_id]
        );

        if (!existingLease.length) {
            return NextResponse.json(
                { error: "Lease agreement not found" },
                { status: 404 }
            );
        }

        const { tenant_id: leaseTenantId, unit_name, property_name } = existingLease[0];

        if (tenant_id && tenant_id !== leaseTenantId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        const targetTenantId = tenant_id || leaseTenantId;

        await connection.beginTransaction();

        try {
            await connection.execute(
                `UPDATE LeaseAgreement SET move_in_date = ? WHERE agreement_id = ?`,
                [move_in_date, agreement_id]
            );

            const [tenantUser]: any = await connection.execute(
                `SELECT u.user_id FROM Tenant t JOIN User u ON t.user_id = u.user_id WHERE t.tenant_id = ?`,
                [targetTenantId]
            );

            if (tenantUser.length > 0) {
                await sendUserNotification({
                    userId: tenantUser[0].user_id,
                    title: "Move-in Date Set",
                    body: `Your move-in date for ${property_name} - Unit ${unit_name} has been set to ${move_in_date}.`,
                    url: "/tenant/my-unit",
                    conn: connection,
                });
            }

            await connection.commit();

            return NextResponse.json(
                {
                    message: "Move-in date updated successfully",
                    move_in_date,
                },
                { status: 200 }
            );
        } catch (txError: any) {
            await connection.rollback();
            console.error("Transaction error:", txError);

            return NextResponse.json(
                { error: "Failed to update move-in date", details: txError.message },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("Outer error:", error);

        return NextResponse.json(
            { error: "Failed to update move-in date", details: error.message },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
