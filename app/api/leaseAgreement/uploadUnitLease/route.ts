import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/s3";
import { encryptData } from "@/crypto/encrypt";
import { getSessionUser } from "@/lib/auth/auth";

function sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

export async function POST(req: NextRequest) {
    const session = await getSessionUser();

    if (!session || !session.landlord_id) {
        return NextResponse.json(
            { success: false, error: "Unauthorized" },
            { status: 401 }
        );
    }

    const landlordId = session.landlord_id;

    const connection = await db.getConnection();

    try {
        const formData = await req.formData();

        const agreement_id = formData.get("agreement_id") as string;
        const signatureOption = formData.get("signatureOption") as string;
        const leaseFile = formData.get("leaseFile") as File | null;
        const startDate = formData.get("startDate") as string;
        const endDate = formData.get("endDate") as string;
        const securityDepositAmount = Number(formData.get("securityDepositAmount") || 0);
        const advancePaymentAmount = Number(formData.get("advancePaymentAmount") || 0);

        if (!agreement_id || !leaseFile) {
            return NextResponse.json(
                { success: false, error: "agreement_id and leaseFile are required" },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        const [leaseRows]: any = await connection.execute(
            `SELECT tenant_id, unit_id FROM LeaseAgreement WHERE agreement_id = ? LIMIT 1`,
            [agreement_id]
        );

        if (!leaseRows || leaseRows.length === 0) {
            await connection.rollback();
            return NextResponse.json(
                { success: false, error: "Lease agreement not found" },
                { status: 404 }
            );
        }

        const { tenant_id, unit_id } = leaseRows[0];

        const [unitInfo]: any = await connection.execute(
            `SELECT property_id FROM Unit WHERE unit_id = ? LIMIT 1`,
            [unit_id]
        );

        if (!unitInfo || unitInfo.length === 0) {
            await connection.rollback();
            return NextResponse.json(
                { success: false, error: "Unit not found" },
                { status: 404 }
            );
        }

        const property_id = unitInfo[0].property_id;

        const buffer = Buffer.from(await leaseFile.arrayBuffer());
        const sanitizedFilename = sanitizeFilename(leaseFile.name || `Lease_${agreement_id}.pdf`);
        const key = `${landlordId}/${property_id}/${process.env.NEXT_AWS_LEASE_AGREEMENTS}/${agreement_id}/${Date.now()}_${sanitizedFilename}`;

        const s3Url = await uploadToS3(buffer, key, "application/pdf");
        const encryptedUrl = JSON.stringify(encryptData(s3Url, process.env.ENCRYPTION_SECRET!));

        const isSecPaid = !securityDepositAmount ? 1 : 0;
        const isAdvPaid = !advancePaymentAmount ? 1 : 0;

        await connection.execute(
            `
                UPDATE LeaseAgreement
                SET
                    start_date = ?,
                    end_date = ?,
                    agreement_url = ?,
                    security_deposit_amount = ?,
                    advance_payment_amount = ?,
                    is_security_deposit_paid = ?,
                    is_advance_payment_paid = ?,
                    status = ?,
                    updated_at = NOW()
                WHERE agreement_id = ?
            `,
            [
                startDate,
                endDate,
                encryptedUrl,
                securityDepositAmount,
                advancePaymentAmount,
                isSecPaid,
                isAdvPaid,
                signatureOption === "signed" ? "active" : "pending",
                agreement_id,
            ]
        );

        if (signatureOption === "docusign") {
            await connection.execute(
                `INSERT INTO LeaseSignature (agreement_id, role, status)
                 VALUES (?, 'landlord', 'pending'), (?, 'tenant', 'pending')`,
                [agreement_id, agreement_id]
            );
        }

        const [tenantUser]: any = await connection.execute(
            `
                SELECT u.user_id
                FROM Tenant t
                         JOIN User u ON t.user_id = u.user_id
                WHERE t.tenant_id = ?
                LIMIT 1
            `,
            [tenant_id]
        );

        if (tenantUser.length > 0) {
            const user_id = tenantUser[0].user_id;

            const [propInfo]: any = await connection.execute(
                `
                    SELECT p.property_name, u.unit_name
                    FROM Unit u
                    JOIN Property p ON u.property_id = p.property_id
                    WHERE u.unit_id = ?
                    LIMIT 1
                `,
                [unit_id]
            );

            const property_name = propInfo?.[0]?.property_name || "Property";
            const unit_name = propInfo?.[0]?.unit_name || "Unit";

            const notifTitle = "Lease Activated";
            const notifBody = `A lease agreement has been uploaded for ${property_name} – ${unit_name}.`;

            await connection.execute(
                `
                    INSERT INTO Notification (user_id, title, body, url, is_read, created_at)
                    VALUES (?, ?, ?, ?, 0, NOW())
                `,
                [
                    user_id,
                    notifTitle,
                    notifBody,
                    `/tenant/lease/view/${agreement_id}`,
                ]
            );
        }

        await connection.commit();

        return NextResponse.json({
            success: true,
            message: "Lease uploaded and saved successfully.",
            s3Url,
        });
    } catch (error: any) {
        console.error("Lease Upload Error:", error);
        await connection.rollback();
        return NextResponse.json(
            { success: false, error: `Lease upload failed: ${error.message}` },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
