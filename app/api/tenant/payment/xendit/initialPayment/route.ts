import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export async function GET(req: NextRequest) {
    try {
        const agreement_id = req.nextUrl.searchParams.get("agreement_id");
        const type = req.nextUrl.searchParams.get("type");

        if (!agreement_id) {
            return NextResponse.json(
                { error: "Missing agreement_id" },
                { status: 400 }
            );
        }

        if (type && !["advance", "deposit"].includes(type)) {
            return NextResponse.json(
                { error: "Invalid type. Must be 'advance' or 'deposit'." },
                { status: 400 }
            );
        }

        const connection = await db.getConnection();

        /* ------------------------------------------------------------------
           ADVANCE PAYMENT STATUS
        ------------------------------------------------------------------ */
        const [advanceRows]: any = await connection.query(
            `
      SELECT status, amount, received_at
      FROM AdvancePayment
      WHERE lease_id = ?
      ORDER BY created_at DESC
      LIMIT 1
      `,
            [agreement_id]
        );

        /* ------------------------------------------------------------------
           SECURITY DEPOSIT STATUS
        ------------------------------------------------------------------ */
        const [depositRows]: any = await connection.query(
            `
      SELECT status, amount, received_at
      FROM SecurityDeposit
      WHERE lease_id = ?
      ORDER BY created_at DESC
      LIMIT 1
      `,
            [agreement_id]
        );

        connection.release();

        const advance = advanceRows.length
            ? {
                status: advanceRows[0].status,
                amount: Number(advanceRows[0].amount || 0),
                paid_at: advanceRows[0].received_at,
            }
            : {
                status: "unpaid",
                amount: 0,
                paid_at: null,
            };

        const deposit = depositRows.length
            ? {
                status: depositRows[0].status,
                amount: Number(depositRows[0].amount || 0),
                paid_at: depositRows[0].received_at,
            }
            : {
                status: "unpaid",
                amount: 0,
                paid_at: null,
            };

        const all_paid =
            advance.status === "paid" &&
            deposit.status === "paid";

        /* ------------------------------------------------------------------
           RESPONSE BASED ON TYPE
        ------------------------------------------------------------------ */
        if (type === "advance") {
            return NextResponse.json({
                agreement_id,
                type: "advance",
                payment: advance,
                all_paid,
                can_access_portal: all_paid,
            });
        }

        if (type === "deposit") {
            return NextResponse.json({
                agreement_id,
                type: "deposit",
                payment: deposit,
                all_paid,
                can_access_portal: all_paid,
            });
        }

        /* ------------------------------------------------------------------
           DEFAULT (NO TYPE PROVIDED)
        ------------------------------------------------------------------ */
        return NextResponse.json({
            agreement_id,
            advance,
            deposit,
            all_paid,
            can_access_portal: all_paid,
        });

    } catch (err: any) {
        console.error("❌ Error fetching initial payment status:", err);

        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        );
    }
}
