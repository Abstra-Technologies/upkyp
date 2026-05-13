import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

/* ---------------------------------
   Safe decrypt helper
---------------------------------- */
async function safeDecrypt(value: string | null) {
    try {
        if (value && value.startsWith("{")) {
            return decryptData(
                JSON.parse(value),
                process.env.ENCRYPTION_SECRET!
            );
        }
        return value ?? "";
    } catch {
        return "";
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const paymentIdsParam = searchParams.get("payment_ids");

    if (!paymentIdsParam) {
        return NextResponse.json(
            { error: "payment_ids is required" },
            { status: 400 }
        );
    }

    const paymentIds = paymentIdsParam
        .split(",")
        .map((id) => Number(id.trim()))
        .filter(Boolean);

    if (paymentIds.length === 0) {
        return NextResponse.json({ success: true, landlords: [] });
    }

    try {
        /* =====================================
            PAYMENT-CENTRIC REVIEW QUERY
            (1 ROW = 1 PAYMENT, GUARANTEED)
        ====================================== */
        const sql = `
        SELECT
            p.payment_id,
            p.payment_type,
            p.net_amount,
            p.payment_status,
            p.payout_status,

            l.landlord_id,
            u_landlord.firstName AS landlord_firstName,
            u_landlord.lastName  AS landlord_lastName,

            -- payout account is METADATA ONLY
            MAX(pa.account_name)   AS account_name,
            MAX(pa.account_number) AS account_number,
            MAX(pa.bank_name)      AS bank_name,
            MAX(pa.channel_code)   AS channel_code,

            MAX(pc.channel_type)   AS channel_type,
            MAX(pc.is_available)   AS channel_available

        FROM Payment p
        INNER JOIN LeaseAgreement la ON la.agreement_id = p.agreement_id
        INNER JOIN Unit u ON la.unit_id = u.unit_id
        INNER JOIN Property pr ON pr.property_id = u.property_id
        INNER JOIN Landlord l ON l.landlord_id = pr.landlord_id
        INNER JOIN User u_landlord ON l.user_id = u_landlord.user_id

        -- payout account is OPTIONAL, not a driver
        LEFT JOIN LandlordPayoutAccount pa
            ON pa.landlord_id = l.landlord_id

        LEFT JOIN payout_channels pc
            ON pc.channel_code = pa.channel_code

        WHERE p.payment_id IN (?)
          AND p.payment_status IN ('confirmed', 'paid')
          AND (p.payout_status IS NULL OR p.payout_status = 'unpaid')
          AND p.net_amount IS NOT NULL

        -- 🔒 ABSOLUTE GUARANTEE: 1 ROW = 1 PAYMENT
        GROUP BY p.payment_id
        `;

        const [rows]: any = await db.query(sql, [paymentIds]);

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { success: true, landlords: [] },
                { status: 200 }
            );
        }

        /* =====================================
           GROUP PAYMENTS BY LANDLORD
        ====================================== */
        const grouped: Record<string, any> = {};

        for (const row of rows) {
            const landlordId = row.landlord_id;

            if (!grouped[landlordId]) {
                const first = await safeDecrypt(row.landlord_firstName);
                const last = await safeDecrypt(row.landlord_lastName);

                grouped[landlordId] = {
                    landlord_id: landlordId,
                    landlord_name: `${first} ${last}`.trim(),

                    payout_channel: row.channel_code
                        ? {
                            channel_code: row.channel_code,
                            channel_type: row.channel_type,
                            bank_name: row.bank_name,
                            is_available: Boolean(row.channel_available),
                        }
                        : null,

                    account_name: row.account_name,
                    account_number: row.account_number,

                    total_amount: 0,
                    payments: [],
                };
            }

            grouped[landlordId].payments.push({
                payment_id: row.payment_id,
                payment_type: row.payment_type,
                net_amount: Number(row.net_amount),
            });

            grouped[landlordId].total_amount += Number(row.net_amount);
        }

        return NextResponse.json(
            {
                success: true,
                landlords: Object.values(grouped),
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("❌ [PAYOUT REVIEW] ERROR:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
