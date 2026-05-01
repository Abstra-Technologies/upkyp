import { db } from "@/lib/db";
import puppeteer from "puppeteer";
import { Resend } from "resend";
import { safeDecrypt } from "@/utils/decrypt/safeDecrypt";

const resend = new Resend(process.env.RESEND_API_KEY!);
const XENDIT_SECRET = process.env.XENDIT_TEXT_SECRET_KEY!;
const XENDIT_API_VERSION = "2026-01-01";

function getXenditHeaders(idempotencyKey?: string): Record<string, string> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${XENDIT_SECRET}:`).toString("base64"),
        "api-version": XENDIT_API_VERSION,
    };
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    return headers;
}

async function fetchSubscriptionCycles(recurringPlanId: string): Promise<any[]> {
    const url = `https://api.xendit.co/recurring/plans/${recurringPlanId}/cycles`;
    console.log(`[XENDIT] GET ${url}`);
    const res = await fetch(url, { headers: getXenditHeaders() });
    if (!res.ok) {
        const errBody = await res.text();
        console.error(`[XENDIT] ${res.status} ${res.statusText}: ${errBody}`);
        throw new Error(`Failed to fetch subscription cycles (${res.status}): ${errBody}`);
    }
    const result = await res.json();
    return result.data || [];
}

async function simulateCyclePayment(recurringPlanId: string, cycleId: string, amount: number) {
    const url = `https://api.xendit.co/recurring/plans/${recurringPlanId}/cycles/${cycleId}/simulate`;
    console.log(`[XENDIT] POST ${url}`);
    const res = await fetch(url, {
        method: "POST",
        headers: getXenditHeaders(`simulate-cycle-${cycleId}-${Date.now()}`),
        body: JSON.stringify({ amount }),
    });
    if (!res.ok) {
        const errBody = await res.text();
        console.error(`[XENDIT] ${res.status} ${res.statusText}: ${errBody}`);
        throw new Error(`Failed to simulate cycle payment (${res.status}): ${errBody}`);
    }
    return res.json();
}

async function updateCycleAmount(recurringPlanId: string, cycleId: string, amount: number) {
    const url = `https://api.xendit.co/recurring/plans/${recurringPlanId}/cycles/${cycleId}`;
    console.log(`[XENDIT] PATCH ${url}`);
    const res = await fetch(url, {
        method: "PATCH",
        headers: getXenditHeaders(`update-cycle-${cycleId}-${Date.now()}`),
        body: JSON.stringify({ amount }),
    });
    if (!res.ok) {
        const errBody = await res.text();
        console.error(`[XENDIT] ${res.status} ${res.statusText}: ${errBody}`);
        throw new Error(`Failed to update cycle amount (${res.status}): ${errBody}`);
    }
    return res.json();
}

