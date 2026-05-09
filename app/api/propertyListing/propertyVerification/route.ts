import { NextRequest, NextResponse } from "next/server";
import { encryptData } from "@/crypto/encrypt";
import { db } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";
import { getSessionUser } from "@/lib/auth/auth";

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();

  if (!session || !session.landlord_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const landlordId = session.landlord_id;

  const formData = await req.formData();
  const property_id = formData.get("property_id")?.toString();
  const docType = formData.get("docType")?.toString();
  const tinNumber = formData.get("tinNumber")?.toString();
  const submittedDoc = formData.get("submittedDoc") as File | null;

  if (!property_id || !docType || !tinNumber || !submittedDoc) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const connection = await db.getConnection();
  try {
    const [rows]: any = await connection.execute(
      "SELECT property_id, landlord_id FROM Property WHERE property_id = ?",
      [property_id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Invalid property_id: No matching property found" }, { status: 400 });
    }

    if (rows[0].landlord_id !== landlordId) {
      return NextResponse.json({ error: "You do not own this property" }, { status: 403 });
    }

    await connection.beginTransaction();

    const buffer = Buffer.from(await submittedDoc.arrayBuffer());
    const sanitizedFilename = sanitizeFilename(submittedDoc.name);
    const key = `${landlordId}/${property_id}/${process.env.NEXT_AWS_PROPERTY_VERIFY}/${Date.now()}_${sanitizedFilename}`;

    const s3Url = await uploadToS3(buffer, key, submittedDoc.type);
    const encryptedUrl = encryptData(s3Url, process.env.ENCRYPTION_SECRET!);

    const query = `
      INSERT INTO PropertyVerification 
        (property_id, doc_type, submitted_doc, tin_number, status, created_at, updated_at, verified, attempts)
      VALUES (?, ?, ?, ?, 'Pending', NOW(), NOW(), 0, 1)
      ON DUPLICATE KEY UPDATE 
        doc_type = VALUES(doc_type),
        submitted_doc = VALUES(submitted_doc),
        tin_number = VALUES(tin_number),
        status = 'Pending',
        updated_at = NOW(),
        attempts = attempts + 1
    `;

    await connection.execute(query, [
      property_id,
      docType,
      encryptedUrl,
      tinNumber,
    ]);

    await connection.commit();

    return NextResponse.json({ message: "Document uploaded and stored successfully" }, { status: 201 });
  } catch (err) {
    await connection.rollback();
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    connection.release();
  }
}
