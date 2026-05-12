import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

async function getDbConnection() {
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
    return mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
    });
}

/* -------------------------------------------------------------------------- */
/* FAILED PAYMENT WEBHOOK                                                     */
/* -------------------------------------------------------------------------- */
export async function POST(req: Request) {
    let payload: any;
    console.log("✅ XENDIT WEBHOOK FAILED HIT:", payload);

    /* -------------------- PARSE BODY -------------------- */
    try {
        payload = await req.json();
        console.log("❌ XENDIT PAYMENT FAILED WEBHOOK:", payload);
    } catch {
        return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    /* -------------------- VERIFY TOKEN -------------------- */
    const token = req.headers.get("x-callback-token");
    if (token !== process.env.XENDIT_TEXT_WEBHOOK_TOKEN) {
        return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const {
        external_id,
        status,
        id: invoice_id,
        failure_reason,
    } = payload;

    /**
     * Xendit failure statuses:
     * - FAILED
     * - EXPIRED
     * - CANCELLED
     */
    if (!external_id || !invoice_id || !status) {
        return NextResponse.json(
            { message: "Missing required fields" },
            { status: 400 }
        );
    }

    if (!["FAILED", "EXPIRED", "CANCELLED"].includes(status)) {
        return NextResponse.json({ message: "Ignored" });
    }

    let conn: mysql.Connection | undefined;

    try {
        conn = await getDbConnection();
        await conn.beginTransaction();

        /* ======================================================================
           BILLING PAYMENTS
           external_id: billing-{billing_id}
           ====================================================================== */
        if (external_id.startsWith("billing-")) {
            const billing_id = external_id.replace("billing-", "");

            const [billingRows]: any = await conn.execute(
                `
        SELECT billing_id, lease_id
        FROM Billing
        WHERE billing_id = ?
        LIMIT 1
        `,
                [billing_id]
            );

            const billing = billingRows[0];
            if (!billing) {
                await conn.rollback();
                return NextResponse.json(
                    { message: "Billing not found" },
                    { status: 404 }
                );
            }

            /* ---- Mark billing unpaid ---- */
            await conn.execute(
                `
        UPDATE Billing
        SET status = 'unpaid'
        WHERE billing_id = ?
        `,
                [billing_id]
            );

            /* ---- Mark related payment failed ---- */
            await conn.execute(
                `
        UPDATE Payment
        SET payment_status = 'failed',
            updated_at = NOW()
        WHERE receipt_reference = ?
        `,
                [invoice_id]
            );

            await conn.commit();
            return NextResponse.json({ message: "Billing payment marked as failed" });
        }

        /* ======================================================================
           INITIAL PAYMENTS (ADVANCE / DEPOSIT)
           external_id: init-{advance|deposit}-{agreement_id}-{timestamp}
           ====================================================================== */
        const match = external_id.match(/^init-(advance|deposit)-([^-]+)/);

        if (!match) {
            await conn.rollback();
            return NextResponse.json(
                { message: "Unrecognized external_id" },
                { status: 400 }
            );
        }

        const paymentType = match[1]; // advance | deposit
        const agreement_id = match[2];

        /* -------------------- FETCH LEASE -------------------- */
        const [leaseRows]: any = await conn.execute(
            `
      SELECT tenant_id
      FROM LeaseAgreement
      WHERE agreement_id = ?
      LIMIT 1
      `,
            [agreement_id]
        );

        if (!leaseRows.length) {
            await conn.rollback();
            return NextResponse.json(
                { message: "Lease agreement not found" },
                { status: 404 }
            );
        }

        const tenant_id = leaseRows[0].tenant_id;

        /* -------------------- ADVANCE PAYMENT FAILED -------------------- */
        if (paymentType === "advance") {
            await conn.execute(
                `
        UPDATE AdvancePayment
        SET status = 'failed',
            updated_at = NOW()
        WHERE lease_id = ?
        `,
                [agreement_id]
            );

            await conn.execute(
                `
        UPDATE Payment
        SET payment_status = 'failed',
            updated_at = NOW()
        WHERE receipt_reference = ?
        `,
                [invoice_id]
            );
        }

        /* -------------------- SECURITY DEPOSIT FAILED -------------------- */
        if (paymentType === "deposit") {
            await conn.execute(
                `
        UPDATE SecurityDeposit
        SET status = 'failed',
            updated_at = NOW()
        WHERE lease_id = ?
        `,
                [agreement_id]
            );

            await conn.execute(
                `
        UPDATE Payment
        SET payment_status = 'failed',
            updated_at = NOW()
        WHERE receipt_reference = ?
        `,
                [invoice_id]
            );
        }

        await conn.commit();
        return NextResponse.json({
            message: "Initial payment marked as failed",
            reason: failure_reason || null,
        });

    } catch (err: any) {
        if (conn) await conn.rollback().catch(() => {});
        console.error("❌ Failed payment webhook error:", err);
        return NextResponse.json(
            { message: "Webhook failed", error: err.message },
            { status: 500 }
        );
    } finally {
        if (conn) await conn.end().catch(() => {});
    }
}
