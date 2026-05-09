import { db } from "@/lib/db";
import { deleteFromS3 } from "@/lib/s3";
import { decryptData } from "@/crypto/encrypt";
import { getSessionUser } from "@/lib/auth/auth";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
    const session = await getSessionUser();

    if (!session || !session.landlord_id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const unit_id = req.nextUrl.searchParams.get("unit_id");

    if (!unit_id) {
        return NextResponse.json({ error: "unit_id is required" }, { status: 400 });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [leaseRows]: any = await connection.execute(
            `SELECT la.agreement_url, la.agreement_id, la.tenant_id, u.property_id 
             FROM LeaseAgreement la 
             JOIN Unit u ON la.unit_id = u.unit_id 
             WHERE la.unit_id = ? LIMIT 1`,
            [unit_id]
        );

        if (!leaseRows || leaseRows.length === 0) {
            await connection.rollback();
            return NextResponse.json({ error: "Lease not found" }, { status: 404 });
        }

        const lease = leaseRows[0];

        if (!lease.agreement_url) {
            await connection.rollback();
            return NextResponse.json({
                success: true,
                message: "No lease file attached to delete",
            });
        }

        let leaseFileUrl: string;
        try {
            const decrypted = decryptData(
                JSON.parse(lease.agreement_url),
                process.env.ENCRYPTION_SECRET!
            );
            if (!decrypted || typeof decrypted !== "string") {
                throw new Error("Decryption returned invalid data");
            }
            leaseFileUrl = decrypted;
        } catch (decryptionError) {
            await connection.rollback();
            console.error("Decryption Error:", decryptionError);
            return NextResponse.json(
                { error: "Failed to decrypt lease file URL." },
                { status: 500 }
            );
        }

        try {
            await deleteFromS3(leaseFileUrl);
        } catch (s3Error) {
            await connection.rollback();
            console.error("S3 Deletion Error:", s3Error);
            return NextResponse.json(
                { error: "Failed to delete lease file from S3." },
                { status: 500 }
            );
        }

        await connection.execute(
            "UPDATE LeaseAgreement SET agreement_url = NULL WHERE agreement_id = ?",
            [lease.agreement_id]
        );

        await connection.commit();

        return NextResponse.json({
            success: true,
            unit_id,
            tenant_id: lease.tenant_id,
            message: "Lease file deleted successfully, record kept",
        });
    } catch (error: any) {
        await connection.rollback();
        console.error("Error deleting lease file:", error);
        return NextResponse.json(
            { error: "Internal server error", message: error.message },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
