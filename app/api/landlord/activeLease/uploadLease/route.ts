import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";
import { encryptData } from "@/crypto/encrypt";
import { randomUUID } from "crypto";
import { sendUserNotification } from "@/lib/notifications/sendUserNotification";

// use only for uploading lease agreement

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

/* ---------------------------------------
 * helpers
---------------------------------------- */
const toSafeNumber = (val: FormDataEntryValue | null) => {
    if (val === null || val === "") return null;
    const num = Number(val);
    return Number.isFinite(num) ? num : null;
};

export async function POST(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        /* ---------------------------------------
         * 1️⃣ PARSE FORM DATA
        ---------------------------------------- */
        const formData = await req.formData();

        const agreement_id = formData.get("agreement_id") as string;
        const tenant_id = formData.get("tenant_id") as string;
        const landlord_id = formData.get("landlord_id") as string;
        const leaseFile = formData.get("lease_file") as File;

        const rent_amount = toSafeNumber(formData.get("rent_amount"));
        const security_deposit = toSafeNumber(formData.get("security_deposit"));
        const advance_payment = toSafeNumber(formData.get("advance_payment"));
        const start_date = formData.get("start_date") as string | null;
        const end_date = formData.get("end_date") as string | null;

        if (!agreement_id || !tenant_id || !landlord_id || !leaseFile) {
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        /* ---------------------------------------
         * 2️⃣ FETCH UNIT + TENANT USER ID
        ---------------------------------------- */
        const [[lease]]: any = await connection.query(
            `
      SELECT 
        la.unit_id,
        u.rent_amount AS unit_rent,
        t.user_id AS tenant_user_id
      FROM LeaseAgreement la
      JOIN Unit u ON la.unit_id = u.unit_id
      JOIN Tenant t ON la.tenant_id = t.tenant_id
      WHERE la.agreement_id = ?
      LIMIT 1
      `,
            [agreement_id]
        );

        if (!lease) {
            throw new Error("Lease agreement not found.");
        }

        const { unit_id, unit_rent, tenant_user_id } = lease;

        /* ---------------------------------------
         * 3️⃣ UPLOAD FILE TO S3
        ---------------------------------------- */
        const buffer = Buffer.from(await leaseFile.arrayBuffer());
        const key = `leases/${agreement_id}_${randomUUID()}.pdf`;

        const s3Url = await uploadToS3(
            buffer,
            key,
            leaseFile.type || "application/pdf"
        );

        const encryptedUrl = encryptData(s3Url, SECRET_KEY);

        /* ---------------------------------------
         * 4️⃣ UPDATE LEASE AGREEMENT
        ---------------------------------------- */
        await connection.query(
            `
      UPDATE LeaseAgreement
      SET
        agreement_url = ?,
        status = 'active',
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        rent_amount = COALESCE(?, rent_amount),
        security_deposit_amount = COALESCE(?, security_deposit_amount),
        advance_payment_amount = COALESCE(?, advance_payment_amount),
        updated_at = NOW()
      WHERE agreement_id = ?
      `,
            [
                JSON.stringify(encryptedUrl),
                start_date,
                end_date,
                rent_amount,
                security_deposit,
                advance_payment,
                agreement_id,
            ]
        );

        /* ---------------------------------------
         * 5️⃣ SYNC UNIT RENT (ONLY IF DIFFERENT)
        ---------------------------------------- */
        if (rent_amount !== null && Number(unit_rent) !== rent_amount) {
            await connection.query(
                `
        UPDATE Unit
        SET rent_amount = ?, updated_at = NOW()
        WHERE unit_id = ?
        `,
                [rent_amount, unit_id]
            );
        }

        await connection.commit();

        /* ---------------------------------------
         * 6️⃣ NOTIFY TENANT (CORRECT USER ID)
        ---------------------------------------- */
        await sendUserNotification({
            userId: tenant_user_id,
            title: "Lease Activated",
            body: "Your lease agreement has been uploaded and is now active.",
            url: `/tenant/rentalPortal/${agreement_id}`,
        });

        return NextResponse.json({
            success: true,
            agreement_id,
            file_url: s3Url,
        });
    } catch (error) {
        await connection.rollback();
        console.error("❌ Upload Lease Error:", error);

        return NextResponse.json(
            { error: "Failed to upload lease." },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
