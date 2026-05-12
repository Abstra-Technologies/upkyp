// API used for system geenrated lease.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import puppeteer from "puppeteer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { encryptData, decryptData } from "@/crypto/encrypt";
import { v4 as uuidv4 } from "uuid";

// AWS S3 client
const s3Client = new S3Client({
    region: process.env.NEXT_AWS_REGION!,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

export async function POST(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        const body = await req.json();

        const {
            agreement_id,
            property_id,
            lease_type,
            start_date,
            end_date,
            rent_amount,
            billing_due_day,
            grace_period_days,
            late_fee_amount,
            security_deposit,
            advance_payment,

            // missing ones from your payload:
            rent_changed,
            allowed_occupants,
            notice_period,
            maintenance_responsibility,
            pet_policy,
            smoking_policy,
            utilities,
            furnishing_policy,
            termination_clause,
            entry_notice,
            attestation,

            landlord_id,
            tenant_id,
            property_name,
            unit_name,
        } = body;


        if (!agreement_id || !property_id) {
            return NextResponse.json(
                { error: "Missing required parameters." },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        // 1) Update LeaseAgreement
        await connection.query(
            `
      UPDATE LeaseAgreement
      SET
        start_date = ?,
        end_date = ?,
        rent_amount = ?,
        security_deposit_amount = ?,
        advance_payment_amount = ?,
        billing_due_day = ?,
        grace_period_days = ?,
        late_penalty_amount = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE agreement_id = ?
      `,
            [
                start_date,
                end_date,
                rent_amount,
                security_deposit || 0,
                advance_payment || 0,
                billing_due_day,
                grace_period_days,
                late_fee_amount,
                agreement_id,
            ]
        );

        // 2) Insert SecurityDeposit record if provided (>0)
        if (Number(security_deposit) > 0) {
            await connection.query(
                `
        INSERT INTO SecurityDeposit (lease_id, tenant_id, amount, status, created_at, updated_at)
        VALUES (?, ?, ?, 'unpaid', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
                [agreement_id, tenant_id, security_deposit]
            );
        }

        // 3) Insert AdvancePayment record if provided (>0)
        if (Number(advance_payment) > 0) {
            await connection.query(
                `
        INSERT INTO AdvancePayment (lease_id, tenant_id, amount, months_covered, status, created_at, updated_at)
        VALUES (?, ?, ?, 1, 'unpaid', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
                [agreement_id, tenant_id, advance_payment]
            );
        }

        // 4) Fetch landlord + tenant user info (encrypted fields handled)
        const [rows] = await connection.query(
            `
      SELECT 
        u1.firstName AS landlord_firstName,
        u1.lastName AS landlord_lastName,
        u1.address AS landlord_address,
        u1.email AS landlord_email,
        u2.firstName AS tenant_firstName,
        u2.lastName AS tenant_lastName,
        u2.address AS tenant_address,
        u2.email AS tenant_email
      FROM Landlord l
      JOIN User u1 ON l.user_id = u1.user_id
      JOIN Tenant t ON t.tenant_id = ?
      JOIN User u2 ON t.user_id = u2.user_id
      WHERE l.landlord_id = ?
      LIMIT 1
      `,
            [tenant_id, landlord_id]
        );

        if (!rows.length) throw new Error("Landlord or tenant not found.");

        const decryptField = (field: any) => {
            try {
                if (!field) return "N/A";
                // fields may already be plain or stored as stringified JSON ciphertext
                if (typeof field === "string" && field.startsWith("{")) {
                    return decryptData(JSON.parse(field), process.env.ENCRYPTION_SECRET!);
                }
                return field;
            } catch {
                return field || "N/A";
            }
        };

        const data = rows[0];
        const info = {
            landlord_firstName: decryptField(data.landlord_firstName),
            landlord_lastName: decryptField(data.landlord_lastName),
            landlord_address: decryptField(data.landlord_address),
            landlord_email: decryptField(data.landlord_email),
            tenant_firstName: decryptField(data.tenant_firstName),
            tenant_lastName: decryptField(data.tenant_lastName),
            tenant_address: decryptField(data.tenant_address),
            tenant_email: decryptField(data.tenant_email),
        };

        // 5) Build a more formal PDF template
        const today = new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });

        const rentText = rent_amount ? `₱${Number(rent_amount).toLocaleString()}` : "N/A";
        const securityDepositText = security_deposit ? `₱${Number(security_deposit).toLocaleString()}` : "N/A";
        const advancePaymentText = advance_payment ? `₱${Number(advance_payment).toLocaleString()}` : "N/A";
        const lateFeeText = late_fee_amount ? `₱${Number(late_fee_amount).toLocaleString()}` : "N/A";

        const leaseHTML = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    @page { margin: 50px; }
    body {
      font-family: "Times New Roman", serif;
      color: #222;
      line-height: 1.65;
      font-size: 12.5pt;
      margin: 0;
      text-align: justify;
    }
    .container { margin: 50px; }
    header { text-align: center; margin-bottom: 25px; }
    h1 { font-size: 22pt; margin: 0; letter-spacing: 1px; text-transform: uppercase; }
    h2 { font-size: 14pt; margin-top: 30px; margin-bottom: 10px; text-transform: uppercase; }
    p { margin: 12px 0; }
    .signature-block { margin-top: 70px; display: flex; justify-content: space-between; }
    .signature { width: 45%; text-align: center; }
    .signature-line { border-top: 1px solid #000; margin-top: 55px; }
    footer { position: fixed; bottom: 20px; width: 100%; text-align: center; font-size: 10pt; color: #666; }
  </style>
</head>

<body>
  <div class="container">

    <header>
      <h1>${lease_type === "commercial" ? "COMMERCIAL LEASE AGREEMENT" : "RESIDENTIAL LEASE AGREEMENT"}</h1>
      <p>Executed on ${today}</p>
    </header>

    <h2>1. Parties</h2>
    <p>
      This Lease Agreement is entered into by and between <strong>${info.landlord_firstName} ${info.landlord_lastName}</strong>,
      residing at ${info.landlord_address} with email address ${info.landlord_email} (the "Landlord"),
      and <strong>${info.tenant_firstName} ${info.tenant_lastName}</strong>,
      residing at ${info.tenant_address} with email address ${info.tenant_email} (the "Tenant").
      Both parties voluntarily enter into this Agreement and acknowledge that they have the legal capacity to contract.
    </p>

    <h2>2. Premises</h2>
    <p>
      The Landlord leases to the Tenant the premises located at <strong>${property_name}</strong>,
      specifically identified as Unit <strong>${unit_name}</strong>. The Tenant acknowledges that the premises have been inspected
      prior to the execution of this Agreement and accepts the property in its present condition, including all fixtures,
      furnishings, and appurtenances provided therein.
    </p>

    <h2>3. Term of Lease</h2>
    <p>
      The lease term shall commence on <strong>${start_date}</strong> and shall terminate on <strong>${end_date}</strong>,
      unless earlier terminated in accordance with the provisions of this Agreement. The Tenant acknowledges that the type
      of lease agreed upon is categorized as <strong>${lease_type}</strong>. If applicable, any modification to the previous
      rent amount is confirmed by the rent change status indicated in this Agreement.
    </p>

    <h2>4. Rent and Payment Obligations</h2>
    <p>
      The Tenant agrees to pay the Landlord a monthly rental fee amounting to
      <strong>₱${Number(rent_amount).toLocaleString()}</strong>, which shall be due every
      <strong>${billing_due_day}</strong> day of each month. The Tenant shall also pay a security deposit in the amount of
      <strong>₱${Number(security_deposit).toLocaleString()}</strong>, which shall answer for any unpaid obligations or damages
      beyond normal wear and tear. In addition, the Tenant agrees to pay an advance rental amounting to
      <strong>₱${Number(advance_payment).toLocaleString()}</strong>, which shall be applied to the appropriate rental period.
    </p>

    <p>
      The Tenant shall be granted a grace period of <strong>${grace_period_days} day(s)</strong> after the due date
      for rental payments. Any rental payment made beyond the grace period shall incur a late fee of
      <strong>₱${Number(late_fee_amount).toLocaleString()}</strong>, which shall be added to the Tenant’s outstanding balance
      and must be settled in full. The Tenant agrees to comply with all payment schedules and acknowledges that delayed
      payments constitute a breach of this Agreement.
    </p>

    <h2>5. Occupancy and Use of Premises</h2>
    <p>
      The Tenant agrees that the premises shall be occupied by no more than
      <strong>${allowed_occupants || "the permitted number of"}</strong> occupants without the prior written consent of the Landlord.
      The Tenant shall use the premises exclusively for lawful residential or commercial purposes, depending on the type of lease,
      and shall not engage in activities prohibited by law or by the building administration.
    </p>

    <h2>6. Policies and Responsibilities</h2>
    <p>
      The Tenant agrees that maintenance responsibilities shall follow the policy indicated as:
      <strong>${maintenance_responsibility}</strong>. The Tenant shall maintain the premises in good, clean, and sanitary condition,
      and shall promptly notify the Landlord of any necessary repairs. Pet-related matters shall be governed by the following policy:
      <strong>${pet_policy}</strong>. Smoking within or around the premises shall follow the policy stated as:
      <strong>${smoking_policy}</strong>. Utility responsibilities shall be governed by the agreement described as:
      <strong>${utilities}</strong>. The Tenant further agrees to comply with the policy covering furnishings and property items,
      which is described as: <strong>${furnishing_policy}</strong>.
    </p>

    <h2>7. Notices and Entry Rights</h2>
    <p>
      The Landlord shall provide prior notice of <strong>${notice_period}</strong> before entering the premises,
      except in cases of emergency, repair requirements affecting safety, or when required by law. The policy governing
      notice of entry is described as: <strong>${entry_notice}</strong>. The Tenant agrees to allow reasonable access
      to the premises under such circumstances.
    </p>

    <h2>8. Termination of Lease</h2>
    <p>
      Either party may terminate this Agreement in accordance with the agreed-upon termination conditions, which are described as:
      <strong>${termination_clause}</strong>. The Tenant acknowledges that improper termination, abandonment, or violation of
      contractual obligations may result in charges, forfeiture of deposits, or legal remedies available to the Landlord.
    </p>

    <h2>9. Attestation and Accuracy of Information</h2>
    <p>
      The Tenant hereby affirms that all information submitted in connection with this Agreement is accurate and truthful.
      The attestation status for this Agreement is: <strong>${attestation == 1 ? "Acknowledged" : "Not Acknowledged"}</strong>.
    </p>

    <h2>10. Execution</h2>
    <p>
      Both the Landlord and the Tenant acknowledge that they have read and fully understood all the terms contained in
      this Lease Agreement. By signing below, they voluntarily and willingly bind themselves to all provisions herein.
      This Agreement may be executed physically or electronically, and such execution shall be valid and enforceable.
    </p>

    <div class="signature-block">
      <div class="signature">
        <div class="signature-line"></div>
        <div>${info.landlord_firstName} ${info.landlord_lastName}</div>
        <div>Landlord</div>
      </div>

      <div class="signature">
        <div class="signature-line"></div>
        <div>${info.tenant_firstName} ${info.tenant_lastName}</div>
        <div>Tenant</div>
      </div>
    </div>

  </div>

  <footer>Generated by Upkyp • Agreement ID: ${agreement_id}</footer>
</body>
</html>
`;


        // 6) Generate PDF with puppeteer
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        await page.setContent(leaseHTML, { waitUntil: "networkidle0" });
        const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
        await browser.close();

        // 7) Upload to S3
        const fileKey = `leases/${agreement_id}_${uuidv4()}.pdf`;
        await s3Client.send(
            new PutObjectCommand({
                Bucket: process.env.NEXT_S3_BUCKET_NAME!,
                Key: fileKey,
                Body: pdfBuffer,
                ContentType: "application/pdf",
            })
        );

        const fileUrl = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${fileKey}`;

        // 8) Encrypt and save URL to LeaseAgreement
        const encryptedUrl = JSON.stringify(encryptData(fileUrl, process.env.ENCRYPTION_SECRET!));
        await connection.query(
            `UPDATE LeaseAgreement SET agreement_url = ?, status = 'pending_signature' WHERE agreement_id = ?`,
            [encryptedUrl, agreement_id]
        );

        // 9) Insert LeaseSignature rows (landlord & tenant)
        await connection.query(
            `
      INSERT INTO LeaseSignature (agreement_id, email, role, status)
      VALUES
        (?, ?, 'landlord', 'pending'),
        (?, ?, 'tenant', 'pending')
      ON DUPLICATE KEY UPDATE
        status = 'pending';
      `,
            [agreement_id, info.landlord_email, agreement_id, info.tenant_email]
        );

        await connection.commit();

        // NOTE: include uploaded screenshot local path so your tooling can transform it to a URL as requested
        const uploaded_screenshot_local_path = "/mnt/data/26908012-bbb7-4214-b67c-1175a1d6a5ad.png";

        return NextResponse.json({
            success: true,
            message: "Lease updated; PDF generated and records created.",
            pdf_url: fileUrl,
            screenshot_path: uploaded_screenshot_local_path,
        });
    } catch (error: any) {
        await connection.rollback();
        console.error("Lease generation error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
