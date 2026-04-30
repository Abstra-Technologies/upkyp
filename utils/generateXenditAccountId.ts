import { db } from "@/lib/db";
import axios from "axios";
import { safeDecrypt } from "@/utils/decrypt/safeDecrypt";

const XENDIT_BASE_URL = "https://api.xendit.co/v2/accounts";
const XENDIT_SECRET_KEY = process.env.XENDIT_TEST_SUBACCOUNT_LEY;

if (!XENDIT_SECRET_KEY) {
    throw new Error("XENDIT_SECRET_KEY is not defined in environment variables.");
}

export async function generateXenditAccountId(landlordId: string): Promise<string> {
    console.log("[XENDIT] Generating account for landlord:", landlordId);

    const [rows]: any = await db.query(
        `SELECT xendit_account_id FROM Landlord WHERE landlord_id = ? LIMIT 1`,
        [landlordId]
    );

    if (rows.length > 0 && rows[0].xendit_account_id) {
        throw new Error("Landlord already has a Xendit account ID.");
    }

    const [userRows]: any = await db.query(
        `SELECT u.firstName, u.lastName, u.companyName, u.email
         FROM Landlord l
         JOIN User u ON l.user_id = u.user_id
         WHERE l.landlord_id = ?
         LIMIT 1`,
        [landlordId]
    );

    if (userRows.length === 0) {
        throw new Error("Landlord not found.");
    }

    const user = userRows[0];
    const firstName = safeDecrypt(user.firstName) || "";
    const lastName = safeDecrypt(user.lastName) || "";
    const companyName = user.companyName || "";
    const email = safeDecrypt(user.email) || `landlord-${landlordId}@upkyp.test`;

    let businessName = companyName.trim() || `${firstName} ${lastName}`.trim();
    if (!businessName) {
        businessName = `Landlord ${landlordId}`;
    }

    const xenditPayload = {
        email,
        type: "OWNED",
        public_profile: {
            business_name: businessName,
            business_type: "INDIVIDUAL",
        },
    };

    const xenditResponse = await axios.post(
        XENDIT_BASE_URL,
        xenditPayload,
        {
            auth: { username: XENDIT_SECRET_KEY, password: "" },
            headers: { "Content-Type": "application/json" },
        }
    );

    const xenditAccountId = xenditResponse.data.id;

    if (!xenditAccountId) {
        throw new Error("Failed to create Xendit account.");
    }

    await db.query(
        `UPDATE Landlord SET xendit_account_id = ? WHERE landlord_id = ?`,
        [xenditAccountId, landlordId]
    );

    console.log("[XENDIT] Account created:", xenditAccountId);
    return xenditAccountId;
}
