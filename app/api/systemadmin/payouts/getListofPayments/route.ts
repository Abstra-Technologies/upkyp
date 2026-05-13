import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

/* =====================================================
   SAFE DECRYPT
===================================================== */
async function safeDecrypt(value: string | null) {
    try {
        if (value && value.startsWith("{")) {
            return await decryptData(
                JSON.parse(value),
                process.env.ENCRYPTION_SECRET!
            );
        }
        return value ?? "";
    } catch (err) {
        console.error("Decrypt failed:", err);
        return "";
    }
}

/* =====================================================
   GET PAYMENTS (Admin)
===================================================== */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const paymentStatus = searchParams.get("status");
    const payoutStatus = searchParams.get("payoutStatus");

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);
    const offset = (page - 1) * limit;

    try {
        /* =====================================================
           DEFAULT: Only confirmed + unpaid (disbursement ready)
        ===================================================== */
        let where = `
      WHERE p.payment_status = 'confirmed'
      AND p.payout_status = 'unpaid'
    `;

        const params: any[] = [];

        /* =====================================================
           SEARCH
        ===================================================== */
        if (search) {
            where += `
        AND (
          p.payment_id LIKE ?
          OR p.receipt_reference LIKE ?
          OR p.gateway_transaction_ref LIKE ?
          OR pr.property_name LIKE ?
        )
      `;
            params.push(
                `%${search}%`,
                `%${search}%`,
                `%${search}%`,
                `%${search}%`
            );
        }

        /* =====================================================
           OPTIONAL FILTER OVERRIDES
        ===================================================== */
        if (paymentStatus) {
            where += " AND p.payment_status = ?";
            params.push(paymentStatus);
        }

        if (payoutStatus) {
            where += " AND p.payout_status = ?";
            params.push(payoutStatus);
        }

        /* =====================================================
           MAIN QUERY
        ===================================================== */
        const sql = `
            SELECT
                p.payment_id,
                p.payment_type,
                p.amount_paid,
                p.gross_amount,
                p.gateway_fee,
                p.net_amount,
                p.payment_status,
                p.payout_status,
                p.payment_date,
                p.receipt_reference,
                p.gateway_transaction_ref,
                p.payment_method_id,

                -- Tenant
                t.tenant_id,
                u_tenant.firstName AS tenant_firstName,
                u_tenant.lastName AS tenant_lastName,
                u_tenant.profilePicture AS tenant_profile,

                -- Landlord
                l.landlord_id,
                u_landlord.firstName AS landlord_firstName,
                u_landlord.lastName AS landlord_lastName,
                u_landlord.profilePicture AS landlord_profile,

                -- Property / Unit
                pr.property_id,
                pr.property_name,
                u.unit_id,
                u.unit_name

            FROM Payment p
                     LEFT JOIN LeaseAgreement la ON la.agreement_id = p.agreement_id
                     LEFT JOIN Tenant t ON la.tenant_id = t.tenant_id
                     LEFT JOIN User u_tenant ON t.user_id = u_tenant.user_id
                     LEFT JOIN Unit u ON la.unit_id = u.unit_id
                     LEFT JOIN Property pr ON pr.property_id = u.property_id
                     LEFT JOIN Landlord l ON l.landlord_id = pr.landlord_id
                     LEFT JOIN User u_landlord ON l.user_id = u_landlord.user_id

                ${where}
            ORDER BY pr.property_name ASC, p.payment_date DESC
                LIMIT ? OFFSET ?
        `;

        const [rows]: any = await db.query(sql, [
            ...params,
            limit,
            offset,
        ]);

        /* =====================================================
           COUNT QUERY
        ===================================================== */
        const countSql = `
            SELECT COUNT(*) AS total
            FROM Payment p
                     LEFT JOIN LeaseAgreement la ON la.agreement_id = p.agreement_id
                     LEFT JOIN Unit u ON la.unit_id = u.unit_id
                     LEFT JOIN Property pr ON pr.property_id = u.property_id
                ${where}
        `;

        const [countRows]: any = await db.query(countSql, params);
        const total = countRows[0]?.total || 0;

        /* =====================================================
           DECRYPT + FORMAT RESPONSE
        ===================================================== */
        const payments = await Promise.all(
            rows.map(async (row: any) => {
                const landlordFirst = await safeDecrypt(
                    row.landlord_firstName
                );
                const landlordLast = await safeDecrypt(
                    row.landlord_lastName
                );
                const landlordPic = await safeDecrypt(
                    row.landlord_profile
                );

                const tenantFirst = await safeDecrypt(
                    row.tenant_firstName
                );
                const tenantLast = await safeDecrypt(
                    row.tenant_lastName
                );
                const tenantPic = await safeDecrypt(
                    row.tenant_profile
                );

                return {
                    payment_id: row.payment_id,

                    // Primary frontend fields
                    payment_status: row.payment_status,
                    payout_status: row.payout_status,
                    amount: row.amount_paid,
                    gross_amount: row.gross_amount,
                    gateway_fee: row.gateway_fee,
                    net_amount: row.net_amount,
                    payment_date: row.payment_date,
                    receipt_reference: row.receipt_reference,
                    gateway_transaction_ref:
                    row.gateway_transaction_ref,
                    payment_type: row.payment_type,
                    payment_method_id: row.payment_method_id,

                    landlord_name: `${landlordFirst} ${landlordLast}`.trim(),

                    landlord: {
                        landlord_id: row.landlord_id,
                        firstName: landlordFirst,
                        lastName: landlordLast,
                        profilePicture: landlordPic,
                    },

                    tenant: {
                        tenant_id: row.tenant_id,
                        firstName: tenantFirst,
                        lastName: tenantLast,
                        profilePicture: tenantPic,
                    },

                    property: {
                        property_id: row.property_id,
                        property_name: row.property_name,
                    },

                    unit: {
                        unit_id: row.unit_id,
                        unit_name: row.unit_name,
                    },
                };
            })
        );

        return NextResponse.json(
            {
                success: true,
                total,
                page,
                limit,
                payments,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("❌ Error in payments/getList:", err);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
