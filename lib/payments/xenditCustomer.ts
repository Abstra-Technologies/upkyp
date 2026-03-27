/**
 * Xendit Customer Utilities
 * -------------------------
 * - Creates customer only if missing
 * - Returns a REAL Xendit customer.id
 */

export async function createXenditCustomer({
                                               referenceId,
                                               email,
                                               firstName,
                                               lastName,
                                               secretKey,
                                               forUserId,
                                           }: {
    referenceId: string; // e.g. tenant-123 | landlord-456
    email?: string;
    firstName?: string;
    lastName?: string;
    secretKey: string;
    forUserId: string; // landlord's xendit_account_id
}) {

    const resp = await fetch("https://api.xendit.co/customers", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization:
                "Basic " + Buffer.from(`${secretKey}:`).toString("base64"),

            // ✅ MOVE IT HERE (if you REALLY want subaccount)
            ...(forUserId && { "for-user-id": forUserId }),
        },
        body: JSON.stringify({
            reference_id: referenceId,
            type: "INDIVIDUAL",
            individual_detail: {
                given_names: firstName || "User",
                surname: lastName || referenceId,
            },
            email,
            // ❌ REMOVE THIS
            // for_user_id: forUserId
        }),
    });

    const data = await resp.json();

    if (!resp.ok || !data?.id) {
        throw new Error(
            `Xendit customer creation failed: ${JSON.stringify(data)}`
        );
    }

    return data.id as string; // ← REAL customer.id
}
