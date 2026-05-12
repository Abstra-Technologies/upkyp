import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { db } from "@/lib/db";
import { safeDecrypt } from "@/utils/decrypt/safeDecrypt";

/* -------------------------------------------------------------------------- */
/* CONFIG                                                                     */
/* -------------------------------------------------------------------------- */

const MASTER_NOTIFICATION_EMAIL = process.env.MASTER_NOTIFICATION_EMAIL;

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeAccountNumber(value: string | null) {
    return value?.trim() || "";
}

function log(stage: string, data?: any) {
    console.log(`\n========== ${stage} ==========\n`);
    if (data) console.log(JSON.stringify(data, null, 2));
}

/* -------------------------------------------------------------------------- */
/* DISBURSE API (SUB-ACCOUNT + EMAIL DECRYPTION)                             */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {

    log("🚀 DISBURSE API HIT");

    try {
        const body = await req.json();
        const { payment_ids } = body;

        if (!Array.isArray(payment_ids) || payment_ids.length === 0) {
            return NextResponse.json(
                { error: "payment_ids is required" },
                { status: 400 }
            );
        }

        /* =========================================================
           1️⃣ Fetch Payments + Encrypted Email
        ========================================================== */

        const [rows]: any = await db.query(
            `
                SELECT
                    p.payment_id,
                    p.net_amount,

                    l.landlord_id,
                    l.xendit_account_id,

                    u.email AS encrypted_email,

                    pa.channel_code,
                    pa.account_name,
                    pa.account_number,
                    pa.bank_name,

                    pc.channel_type

                FROM Payment p
                         INNER JOIN LeaseAgreement la ON la.agreement_id = p.agreement_id
                         INNER JOIN Unit u2 ON la.unit_id = u2.unit_id
                         INNER JOIN Property pr ON pr.property_id = u2.property_id
                         INNER JOIN Landlord l ON l.landlord_id = pr.landlord_id
                         INNER JOIN User u ON u.user_id = l.user_id

                         INNER JOIN LandlordPayoutAccount pa
                                    ON pa.landlord_id = l.landlord_id
                                        AND pa.is_active = 1

                         INNER JOIN payout_channels pc
                                    ON pc.channel_code = pa.channel_code
                                        AND pc.is_available = 1

                WHERE p.payment_id IN (?)
                  AND p.payment_status = 'confirmed'
                  AND p.payout_status = 'unpaid'
            `,
            [payment_ids]
        );

        log("📊 DB RESULT", rows);

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { error: "No valid payments found for disbursement" },
                { status: 400 }
            );
        }

        /* =========================================================
           2️⃣ Group by Landlord
        ========================================================== */

        const grouped: Record<string, any> = {};

        for (const row of rows) {

            const landlordId = row.landlord_id;

            if (!grouped[landlordId]) {

                const decryptedEmail = safeDecrypt(row.encrypted_email);

                if (!decryptedEmail) {
                    throw new Error(
                        `Failed to decrypt email for landlord ${landlordId}`
                    );
                }

                grouped[landlordId] = {
                    landlord_id: landlordId,
                    xendit_account_id: row.xendit_account_id,
                    landlord_email: decryptedEmail,
                    channel_code: row.channel_code,
                    channel_type: row.channel_type,
                    account_name: row.account_name,
                    account_number: normalizeAccountNumber(row.account_number),
                    bank_name: row.bank_name,
                    payment_ids: [],
                    total_amount: 0,
                };
            }

            grouped[landlordId].payment_ids.push(row.payment_id);
            grouped[landlordId].total_amount += Number(row.net_amount);
        }

        log("🧮 GROUPED PAYOUTS", grouped);

        /* =========================================================
           3️⃣ Execute Sub-account Payout
        ========================================================== */

        for (const landlordKey of Object.keys(grouped)) {

            const payout = grouped[landlordKey];

            if (!payout || payout.total_amount <= 0) continue;

            const amount = Number(payout.total_amount.toFixed(2));
            const external_id = `payout-${Date.now()}-${payout.landlord_id}`;

            if (amount < 50) {
                return NextResponse.json(
                    { error: `Minimum payout is ₱50 (₱${amount})` },
                    { status: 400 }
                );
            }

            const payoutPayload = {
                reference_id: external_id,
                channel_code: payout.channel_code,
                channel_properties: {
                    account_number: payout.account_number,
                    account_holder_name: payout.account_name,
                },
                amount,
                description: "Rental payout",
                currency: "PHP",

                /* 🔥 RECEIPT EMAIL */
                receipt_notification: {
                    email_to: [payout.landlord_email],
                    email_cc: MASTER_NOTIFICATION_EMAIL
                        ? [MASTER_NOTIFICATION_EMAIL]
                        : [],
                },

                metadata: {
                    landlord_id: payout.landlord_id,
                    payment_ids: payout.payment_ids,
                },
            };

            log("📤 PAYOUT PAYLOAD", payoutPayload);

            const xenditResponse = await axios.post(
                "https://api.xendit.co/v2/payouts",
                payoutPayload,
                {
                    headers: {
                        "Idempotency-key": external_id,
                        "for-user-id": payout.xendit_account_id,
                    },
                    auth: {
                        username: process.env.XENDIT_DISBURSE_SECRET_KEY!,
                        password: "",
                    },
                }
            );

            log("✅ XENDIT RESPONSE", xenditResponse.data);

            /* =========================================================
               4️⃣ Save payout history
            ========================================================== */

            await db.query(
                `
                    INSERT INTO LandlordPayoutHistory
                    (
                        landlord_id,
                        amount,
                        included_payments,
                        payout_method,
                        channel_code,
                        account_name,
                        account_number,
                        bank_name,
                        status,
                        external_id,
                        xendit_disbursement_id
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACCEPTED', ?, ?)
                `,
                [
                    payout.landlord_id,
                    amount,
                    JSON.stringify(payout.payment_ids),
                    payout.channel_type,
                    payout.channel_code,
                    payout.account_name,
                    payout.account_number,
                    payout.bank_name,
                    external_id,
                    xenditResponse?.data?.id || null,
                ]
            );

            /* =========================================================
               5️⃣ Mark payments as IN_PAYOUT
            ========================================================== */

            await db.query(
                `
                    UPDATE Payment
                    SET payout_status = 'in_payout'
                    WHERE payment_id IN (?)
                `,
                [payout.payment_ids]
            );
        }

        return NextResponse.json({
            success: true,
            message: "Sub-account disbursement initiated successfully",
        });

    } catch (err: any) {

        console.error("🔥 DISBURSE ERROR:", err?.response?.data || err);

        return NextResponse.json(
            {
                error: "Failed to initiate disbursement",
                details: err?.response?.data || err,
            },
            { status: 500 }
        );
    }
}
