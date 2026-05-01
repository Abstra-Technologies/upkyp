import { db } from "@/lib/db";

const XENDIT_SECRET = process.env.XENDIT_TEXT_SECRET_KEY!;

async function fetchTransactions(forUserId: string, afterId?: string) {
    const params = new URLSearchParams({ limit: "100" });
    if (afterId) params.set("after_id", afterId);

    const url = `https://api.xendit.co/transactions?${params.toString()}`;
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${XENDIT_SECRET}:`).toString("base64"),
        "for-user-id": forUserId,
    };

    const res = await fetch(url, { headers });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to fetch transactions for ${forUserId}: ${res.status} ${err}`);
    }
    return res.json();
}

export async function syncSubaccountTransactions() {
    console.log("[SUBACCOUNT CRON] ========== START ==========");
    let totalUpdated = 0;

    try {
        const [landlords]: any = await db.execute(
            `SELECT landlord_id, xendit_account_id FROM Landlord WHERE xendit_account_id IS NOT NULL`
        );

        console.log(`[SUBACCOUNT CRON] Found ${landlords.length} landlord(s) with xendit_account_id`);

        for (const landlord of landlords) {
            console.log(`[SUBACCOUNT CRON] Syncing landlord ${landlord.landlord_id} (xendit_account_id: ${landlord.xendit_account_id})`);

            let afterId: string | undefined;
            let hasMore = true;
            let page = 1;

            while (hasMore) {
                console.log(`[SUBACCOUNT CRON]   Page ${page}: Fetching transactions...`);
                const result = await fetchTransactions(landlord.xendit_account_id, afterId);
                const transactions = result.data || [];
                console.log(`[SUBACCOUNT CRON]   Page ${page}: Received ${transactions.length} transaction(s)`);

                for (const txn of transactions) {
                    if (!txn.reference_id || !txn.id) continue;

                    const [existing]: any = await db.execute(
                        `SELECT payment_id, payment_status FROM Payment WHERE gateway_transaction_ref = ?`,
                        [txn.reference_id]
                    );

                    if (existing.length > 0) {
                        const currentStatus = existing[0].payment_status;
                        const statusMap: Record<string, string> = {
                            SUCCESS: "confirmed",
                            PENDING: "pending",
                            FAILED: "failed",
                            VOIDED: "cancelled",
                            REVERSED: "cancelled",
                        };
                        const newStatus = statusMap[txn.status] || currentStatus;

                        await db.execute(
                            `UPDATE Payment SET
                                transaction_id = ?,
                                net_amount = ?,
                                gateway_fee = ?,
                                gateway_vat = ?,
                                gateway_withholding_tax = ?,
                                gateway_third_party_withholding = ?,
                                payment_status = ?,
                                raw_gateway_payload = ?,
                                updated_at = NOW()
                            WHERE payment_id = ?`,
                            [
                                txn.id,
                                txn.net_amount,
                                txn.fee?.xendit_fee || 0,
                                txn.fee?.value_added_tax || 0,
                                txn.fee?.xendit_withholding_tax || 0,
                                txn.fee?.third_party_withholding_tax || 0,
                                newStatus,
                                JSON.stringify(txn),
                                existing[0].payment_id,
                            ]
                        );
                        totalUpdated++;
                        console.log(`[SUBACCOUNT CRON]   Updated payment ${existing[0].payment_id} for ref ${txn.reference_id} (${currentStatus} → ${newStatus})`);
                    }
                }

                hasMore = result.has_more || false;
                if (hasMore && transactions.length > 0) {
                    afterId = transactions[transactions.length - 1].id;
                    page++;
                } else {
                    hasMore = false;
                }
            }
        }

        console.log(`[SUBACCOUNT CRON] ========== END: Updated ${totalUpdated} payment(s) ==========`);
        return totalUpdated;
    } catch (error: any) {
        console.error("[SUBACCOUNT CRON] ========== FATAL ERROR ==========");
        console.error("[SUBACCOUNT CRON] Error:", error.message);
        console.error("[SUBACCOUNT CRON] Stack:", error.stack);
        console.error("[SUBACCOUNT CRON] ========== END (FAILURE) ==========");
        throw error;
    }
}
