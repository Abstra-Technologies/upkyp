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
    referenceId: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    secretKey: string;
    forUserId?: string;
}) {
    // Check if customer already exists in Xendit
    const listResp = await fetch(
        `https://api.xendit.co/customers?reference_id=${encodeURIComponent(referenceId)}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Basic " + Buffer.from(`${secretKey}:`).toString("base64"),
                ...(forUserId && { "for-user-id": forUserId }),
            },
        }
    );

    const listData = await listResp.json();
    if (listResp.ok && listData.data && listData.data.length > 0) {
        console.log("[XENDIT CUSTOMER] Found existing customer:", listData.data[0].id);
        return listData.data[0].id as string;
    }

    // Create new customer if not found
    const resp = await fetch("https://api.xendit.co/customers", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization:
                "Basic " + Buffer.from(`${secretKey}:`).toString("base64"),
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
        }),
    });

    const data = await resp.json();

    if (!resp.ok || !data?.id) {
        throw new Error(
            `Xendit customer creation failed: ${JSON.stringify(data)}`
        );
    }

    return data.id as string;
}
