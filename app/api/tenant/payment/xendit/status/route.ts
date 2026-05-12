import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export async function GET(req: NextRequest) {
    let connection;

    try {
        const billing_id = req.nextUrl.searchParams.get("billing_id");

        if (!billing_id) {
            return NextResponse.json(
                { error: "Missing billing_id" },
                { status: 400 }
            );
        }

        connection = await db.getConnection();

        const [rows]: any = await connection.query(
            `
            SELECT 
                p.payment_id,
                p.bill_id,
                p.agreement_id,
                p.payment_type,
                p.amount_paid,
                p.gross_amount,
                p.gateway_fee,
                p.platform_fee,
                p.gateway_vat,
                p.net_amount,
                p.payment_status,
                p.payment_date,
                p.receipt_reference,
                p.payout_status,
                p.gateway_transaction_ref,
                b.billing_period,
                u.unit_name,
                pr.property_name
            FROM Payment p
            LEFT JOIN Billing b ON p.bill_id = b.billing_id
            LEFT JOIN LeaseAgreement la ON p.agreement_id = la.agreement_id
            LEFT JOIN Unit u ON la.unit_id = u.unit_id
            LEFT JOIN Property pr ON u.property_id = pr.property_id
            WHERE p.bill_id = ?
            ORDER BY p.payment_id DESC
            LIMIT 1
            `,
            [billing_id]
        );

        connection.release();

        if (!rows.length) {
            return NextResponse.json(
                { error: "Payment not found" },
                { status: 404 }
            );
        }

        const payment = rows[0];

        return NextResponse.json({
            status: payment.payment_status,
            payment,
        });

    } catch (err: any) {
        console.error("Payment status error:", err);
        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        );
    }
}