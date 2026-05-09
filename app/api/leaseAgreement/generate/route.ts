import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/s3";
import { encryptData } from "@/crypto/encrypt";
import { getSessionUser } from "@/lib/auth/auth";
import puppeteer from "puppeteer";

function sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

export async function POST(req: NextRequest) {
    const session = await getSessionUser();

    if (!session || !session.landlord_id) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const landlordId = session.landlord_id;

    const connection = await db.getConnection();

    try {
        const {
            unitId,
            startDate,
            endDate,
            depositAmount,
            advanceAmount,
            gracePeriod,
            latePenalty,
            billingDueDay,
            expenses,
            otherPenalties,
            content,
        } = await req.json();

        if (!unitId || !startDate || !endDate || !content) {
            return NextResponse.json(
                { error: "unitId, startDate, endDate, and content are required" },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        const [unitInfo]: any = await connection.execute(
            `SELECT property_id FROM Unit WHERE unit_id = ? LIMIT 1`,
            [unitId]
        );

        if (!unitInfo || unitInfo.length === 0) {
            await connection.rollback();
            return NextResponse.json(
                { error: "Unit not found" },
                { status: 404 }
            );
        }

        const property_id = unitInfo[0].property_id;

        const [leaseRows] = await connection.execute(
            `SELECT agreement_id, tenant_id
             FROM LeaseAgreement
             WHERE unit_id = ? AND status = 'pending'
             LIMIT 1`,
            [unitId]
        );

        let tenant_id: number | null = null;
        let agreement_id: number | null = null;
        let isFromLeaseAgreement = false;

        if ((leaseRows as any[]).length > 0) {
            tenant_id = (leaseRows as any[])[0].tenant_id;
            agreement_id = (leaseRows as any[])[0].agreement_id;
            isFromLeaseAgreement = true;
        } else {
            const [ptRows] = await connection.execute(
                `SELECT tenant_id
                 FROM ProspectiveTenant
                 WHERE unit_id = ? AND status = 'approved'
                 LIMIT 1`,
                [unitId]
            );

            if ((ptRows as any[]).length === 0) {
                await connection.rollback();
                return NextResponse.json(
                    { error: "No approved tenant found for this unit" },
                    { status: 404 }
                );
            }
            tenant_id = (ptRows as any[])[0].tenant_id;
        }

        const [existingLease] = await connection.execute(
            `SELECT agreement_id
             FROM LeaseAgreement
             WHERE tenant_id = ? AND unit_id = ? AND status != 'pending'`,
            [tenant_id, unitId]
        );

        if ((existingLease as any[]).length > 0) {
            await connection.rollback();
            return NextResponse.json(
                { error: "Active lease already exists for this tenant and unit." },
                { status: 409 }
            );
        }

        const browser = await puppeteer.launch({
            // @ts-ignore
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();
        await page.setContent(`
            <html>
                <head><meta charset="UTF-8" /></head>
                <body>${content}</body>
            </html>
        `);
        const pdfBuffer = Buffer.from(await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "1in",
                bottom: "1in",
                left: "0.75in",
                right: "0.75in",
            },
        }));
        await browser.close();

        const sanitizedFilename = sanitizeFilename(`Lease_${unitId}.pdf`);
        const key = `${landlordId}/${property_id}/${process.env.NEXT_AWS_LEASE_AGREEMENTS}/${agreement_id || 'pending'}/${Date.now()}_${sanitizedFilename}`;

        const s3Url = await uploadToS3(pdfBuffer, key, "application/pdf");
        const encryptedUrl = JSON.stringify(encryptData(s3Url, process.env.ENCRYPTION_SECRET!));

        if (isFromLeaseAgreement && agreement_id) {
            await connection.execute(
                `UPDATE LeaseAgreement
                 SET agreement_url = ?, start_date = ?, end_date = ?,
                     security_deposit_amount = ?, advance_payment_amount = ?,
                     grace_period_days = ?, late_penalty_amount = ?, billing_due_day = ?,
                     updated_at = NOW()
                 WHERE agreement_id = ?`,
                [
                    encryptedUrl,
                    startDate,
                    endDate,
                    Number(depositAmount) || 0,
                    Number(advanceAmount) || 0,
                    Number(gracePeriod) || 3,
                    Number(latePenalty) || 1000,
                    Number(billingDueDay) || 1,
                    agreement_id,
                ]
            );
        } else {
            const [insertResult]: any = await connection.execute(
                `INSERT INTO LeaseAgreement
                 (tenant_id, unit_id, start_date, end_date, agreement_url,
                  security_deposit_amount, advance_payment_amount,
                  grace_period_days, late_penalty_amount, billing_due_day,
                  created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    tenant_id,
                    unitId,
                    startDate,
                    endDate,
                    encryptedUrl,
                    Number(depositAmount) || 0,
                    Number(advanceAmount) || 0,
                    Number(gracePeriod) || 3,
                    Number(latePenalty) || 1000,
                    Number(billingDueDay) || 1,
                ]
            );
            agreement_id = insertResult.insertId;
        }

        if (agreement_id) {
            await connection.execute(
                `INSERT INTO LeaseSignature (agreement_id, role, status)
                 VALUES (?, 'landlord', 'pending'), (?, 'tenant', 'pending')`,
                [agreement_id, agreement_id]
            );
        }

        if (expenses && Array.isArray(expenses)) {
            for (const row of expenses) {
                if (!row.type || !row.amount) continue;

                await connection.execute(
                    `INSERT INTO LeaseAdditionalExpense 
                     (agreement_id, category, expense_type, amount, frequency, created_at)
                     VALUES (?, ?, ?, ?, ?, NOW())`,
                    [
                        agreement_id,
                        row.category || "excluded_fee",
                        row.type,
                        Number(row.amount),
                        row.frequency || "monthly",
                    ]
                );
            }
        }

        if (otherPenalties && Array.isArray(otherPenalties)) {
            for (const row of otherPenalties) {
                if (!row.type || !row.amount) continue;

                await connection.execute(
                    `INSERT INTO LeaseAdditionalExpense 
                     (agreement_id, category, expense_type, amount, frequency, created_at)
                     VALUES (?, ?, ?, ?, ?, NOW())`,
                    [
                        agreement_id,
                        "penalty",
                        row.type,
                        Number(row.amount),
                        "one_time",
                    ]
                );
            }
        }

        await connection.commit();

        return NextResponse.json({
            message: "Lease agreement generated & uploaded successfully.",
            fileBase64: Buffer.from(pdfBuffer).toString("base64"),
            signedUrl: s3Url,
            fileKey: key,
            agreementId: agreement_id,
        });

    } catch (error: any) {
        await connection.rollback();
        console.error("Lease Generation Error:", error);
        return NextResponse.json(
            { error: "Internal server error", message: error.message },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
