import { db } from "@/lib/db";

const XENDIT_SECRET = process.env.XENDIT_TEXT_SECRET_KEY!;

async function fetchTransactions(forUserId: string, afterId?: string) {
    const params = new URLSearchParams({ limit: "50" });
    if (afterId) params.set("after_id", afterId);

    const url = `https://api.xendit.co/transactions?${params.toString()}`;
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${XENDIT_SECRET}:`).toString("base64"),
        "for-user-id": forUserId,
    };

    console.log(`[XENDIT] GET ${url}`);
    console.log(`[XENDIT] Headers: for-user-id=${forUserId}`);

    const res = await fetch(url, { headers });
    console.log(`[XENDIT] Response status: ${res.status} ${res.statusText}`);

    if (!res.ok) {
        const err = await res.text();
        console.error(`[XENDIT] Error body: ${err}`);
        throw new Error(`Failed to fetch transactions for ${forUserId}: ${res.status} ${err}`);
    }

    const result = await res.json();
    console.log(`[XENDIT] Response: has_more=${result.has_more}, data.length=${(result.data || []).length}`);

    if (result.data && result.data.length > 0) {
        console.log(`[XENDIT] First transaction sample:`, JSON.stringify(result.data[0], null, 2));
        if (result.data.length > 1) {
            console.log(`[XENDIT] Last transaction sample:`, JSON.stringify(result.data[result.data.length - 1], null, 2));
        }
    }

    return result;
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
            console.log(`[SUBACCOUNT CRON] ========== Syncing landlord ${landlord.landlord_id} (xendit_account_id: ${landlord.xendit_account_id}) ==========`);

            let afterId: string | undefined;
            let hasMore = true;
            let page = 1;

            while (hasMore) {
                console.log(`[SUBACCOUNT CRON]   Page ${page}: Fetching transactions (after_id=${afterId || 'none'})...`);
                const result = await fetchTransactions(landlord.xendit_account_id, afterId);
                const transactions = result.data || [];
                console.log(`[SUBACCOUNT CRON]   Page ${page}: Received ${transactions.length} transaction(s), has_more=${result.has_more}`);

                for (const txn of transactions) {
                    console.log(`[SUBACCOUNT CRON]   Processing txn: id=${txn.id}, ref=${txn.reference_id}, type=${txn.type}, status=${txn.status}, amount=${txn.amount}, net=${txn.net_amount}`);
                    console.log(`[SUBACCOUNT CRON]     Fee details: xendit_fee=${txn.fee?.xendit_fee}, vat=${txn.fee?.value_added_tax}, withholding=${txn.fee?.xendit_withholding_tax}, third_party=${txn.fee?.third_party_withholding_tax}`);

                    if (!txn.reference_id || !txn.id) {
                        console.log(`[SUBACCOUNT CRON]     Skipping: missing reference_id or id`);
                        continue;
                    }

                    const billId = txn.reference_id.replace(/^billing-/, '');

                    const [existing]: any = await db.execute(
                        `SELECT payment_id, payment_status, transaction_id, gateway_transaction_ref 
                         FROM Payment 
                         WHERE bill_id = ?`,
                        [billId]
                    );

                    if (existing.length > 0) {
                        const row = existing[0];
                        console.log(`[SUBACCOUNT CRON]     Match found: payment_id=${row.payment_id}, current transaction_id=${row.transaction_id}, status=${row.payment_status}`);

                        const statusMap: Record<string, string> = {
                            SUCCESS: "confirmed",
                            PENDING: "pending",
                            FAILED: "failed",
                            VOIDED: "cancelled",
                            REVERSED: "cancelled",
                        };
                        const newStatus = statusMap[txn.status] || row.payment_status;

                        await db.execute(
                            `UPDATE Payment SET
                                transaction_id = ?,
                                gateway_transaction_ref = ?,
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
                                txn.reference_id,
                                txn.net_amount,
                                txn.fee?.xendit_fee || 0,
                                txn.fee?.value_added_tax || 0,
                                txn.fee?.xendit_withholding_tax || 0,
                                txn.fee?.third_party_withholding_tax || 0,
                                newStatus,
                                JSON.stringify(txn),
                                row.payment_id,
                            ]
                        );
                        totalUpdated++;
                        console.log(`[SUBACCOUNT CRON]     ✓ Updated payment ${row.payment_id}: transaction_id=${txn.id}, gateway_transaction_ref=${txn.reference_id}, status=${newStatus}`);
                    } else {
                        console.log(`[SUBACCOUNT CRON]     ✗ No payment found with bill_id='${billId}'. Skipping.`);
                    }
                }

                hasMore = result.has_more || false;
                if (hasMore && transactions.length > 0) {
                    afterId = transactions[transactions.length - 1].id;
                    console.log(`[SUBACCOUNT CRON]   Page ${page} complete. Paginating with after_id=${afterId}`);
                    page++;
                } else {
                    console.log(`[SUBACCOUNT CRON]   Page ${page} complete. No more pages.`);
                    hasMore = false;
                }
            }

            console.log(`[SUBACCOUNT CRON] ========== Finished landlord ${landlord.landlord_id} ==========`);
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
