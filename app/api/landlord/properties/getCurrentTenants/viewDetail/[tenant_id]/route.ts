import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ tenant_id: string }> }
) {
    const { tenant_id } = await context.params;

    if (!tenant_id) {
        return NextResponse.json(
            { message: "Missing tenant_id parameter" },
            { status: 400 }
        );
    }

    try {
        // Fetch tenant + lease + property + user info
        const [tenantRows] = await db.execute(
            `
        SELECT
            t.tenant_id,
            t.user_id,
            t.employment_type,
            t.monthly_income,
            u.occupation,
            u.firstName,
            u.lastName,
            u.phoneNumber,
            u.email,
            u.citizenship,
            u.profilePicture,
            la.unit_id,
            la.start_date,
            p.property_name,
            la.end_date
        FROM Tenant t
        JOIN LeaseAgreement la ON t.tenant_id = la.tenant_id
        JOIN Unit un ON la.unit_id = un.unit_id
        JOIN Property p ON un.property_id = p.property_id
        JOIN User u ON t.user_id = u.user_id
        WHERE t.tenant_id = ?
      `,
            [tenant_id]
        );

        const tenants = tenantRows as any[];

        if (tenants.length === 0) {
            return NextResponse.json(
                { message: "Tenant not found" },
                { status: 404 }
            );
        }

        // Decrypt fields
        const tenant = {
            ...tenants[0],
            email: decryptData(JSON.parse(tenants[0].email), SECRET_KEY),
            firstName: decryptData(JSON.parse(tenants[0].firstName), SECRET_KEY),
            lastName: decryptData(JSON.parse(tenants[0].lastName), SECRET_KEY),
            profilePicture: decryptData(JSON.parse(tenants[0].profilePicture), SECRET_KEY),
            phoneNumber: decryptData(JSON.parse(tenants[0].phoneNumber), SECRET_KEY),

        };

        // Payment history
        const [paymentHistory] = await db.execute(
            `
        SELECT
          payment_id,
          agreement_id,
          payment_type,
          amount_paid,
          payment_method_id,
          payment_status,
          receipt_reference,
          payment_date,
          created_at,
          updated_at,
          proof_of_payment
        FROM Payment
        WHERE agreement_id IN (
          SELECT agreement_id FROM LeaseAgreement WHERE tenant_id = ?
        )
        ORDER BY payment_date DESC
      `,
            [tenant_id]
        );

        return NextResponse.json({ tenant, paymentHistory });
    } catch (error: any) {
        console.error("Error fetching tenant details:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