function generateBillingPdfHtml(data: BillingData): string {
    const {
        landlordName,
        planName,
        billingMonth,
        basePrice,
        unitsByType,
        totalUnits,
        totalUnitCost,
        finalCharge,
        chargeBasis,
        snapshotId,
    } = data;

    const rows = unitsByType
        .map(
            (item) => `
            <tr>
                <td class="capitalize">${item.type}</td>
                <td class="text-center">${item.count}</td>
                <td class="text-right">₱${Number(item.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                <td class="text-right">₱${Number(item.subtotal).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
            </tr>`
        )
        .join("");

    return `
<html>
<head>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; color: #1f2937; background: #fff; }
        header { background: linear-gradient(135deg, #2563eb, #10b981); color: white; padding: 24px 32px; display: flex; align-items: center; justify-content: space-between; }
        header h1 { font-size: 22px; font-weight: 700; }
        header .subtitle { font-size: 12px; opacity: 0.85; margin-top: 2px; }
        .logo { height: 32px; }
        .content { padding: 24px 32px; }
        .landlord-info { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.6; }
        .landlord-info strong { color: #2563eb; }
        h2 { font-size: 16px; color: #1e40af; margin-bottom: 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }
        th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 12px; }
        th { background: #f3f4f6; font-weight: 600; text-align: left; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .capitalize { text-transform: capitalize; }
        .summary-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-top: 16px; }
        .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
        .summary-row.total { border-top: 2px solid #93c5fd; padding-top: 10px; margin-top: 6px; font-weight: 700; font-size: 15px; color: #1e40af; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .badge-floor { background: #fef3c7; color: #92400e; }
        .badge-unit { background: #d1fae5; color: #065f46; }
        footer { margin-top: 40px; padding: 12px 0; text-align: center; color: #6b7280; font-size: 11px; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <header>
        <div>
            <h1>UpKyp Billing Statement</h1>
            <div class="subtitle">Monthly Subscription Usage Report</div>
        </div>
        <img src="https://upkyp.s3.amazonaws.com/assets/upkyp-logo-light.png" alt="UpKyp Logo" class="logo" />
    </header>
    <div class="content">
        <div class="landlord-info">
            <p><strong>Landlord:</strong> ${landlordName}</p>
            <p><strong>Plan:</strong> ${planName}</p>
            <p><strong>Billing Period:</strong> ${billingMonth}</p>
            <p><strong>Snapshot ID:</strong> ${snapshotId}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString("en-PH", { dateStyle: "long", timeStyle: "short" })}</p>
        </div>
        <h2>Unit Usage Breakdown</h2>
        <table>
            <thead>
                <tr>
                    <th>Property Type</th>
                    <th class="text-center">Units</th>
                    <th class="text-right">Price / Unit</th>
                    <th class="text-right">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
        <div class="summary-box">
            <div class="summary-row">
                <span>Plan Floor Price</span>
                <span>₱${Number(basePrice).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="summary-row">
                <span>Total Unit Cost (${totalUnits} units)</span>
                <span>₱${Number(totalUnitCost).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="summary-row">
                <span>Charge Basis</span>
                <span class="badge ${chargeBasis === "floor_price" ? "badge-floor" : "badge-unit"}">${chargeBasis === "floor_price" ? "Floor Price Applied" : "Unit-Based"}</span>
            </div>
            <div class="summary-row total">
                <span>Final Charge</span>
                <span>₱${Number(finalCharge).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
            </div>
        </div>
    </div>
    <footer>
        Ⓒ ${new Date().getFullYear()} UpKyp Property Management System — Empowering Landlords with Automation
    </footer>
</body>
</html>`;
}

interface BillingData {
    landlordName: string;
    planName: string;
    billingMonth: string;
    basePrice: number;
    unitsByType: { type: string; count: number; price: number; subtotal: number }[];
    totalUnits: number;
    totalUnitCost: number;
    finalCharge: number;
    chargeBasis: string;
    snapshotId: number;
}

async function generatePdfBuffer(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
}

async function sendBillingEmail(email: string, landlordName: string, billingMonth: string, finalCharge: number, pdfBuffer: Buffer, filename: string) {
    try {
        await resend.emails.send({
            from: "UpKyp <noreply@upkyp.com>",
            to: [email],
            subject: `UpKyp Billing Statement – ${billingMonth}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Your UpKyp Billing Statement</h2>
                    <p>Hi ${landlordName},</p>
                    <p>Your billing statement for <strong>${billingMonth}</strong> is now available. The final charge for this period is <strong>₱${Number(finalCharge).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</strong>.</p>
                    <p>Please find the detailed billing statement attached as a PDF.</p>
                    <p style="margin-top: 24px; color: #6b7280; font-size: 13px;">If you have any questions, please contact our support team.</p>
                    <p style="color: #6b7280; font-size: 13px;">Best regards,<br/>The UpKyp Team</p>
                </div>
            `,
            attachments: [
                {
                    filename,
                    content: pdfBuffer,
                },
            ],
            tags: [
                { name: "type", value: "transactional" },
                { name: "category", value: "billing-statement" },
            ],
        });
        console.log(`Billing email sent to ${email}`);
    } catch (err: any) {
        console.error(`Failed to send billing email to ${email}:`, err.message);
    }
}

