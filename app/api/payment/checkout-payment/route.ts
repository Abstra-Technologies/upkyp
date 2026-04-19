
import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import axios from "axios";

// for landlord subscription checkout payment

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

// Types ----------------------------------------------------------------------
interface RedirectUrls {
    success: string;
    failure: string;
    cancel: string;
}

interface SubscriptionCheckoutBody {
    amount?: number | string; // numeric string accepted; validated later
    description?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    redirectUrl?: RedirectUrls;
    landlord_id?: number | string;
    plan_name?: string; // Standard | Premium | ...
}

// Helpers --------------------------------------------------------------------
function httpError(status: number, message: string, extra?: any) {
    return NextResponse.json({ error: message, ...(extra ? { details: extra } : {}) }, { status });
}

function sanitizeNumber(n: unknown): number | null {
    if (typeof n === "number" && !Number.isNaN(n)) return n;
    if (typeof n === "string" && n.trim() !== "" && !Number.isNaN(Number(n))) return Number(n);
    return null;
}

function sanitizeId(id: unknown): number | null {
    return sanitizeNumber(id);
}

function isoDate(date: Date): string {
    return date.toISOString().split("T")[0];
}

function calcTrialDays(plan: string | undefined | null): number {
    // Adjust as needed. Current logic: Standard -> 10, Premium -> 10, else -> 14.
    if (!plan) return 14;
    if (plan === "Standard" || plan === "Premium") return 10;
    return 14;
}

// DB Connection Factory -------------------------------------------------------
async function getDbConnection() {
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
    if (!DB_HOST || !DB_USER || !DB_NAME) {
        throw new Error("Database environment variables are not fully configured.");
    }
    return mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
    });
}

