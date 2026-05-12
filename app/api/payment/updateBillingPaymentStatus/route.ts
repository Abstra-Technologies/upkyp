import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

//  to be deleted. using webhook.


export const runtime = "nodejs";
export async function POST(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        // 🔹 1. Verify JWT token
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const user_id = payload?.user_id;
        const session_id = payload?.jti || null;

        if (!user_id)
            return NextResponse.json({ error: "Invalid user session" }, { status: 400 });

        // 🔹 2. Parse request body
        const body = await req.json();
        const {
            tenant_id,
            requestReferenceNumber,
            amount,
            billing_id,
            payment_status,
            payment_method_id = 7,
        } = body;

        if (!tenant_id || !requestReferenceNumber || !amount || !billing_id) {
            return NextResponse.json(
                { message: "Missing required fields." },
                { status: 400 }
            );
        }

        // 🔹 3. Get request metadata
        const endpoint = req.nextUrl.pathname;
        const http_method = req.method;
        const ip_address = req.headers.get("x-forwarded-for") || "unknown";
        const user_agent = req.headers.get("user-agent") || "unknown";
        const device_type = user_agent.includes("Mobile")
            ? "mobile"
            : user_agent.includes("Tablet")
                ? "tablet"
                : "web";

        await connection.beginTransaction();

        // 🔹 4. Find active lease for tenant
        const [leaseRows]: any = await connection.query(
            `
            SELECT agreement_id
            FROM LeaseAgreement
            WHERE tenant_id = ? AND status = 'active'
            LIMIT 1
            `,
            [tenant_id]
        );

        if (!leaseRows.length) {
            await connection.rollback();
            return NextResponse.json(
                { message: "No active lease found for this tenant." },
                { status: 404 }
            );
        }

        const { agreement_id } = leaseRows[0];

        // 🔹 5. Upsert payment (idempotent)
        const [existing]: any = await connection.query(
            `SELECT payment_id, payment_status FROM Payment WHERE receipt_reference = ? LIMIT 1`,
            [requestReferenceNumber]
        );

        if (existing.length > 0) {
            await connection.query(
                `
                UPDATE Payment
                SET amount_paid = ?, payment_status = ?, updated_at = NOW()
                WHERE receipt_reference = ?
                `,
                [amount, payment_status, requestReferenceNumber]
            );
        } else {
            await connection.query(
                `
                INSERT INTO Payment (
                    agreement_id,
                    billing_id,
                    payment_type,
                    amount_paid,
                    payment_method_id,
                    payment_status,
                    receipt_reference,
                    created_at
                )
                VALUES (?, ?, 'billing', ?, ?, ?, ?, NOW())
                `,
                [
                    agreement_id,
                    billing_id,
                    amount,
                    payment_method_id,
                    payment_status,
                    requestReferenceNumber,
                ]
            );
        }

        // 🔹 6. Update Billing
        if (payment_status === "confirmed") {
            await connection.query(
                `
                UPDATE Billing
                SET status = 'paid', paid_at = NOW(), updated_at = NOW()
                WHERE billing_id = ?
                `,
                [billing_id]
            );
        } else if (payment_status === "cancelled") {
            await connection.query(
                `
                UPDATE Billing
                SET status = 'unpaid', paid_at = NULL, updated_at = NOW()
                WHERE billing_id = ?
                `,
                [billing_id]
            );
        }

        // 🔹 7. Handle wallet credit (only if confirmed)
        let walletBefore = null;
        let walletAfter = null;
        let wallet_id = null;

        if (payment_status === "confirmed") {
            const [walletInfo]: any = await connection.query(
                `
                    SELECT w.wallet_id, w.current_balance
                    FROM Billing b
                             JOIN Unit u ON b.unit_id = u.unit_id
                             JOIN Property p ON u.property_id = p.property_id
                             JOIN Landlord l ON p.landlord_id = l.landlord_id
                             JOIN LandlordWallet w ON w.landlord_id = l.landlord_id
                    WHERE b.billing_id = ?
                    LIMIT 1
                `,
                [billing_id]
            );


            if (walletInfo.length) {
                wallet_id = walletInfo[0].wallet_id;
                const current_balance = parseFloat(walletInfo[0].current_balance);
                walletBefore = { current_balance };

                // Check for duplicate transaction (idempotence)
                const [txnExists]: any = await connection.query(
                    `
                    SELECT transaction_id
                    FROM LandlordWalletTransaction
                    WHERE payment_gateway = 'maya' AND gateway_transaction_ref = ?
                    LIMIT 1
                    `,
                    [requestReferenceNumber]
                );

                if (!txnExists.length) {
                    const new_balance = current_balance + parseFloat(amount);
                    walletAfter = { current_balance: new_balance };

                    // Update wallet balance
                    await connection.query(
                        `
                        UPDATE LandlordWallet
                        SET current_balance = ?, updated_at = NOW()
                        WHERE wallet_id = ?
                        `,
                        [new_balance, wallet_id]
                    );

                    // Insert wallet transaction record
                    await connection.query(
                        `
                        INSERT INTO LandlordWalletTransaction (
                            wallet_id,
                            billing_id,
                            agreement_id,
                            tenant_id,
                            payment_gateway,
                            gateway_transaction_ref,
                            amount,
                            type,
                            description
                        )
                        VALUES (?, ?, ?, ?, 'maya', ?, ?, 'credit', ?)
                        `,
                        [
                            wallet_id,
                            billing_id,
                            agreement_id,
                            tenant_id,
                            requestReferenceNumber,
                            amount,
                            "Tenant payment credited via system",
                        ]
                    );
                }
            }
        }

        // 🔹 8. Insert detailed ActivityLog entry
        const description =
            payment_status === "confirmed"
                ? `Tenant ${tenant_id} confirmed payment of ₱${Number(amount).toLocaleString()} for Billing #${billing_id}. Wallet ${wallet_id ? "credited" : "not found"}.`
                : `Tenant ${tenant_id} ${payment_status} payment for Billing #${billing_id}.`;

        await connection.query(
            `
            INSERT INTO rentalley_db.ActivityLog (
                user_id, action, description, target_table, target_id,
                old_value, new_value, endpoint, http_method, status_code,
                ip_address, user_agent, device_type, location, session_id, is_suspicious
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                user_id,
                "Update Payment Status",
                description,
                "Billing",
                billing_id,
                walletBefore ? JSON.stringify(walletBefore) : null,
                walletAfter ? JSON.stringify(walletAfter) : null,
                endpoint,
                http_method,
                200,
                ip_address,
                user_agent,
                device_type,
                null,
                session_id,
                0,
            ]
        );

        await connection.commit();

        return NextResponse.json(
            {
                message:
                    payment_status === "confirmed"
                        ? "Payment confirmed and wallet credited successfully."
                        : "Payment update recorded successfully.",
                tenant_id,
                agreement_id,
                billing_id,
                payment_status,
                requestReferenceNumber,
            },
            { status: 200 }
        );
    } catch (error: any) {
        await connection.rollback();
        console.error("❌ Error processing payment:", error);
        return NextResponse.json(
            { message: "Internal Server Error", error: error.message },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