export async function generateSubscriptionBillingSnapshots() {
    console.log("[BILLING CRON] ========== START ==========");
    try {
        const tomorrow = new Date();
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        tomorrow.setUTCHours(0, 0, 0, 0);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];
        console.log(`[BILLING CRON] Stage 1: Target anchor date = ${tomorrowStr}`);

        const [activeSubscriptions]: any = await db.execute(`
            SELECT
                s.subscription_id,
                s.landlord_id,
                s.start_date,
                s.anchor_day,
                s.recurring_plan_id,
                p.plan_id,
                p.name AS plan_name,
                p.price AS base_price
            FROM Subscription s
            JOIN Plan p ON s.plan_id = p.plan_id
            WHERE s.subscription_status = 'active'
              AND DATE(s.anchor_day) = ?
        `, [tomorrowStr]);

        console.log(`[BILLING CRON] Stage 2: Found ${activeSubscriptions.length} active subscription(s) due tomorrow`);

        if (!activeSubscriptions.length) {
            console.log("[BILLING CRON] No subscriptions with billing anchor date tomorrow. Exiting.");
            return 0;
        }

        const billingMonth = new Date();
        billingMonth.setDate(1);
        billingMonth.setHours(0, 0, 0, 0);
        const billingMonthStr = billingMonth.toISOString().split("T")[0];
        const billingMonthLabel = billingMonth.toLocaleDateString("en-US", { year: "numeric", month: "long" });
        console.log(`[BILLING CRON] Stage 3: Billing month = ${billingMonthLabel} (${billingMonthStr})`);

        let processedCount = 0;

        for (const sub of activeSubscriptions) {
            console.log(`[BILLING CRON] ========== Processing subscription ${sub.subscription_id} (landlord: ${sub.landlord_id}) ==========`);
            console.log(`[BILLING CRON]   Plan: ${sub.plan_name}, Base Price: ${sub.base_price}, recurring_plan_id: "${sub.recurring_plan_id}"`);

            let connection: any = null;

            try {
                const [existingSnapshot]: any = await db.execute(
                    `SELECT snapshot_id FROM SubscriptionMonthlyBillingSnapshot 
                     WHERE subscription_id = ? AND billing_month = ?`,
                    [sub.subscription_id, billingMonthStr]
                );

                if (existingSnapshot.length > 0) {
                    console.log(`[BILLING CRON] Stage 4: Snapshot already exists (id: ${existingSnapshot[0].snapshot_id}) for subscription ${sub.subscription_id}, month ${billingMonthStr}. Skipping.`);
                    continue;
                }
                console.log(`[BILLING CRON] Stage 4: No existing snapshot. Proceeding.`);

                const anchorDate = new Date(sub.anchor_day);
                const periodEnd = new Date(anchorDate);
                periodEnd.setDate(periodEnd.getDate() - 1);
                periodEnd.setHours(23, 59, 59, 0);

                let periodStart = new Date(sub.start_date);
                const oneMonthBeforeAnchor = new Date(anchorDate);
                oneMonthBeforeAnchor.setMonth(oneMonthBeforeAnchor.getMonth() - 1);
                if (periodStart < oneMonthBeforeAnchor) {
                    periodStart = oneMonthBeforeAnchor;
                }
                console.log(`[BILLING CRON] Stage 5: Billing period = ${periodStart.toISOString()} to ${periodEnd.toISOString()}`);

                const [unitPriceRows]: any = await db.execute(
                    `SELECT property_type, unit_price FROM PlanUnitPriceByPropertyType WHERE plan_id = ?`,
                    [sub.plan_id]
                );
                console.log(`[BILLING CRON] Stage 6: Fetched ${unitPriceRows.length} unit price row(s) for plan ${sub.plan_id}`);

                const unitPricesByType: Record<string, number> = {};
                unitPriceRows.forEach((row: any) => {
                    unitPricesByType[row.property_type] = Number(row.unit_price);
                });

                const [properties]: any = await db.execute(
                    `SELECT p.property_type, COUNT(u.unit_id) AS unit_count
                     FROM Property p
                     LEFT JOIN Unit u ON p.property_id = u.property_id
                     WHERE p.landlord_id = ?
                     GROUP BY p.property_type`,
                    [sub.landlord_id]
                );
                console.log(`[BILLING CRON] Stage 7: Landlord ${sub.landlord_id} has ${properties.length} property type(s)`);

                let totalUnits = 0;
                let totalUnitCost = 0;
                const unitsByType: { type: string; count: number; price: number; subtotal: number }[] = [];

                properties.forEach((row: any) => {
                    const type = row.property_type || "residential";
                    const count = Number(row.unit_count) || 0;
                    const price = Number(unitPricesByType[type]) || 0;
                    const subtotal = count * price;
                    totalUnits += count;
                    totalUnitCost += subtotal;
                    unitsByType.push({ type, count, price, subtotal });
                    console.log(`[BILLING CRON]   Unit type: ${type}, count: ${count}, price: ${price}, subtotal: ${subtotal}`);
                });

                const basePrice = Number(sub.base_price);
                const totalComputed = totalUnitCost;
                const finalCharge = Math.max(basePrice, totalComputed);
                const chargeBasis = finalCharge === basePrice ? "floor_price" : "unit_based";
                console.log(`[BILLING CRON] Stage 8: basePrice=${basePrice}, totalComputed=${totalComputed}, finalCharge=${finalCharge}, chargeBasis=${chargeBasis}`);

                let xenditCycleId: string | null = null;
                if (sub.recurring_plan_id) {
                    console.log(`[BILLING CRON] Stage 9: Processing Xendit recurring_plan_id="${sub.recurring_plan_id}"`);

                    console.log(`[BILLING CRON]   Stage 9a: Fetching cycles...`);
                    const allCycles = await fetchSubscriptionCycles(sub.recurring_plan_id);
                    const cycles = allCycles.filter((c: any) => c.status === "SCHEDULED");
                    console.log(`[BILLING CRON]   Stage 9a: Found ${cycles.length} scheduled cycle(s) out of ${allCycles.length} total`);

                    console.log(`[BILLING CRON]   Stage 9b: Searching for cycle scheduled on ${tomorrowStr}...`);
                    const targetCycle = cycles.find((c: any) => {
                        const scheduledDate = new Date(c.scheduled_timestamp);
                        const scheduledDateStr = scheduledDate.toISOString().split("T")[0];
                        return scheduledDateStr === tomorrowStr;
                    });

                    if (targetCycle) {
                        xenditCycleId = targetCycle.id;
                        console.log(`[BILLING CRON]   Stage 9b: Found target cycle id=${xenditCycleId}, scheduled_timestamp=${targetCycle.scheduled_timestamp}`);
                    } else {
                        console.log(`[BILLING CRON]   Stage 9b: No matching cycle found for ${tomorrowStr}`);
                    }

                    if (xenditCycleId) {
                        console.log(`[BILLING CRON]   Stage 9c: Updating cycle ${xenditCycleId} amount to ${finalCharge}...`);
                        const updateResult = await updateCycleAmount(sub.recurring_plan_id, xenditCycleId, finalCharge);
                        console.log(`[BILLING CRON]   Stage 9c: Update result:`, JSON.stringify(updateResult));

                        console.log(`[BILLING CRON]   Stage 9d: Simulating cycle payment for ${xenditCycleId} with amount ${finalCharge}...`);
                        const simResult = await simulateCyclePayment(sub.recurring_plan_id, xenditCycleId, finalCharge);
                        console.log(`[BILLING CRON]   Stage 9d: Simulate result:`, JSON.stringify(simResult));
                    } else {
                        console.log(`[BILLING CRON]   Stage 9c/9d: Skipped (no xenditCycleId)`);
                    }
                } else {
                    console.log(`[BILLING CRON] Stage 9: No recurring_plan_id. Skipping Xendit operations.`);
                }

                console.log(`[BILLING CRON] Stage 10: Starting DB transaction...`);
                connection = await db.getConnection();
                await connection.beginTransaction();

                console.log(`[BILLING CRON] Stage 10: Inserting snapshot with xendit_cycle_id=${xenditCycleId}...`);
                const [snapResult]: any = await connection.execute(
                    `INSERT INTO SubscriptionMonthlyBillingSnapshot 
                     (subscription_id, xendit_cycle_id, billing_month, billing_period_start, billing_period_end, cutoff_at,
                      applied_floor_price, total_computed, final_charge, charge_basis, sync_status)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
                    [sub.subscription_id, xenditCycleId, billingMonthStr, periodStart.toISOString(), periodEnd.toISOString(), new Date().toISOString(), basePrice, totalComputed, finalCharge, chargeBasis]
                );

                const snapshotId = snapResult.insertId;
                console.log(`[BILLING CRON] Stage 10: Snapshot inserted with id=${snapshotId}, xendit_cycle_id=${xenditCycleId}`);

                console.log(`[BILLING CRON] Stage 11: Inserting ${unitsByType.length} snapshot item(s)...`);
                for (const item of unitsByType) {
                    await connection.execute(
                        `INSERT INTO SubscriptionMonthlyBillingSnapshotItem 
                         (snapshot_id, property_type, units_used, unit_price, computed_amount)
                         VALUES (?, ?, ?, ?, ?)`,
                        [snapshotId, item.type, item.count, item.price, item.subtotal]
                    );
                }
                console.log(`[BILLING CRON] Stage 11: All snapshot items inserted.`);

                const nextAnchorDay = new Date(anchorDate);
                nextAnchorDay.setUTCMonth(nextAnchorDay.getUTCMonth() + 1);
                console.log(`[BILLING CRON] Stage 12: Advancing anchor_day from ${anchorDate.toISOString()} to ${nextAnchorDay.toISOString()}`);

                await connection.execute(
                    `UPDATE Subscription SET anchor_day = ? WHERE subscription_id = ?`,
                    [nextAnchorDay.toISOString(), sub.subscription_id]
                );
                console.log(`[BILLING CRON] Stage 12: anchor_day updated.`);

                await connection.commit();
                console.log(`[BILLING CRON] Stage 12: Transaction committed successfully.`);

                console.log(`[BILLING CRON] Stage 13: Fetching landlord details for email...`);
                try {
                    const [landlordRows]: any = await db.execute(
                        `SELECT l.landlord_id, u.firstName, u.lastName, u.email
                         FROM Landlord l
                         JOIN User u ON l.user_id = u.user_id
                         WHERE l.landlord_id = ? LIMIT 1`,
                        [sub.landlord_id]
                    );

                    if (landlordRows.length > 0) {
                        const landlord = landlordRows[0];
                        const decryptedEmail = safeDecrypt(landlord.email);
                        const firstName = safeDecrypt(landlord.firstName) || "Landlord";
                        const lastName = safeDecrypt(landlord.lastName) || "";
                        const landlordName = `${firstName} ${lastName}`.trim();
                        console.log(`[BILLING CRON] Stage 13: Landlord = ${landlordName}, Email decrypted = ${!!decryptedEmail}`);

                        if (decryptedEmail) {
                            const pdfData: BillingData = {
                                landlordName,
                                planName: sub.plan_name,
                                billingMonth: billingMonthLabel,
                                basePrice,
                                unitsByType,
                                totalUnits,
                                totalUnitCost,
                                finalCharge,
                                chargeBasis,
                                snapshotId,
                            };

                            console.log(`[BILLING CRON] Stage 13: Generating PDF...`);
                            const html = generateBillingPdfHtml(pdfData);
                            const pdfBuffer = await generatePdfBuffer(html);
                            console.log(`[BILLING CRON] Stage 13: PDF generated (${pdfBuffer.length} bytes)`);

                            const filename = `Billing_Statement_${billingMonthLabel.replace(/ /g, "_")}_${sub.landlord_id}.pdf`;
                            console.log(`[BILLING CRON] Stage 13: Sending email to ${decryptedEmail}...`);
                            await sendBillingEmail(decryptedEmail, landlordName, billingMonthLabel, finalCharge, pdfBuffer, filename);
                            console.log(`[BILLING CRON] Stage 13: Email sent.`);
                        } else {
                            console.log(`[BILLING CRON] Stage 13: Skipped email (decrypted email is null/empty)`);
                        }
                    } else {
                        console.log(`[BILLING CRON] Stage 13: No landlord found for landlord_id=${sub.landlord_id}`);
                    }
                } catch (err: any) {
                    console.error(`[BILLING CRON] Stage 13: Failed to generate/send PDF for subscription ${sub.subscription_id}:`, err.message);
                    console.error(`[BILLING CRON] Stage 13: Stack:`, err.stack);
                }

                processedCount++;
                console.log(`[BILLING CRON] ========== Completed subscription ${sub.subscription_id}: ${totalUnits} units, ₱${finalCharge} charge, xendit_cycle_id=${xenditCycleId} ==========`);

            } catch (err: any) {
                console.error(`[BILLING CRON] FAILED for subscription ${sub.subscription_id}:`, err.message);
                console.error(`[BILLING CRON]   recurring_plan_id used: "${sub.recurring_plan_id}"`);
                console.error(`[BILLING CRON]   Stack:`, err.stack);

                if (connection) {
                    try {
                        await connection.rollback();
                        console.log(`[BILLING CRON]   Transaction rolled back. No snapshot created.`);
                    } catch (rollbackErr: any) {
                        console.error(`[BILLING CRON]   Rollback failed:`, rollbackErr.message);
                    }
                }
            } finally {
                if (connection) {
                    try {
                        connection.release();
                    } catch (relErr: any) {
                        console.error(`[BILLING CRON]   Connection release failed:`, relErr.message);
                    }
                }
            }
        }

        console.log(`[BILLING CRON] ========== END: Generated ${processedCount} billing snapshot(s) ==========`);
        return processedCount;
    } catch (error: any) {
        console.error("[BILLING CRON] ========== FATAL ERROR ==========");
        console.error("[BILLING CRON] Error:", error.message);
        console.error("[BILLING CRON] Stack:", error.stack);
        console.error("[BILLING CRON] ========== END (FAILURE) ==========");
        throw error;
    }
}
