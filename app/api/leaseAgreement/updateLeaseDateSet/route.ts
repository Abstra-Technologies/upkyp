import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendUserNotification } from "@/lib/notifications/sendUserNotification";
import { createXenditCustomer } from "@/lib/payments/xenditCustomer";
import { safeDecrypt } from "@/utils/decrypt/safeDecrypt";

// components/landlord/activeLease/ChecklistModal.tsx andn mofiy date on detailed page of lease.

export async function PUT(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        const body = await req.json();

        const {
            agreement_id,
            start_date,
            end_date,
            security_deposit_amount = 0,
            advance_payment_amount = 0,
        } = body;

        // ✅ Validate BEFORE transaction
        if (!agreement_id || !start_date) {
            return NextResponse.json(
                { error: "Agreement ID and start date are required" },
                { status: 400 }
            );
        }

        // ✅ Get lease first (NO transaction yet)
        const [leaseRows]: any = await connection.execute(
            `
            SELECT tenant_id, unit_id, xendit_customer_id
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

        const { tenant_id, unit_id, xendit_customer_id: existingCustomerId } = leaseRows[0];

        // ✅ Get landlord Xendit account
        const [landlordRow]: any = await connection.execute(
            `
            SELECT l.xendit_account_id
            FROM Landlord l
            JOIN Property p ON p.landlord_id = l.landlord_id
            JOIN Unit un ON un.property_id = p.property_id
            WHERE un.unit_id = ?
            LIMIT 1
            `,
            [unit_id]
        );

        const xenditAccountId = landlordRow?.[0]?.xendit_account_id;

        // ✅ Prepare customer OUTSIDE transaction
        let xenditCustomerId = existingCustomerId;

        if (xenditAccountId && !existingCustomerId) {
            const [tenantRow]: any = await connection.execute(
                `
                SELECT u.email, u.firstName, u.lastName
                FROM Tenant t
                JOIN User u ON t.user_id = u.user_id
                WHERE t.tenant_id = ?
                LIMIT 1
                `,
                [tenant_id]
            );

            const tenant = tenantRow?.[0];

            if (tenant?.email) {
                const decryptedFirstName = safeDecrypt(tenant.firstName) || undefined;
                const decryptedLastName = safeDecrypt(tenant.lastName) || undefined;
                const decryptedEmail = safeDecrypt(tenant.email) || undefined;

                if (decryptedEmail) {
                    try {
                        xenditCustomerId = await createXenditCustomer({
                            referenceId: `tenant-${tenant_id}`,
                            email: decryptedEmail,
                            firstName: decryptedFirstName,
                            lastName: decryptedLastName,
                            secretKey: process.env.XENDIT_SECRET_KEY!,
                            forUserId: xenditAccountId,
                        });
                    } catch (err) {
                        console.error("Xendit customer creation failed:", err);
                        // ❗ Do NOT block lease update if this fails
                    }
                }
            }
        }

        // =============================
        // 🔒 TRANSACTION START
        // =============================
        await connection.beginTransaction();

        try {
            // ✅ Update lease
            await connection.execute(
                `
                UPDATE LeaseAgreement
                SET 
                    start_date = ?,
                    end_date = ?,
                    status = 'active',
                    security_deposit_amount = ?,
                    advance_payment_amount = ?,
                    grace_period_days = 3,
                    xendit_customer_id = ?
                WHERE agreement_id = ?
                `,
                [
                    start_date,
                    end_date,
                    security_deposit_amount,
                    advance_payment_amount,
                    xenditCustomerId,
                    agreement_id,
                ]
            );

            // ✅ Update unit status
            await connection.execute(
                `UPDATE Unit SET status = 'occupied' WHERE unit_id = ?`,
                [unit_id]
            );

            // ✅ Get tenant info for notification
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
            const propertyName = tenantRow?.[0]?.property_name || "Property";
            const unitName = tenantRow?.[0]?.unit_name || "Unit";

            const isOpenEnded = !end_date;
            const leasePeriodText = isOpenEnded
                ? `Lease period: ${start_date} until further notice`
                : `Lease period: ${start_date} to ${end_date}`;

            // ✅ Send notification INSIDE transaction (safe since it's DB-based)
            await sendUserNotification({
                userId: user_id,
                title: "Lease Dates Updated",
                body: `🏠 Your lease for ${propertyName} - ${unitName} has been updated. ${leasePeriodText}.`,
                url: "/tenant/activeLease",
                conn: connection,
            });

            // ✅ Commit
            await connection.commit();

            return NextResponse.json(
                {
                    message: "Lease updated successfully",
                    start_date,
                    end_date,
                },
                { status: 200 }
            );

        } catch (txError: any) {
            await connection.rollback();
            console.error("Transaction error:", txError);

            return NextResponse.json(
                { error: "Transaction failed", details: txError.message },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error("Outer error:", error);

        return NextResponse.json(
            { error: "Failed to update lease", details: error.message },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}