// POST -----------------------------------------------------------------------
export async function POST(req: NextRequest) {
    let body: SubscriptionCheckoutBody;
    try {
        body = await req.json();
    } catch {
        return httpError(400, "Invalid JSON body.");
    }

    const {
        amount: rawAmount,
        description = "Subscription",
        email = "",
        firstName = "",
        lastName = "",
        redirectUrl,
        landlord_id: rawLandlordId,
        plan_name = "Standard",
    } = body;

    // landlord_id required ------------------------------------------------------
    const landlord_id = sanitizeId(rawLandlordId);
    if (landlord_id === null) {
        return httpError(400, "Missing or invalid landlord_id in request.");
    }

    // Log request (server-side only) -------------------------------------------
    console.log("Incoming Request Data for subscription checkout:", {
        amount: rawAmount,
        description,
        email,
        firstName,
        lastName,
        redirectUrl,
        landlord_id,
        plan_name,
    });

    // Env keys for Maya --------------------------------------------------------
    const publicKey = process.env.MAYA_PUBLIC_KEY;
    const secretKey = process.env.MAYA_SECRET_KEY;
    if (!publicKey || !secretKey) {
        return httpError(500, "Maya keys are not configured on the server.");
    }

    let connection: mysql.Connection | undefined;

    try {
        connection = await getDbConnection();

        // 1. Has user already consumed trial? ------------------------------------
        const [landlordRows] = await connection.execute<mysql.RowDataPacket[]>(
            "SELECT is_trial_used FROM Landlord WHERE landlord_id = ? LIMIT 1",
            [landlord_id]
        );
        const hasUsedTrial = landlordRows.length > 0 && Boolean(landlordRows[0].is_trial_used);
        console.log("Debug - Has Used Trial Before?", hasUsedTrial);

        // 2. Compute dates -------------------------------------------------------
        const start_date = isoDate(new Date());
        const trialDays = calcTrialDays(plan_name);
        const trialStartDate = new Date();
        const trialEndDate = new Date(trialStartDate);
        trialEndDate.setDate(trialStartDate.getDate() + trialDays);
        const formattedTrialEndDate = isoDate(trialEndDate);

        const paidEndDate = new Date();
        paidEndDate.setMonth(paidEndDate.getMonth() + 1);
        const formattedPaidEndDate = isoDate(paidEndDate);

        // 3. Handle free trial (Standard | Premium) if not yet used --------------
        if (!hasUsedTrial && (plan_name === "Standard" || plan_name === "Premium")) {
            console.log("Granting One-Time Free Trial!");

            // mark trial used
            await connection.execute("UPDATE Landlord SET is_trial_used = 1 WHERE landlord_id = ?", [landlord_id]);

            // see if subscription exists
            const [existingSub] = await connection.execute<mysql.RowDataPacket[]>(
                "SELECT subscription_id FROM Subscription WHERE landlord_id = ? LIMIT 1",
                [landlord_id]
            );

            if (existingSub.length > 0) {
                await connection.execute(
                    "UPDATE Subscription SET plan_name = ?, status = 'trial', start_date = ?, end_date = ?, payment_status = 'pending', is_trial = 1, trial_end_date = ? WHERE landlord_id = ?",
                    [plan_name, start_date, formattedTrialEndDate, formattedTrialEndDate, landlord_id]
                );
            } else {
                await connection.execute(
                    "INSERT INTO Subscription (landlord_id, plan_name, status, start_date, end_date, payment_status, created_at, request_reference_number, is_trial, trial_end_date) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)",
                    [
                        landlord_id,
                        plan_name,
                        "trial",
                        start_date,
                        formattedTrialEndDate,
                        "pending",
                        `TRIAL-${Date.now()}`,
                        1,
                        formattedTrialEndDate,
                    ]
                );
            }

            await connection.end();
            return NextResponse.json(
                {
                    message: "Free trial activated successfully.",
                    trialEndDate: formattedTrialEndDate,
                    subscriptionEndDate: formattedTrialEndDate,
                },
                { status: 201 }
            );
        }

        // 4. Trial already used -> must pay --------------------------------------
        const amount = sanitizeNumber(rawAmount);
        if (amount === null) {
            await connection.end();
            return httpError(400, "Invalid amount.");
        }

        // ensure redirectUrl structure exists -----------------------------------
        if (!redirectUrl || !redirectUrl.success || !redirectUrl.failure || !redirectUrl.cancel) {
            await connection.end();
            return httpError(400, "Missing redirectUrl.success / failure / cancel in request body.");
        }

        const requestReferenceNumber = `REF-${Date.now()}`;

        // Build Maya payload -----------------------------------------------------
        const mayaPayload = {
            totalAmount: { value: amount, currency: "PHP" },
            buyer: {
                firstName,
                lastName,
                contact: { email },
            },
            redirectUrl: {
                success: `${redirectUrl.success}?requestReferenceNumber=${encodeURIComponent(requestReferenceNumber)}&landlord_id=${encodeURIComponent(String(landlord_id))}&plan_name=${encodeURIComponent(plan_name)}&amount=${encodeURIComponent(String(amount))}`,
                failure: `${redirectUrl.failure}?requestReferenceNumber=${encodeURIComponent(requestReferenceNumber)}&landlord_id=${encodeURIComponent(String(landlord_id))}&plan_name=${encodeURIComponent(plan_name)}&amount=${encodeURIComponent(String(amount))}`,
                cancel: `${redirectUrl.cancel}?requestReferenceNumber=${encodeURIComponent(requestReferenceNumber)}&landlord_id=${encodeURIComponent(String(landlord_id))}&plan_name=${encodeURIComponent(plan_name)}&amount=${encodeURIComponent(String(amount))}`,
            },
            requestReferenceNumber,
            items: [
                {
                    name: description,
                    quantity: 1,
                    totalAmount: { value: amount, currency: "PHP" },
                },
            ],
        } as const;

        // Call Maya Checkout -----------------------------------------------------
        const mayaAuth = Buffer.from(`${publicKey}:${secretKey}`).toString("base64");
        const mayaResp = await axios.post(
            "https://pg-sandbox.paymaya.com/checkout/v1/checkouts",
            mayaPayload,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Basic ${mayaAuth}`,
                },
            }
        );

        await connection.end();

        return NextResponse.json(
            {
                checkoutUrl: mayaResp.data.redirectUrl,
                requestReferenceNumber,
                landlord_id,
                subscriptionEndDate: formattedPaidEndDate,
                payload: mayaPayload,
            },
            { status: 200 }
        );
    } catch (err: any) {
        console.error("Error during Maya checkout:", err?.message ?? err);
        if (connection) {
            try { await connection.end(); } catch {}
        }
        const details = err?.response?.data || err?.message || String(err);
        return httpError(500, "Payment initiation failed.", details);
    }
}

