import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/auth";

/* ======================================================
   GET — Fetch checklist + computed setup status
====================================================== */
export async function GET(req: NextRequest) {
    const agreement_id = req.nextUrl.searchParams.get("agreement_id");

    if (!agreement_id) {
        return NextResponse.json({ error: "Missing agreement_id" }, { status: 400 });
    }

    try {
        const [[requirements]]: any = await db.query(
            `
            SELECT *
            FROM rentalley_db.LeaseSetupRequirements
            WHERE agreement_id = ?
            LIMIT 1
            `,
            [agreement_id]
        );

        const [[lease]]: any = await db.query(
            `
            SELECT start_date, end_date, agreement_url, status
            FROM rentalley_db.LeaseAgreement
            WHERE agreement_id = ?
            LIMIT 1
            `,
            [agreement_id]
        );

        if (!lease) {
            return NextResponse.json({ error: "Lease not found" }, { status: 404 });
        }

        const document_uploaded =
            !!lease.agreement_url && lease.agreement_url !== "null";

        const setup_completed = computeSetupCompleted(
            requirements,
            lease,
            document_uploaded
        );

        return NextResponse.json({
            success: true,
            requirements: requirements || null,
            document_uploaded,
            lease_start_date: lease.start_date,
            lease_end_date: lease.end_date,
            lease_status: lease.status,
            setup_completed,
        });
    } catch (error) {
        console.error("❌ GET lease setup failed:", error);
        return NextResponse.json(
            { error: "Failed to fetch lease setup" },
            { status: 500 }
        );
    }
}

/* ======================================================
   POST — Safe create/update (idempotent)
   - Dates-only = UPDATE ONLY
   - Checklist = UPSERT
====================================================== */
export async function POST(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        const session = await getSessionUser();

        if (!session || !session.landlord_id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { agreement_id } = body;

        if (!agreement_id) {
            return NextResponse.json({ error: "Missing agreement_id" }, { status: 400 });
        }

        const [ownershipCheck]: any = await connection.query(
            `
            SELECT la.agreement_id
            FROM rentalley_db.LeaseAgreement la
            JOIN rentalley_db.Unit u ON la.unit_id = u.unit_id
            JOIN rentalley_db.Property p ON u.property_id = p.property_id
            WHERE la.agreement_id = ? AND p.landlord_id = ?
            LIMIT 1
            `,
            [agreement_id, session.landlord_id]
        );

        if (!ownershipCheck.length) {
            return NextResponse.json(
                { error: "Unauthorized - not your lease." },
                { status: 403 }
            );
        }

        await connection.beginTransaction();

        /* -----------------------------------------------
           1️⃣ Update lease dates (NO side effects)
        ----------------------------------------------- */
        const startDate = body.lease_start_date && body.lease_start_date !== "" ? body.lease_start_date : null;
        const endDate = body.lease_end_date && body.lease_end_date !== "" ? body.lease_end_date : null;

        if (startDate || endDate) {
            const updates: string[] = [];
            const values: any[] = [];

            if (startDate) {
                updates.push("start_date = ?");
                values.push(startDate);
            }
            if (endDate) {
                updates.push("end_date = ?");
                values.push(endDate);
            }

            if (updates.length > 0) {
                values.push(agreement_id);
                await connection.query(
                    `UPDATE rentalley_db.LeaseAgreement SET ${updates.join(", ")} WHERE agreement_id = ?`,
                    values
                );
            }
        }

        /* -----------------------------------------------
           2️⃣ Checklist STRICT UPSERT (1 record per lease)
        ----------------------------------------------- */
        const checklistKeys = [
            "lease_agreement",
            "move_in_checklist",
            "move_out_checklist",
            "security_deposit",
            "advance_payment",
            "other_essential",
        ];

        const hasChecklist = checklistKeys.some((key) => key in body);

        if (hasChecklist) {
            const [existing]: any = await connection.query(
                `SELECT id FROM rentalley_db.LeaseSetupRequirements WHERE agreement_id = ? LIMIT 1`,
                [agreement_id]
            );

            if (existing.length > 0) {
                await connection.query(
                    `UPDATE rentalley_db.LeaseSetupRequirements 
                     SET lease_agreement = ?, move_in_checklist = ?, move_out_checklist = ? 
                     WHERE agreement_id = ?`,
                    [
                        body.lease_agreement ? 1 : 0,
                        body.move_in_checklist ? 1 : 0,
                        body.move_out_checklist ? 1 : 0,
                        agreement_id
                    ]
                );
            } else {
                await connection.query(
                    `INSERT INTO rentalley_db.LeaseSetupRequirements 
                     (agreement_id, lease_agreement, move_in_checklist, move_out_checklist) 
                     VALUES (?, ?, ?, ?)`,
                    [
                        agreement_id,
                        body.lease_agreement ? 1 : 0,
                        body.move_in_checklist ? 1 : 0,
                        body.move_out_checklist ? 1 : 0,
                    ]
                );
            }
        }

        await maybeActivateLease(connection, agreement_id);

        await connection.commit();

        return NextResponse.json({
            success: true,
            message: "Lease setup saved successfully",
        });
    } catch (error) {
        await connection.rollback();
        console.error("❌ POST lease setup failed:", error);
        return NextResponse.json(
            { error: "Failed to save lease setup" },
            { status: 500 }
        );
    }
}

/* ======================================================
   PUT — Explicit update (alias of POST for safety)
====================================================== */
export async function PUT(req: NextRequest) {
    return POST(req);
}

/* ======================================================
   HELPER — Activate lease safely (NO side effects)
====================================================== */
async function maybeActivateLease(connection: any, agreement_id: string) {
    const [lease]: any = await connection.query(
        `
        SELECT start_date, agreement_url, status
        FROM rentalley_db.LeaseAgreement
        WHERE agreement_id = ?
        LIMIT 1
        `,
        [agreement_id]
    );

    if (!lease.length || lease[0].status === "active") return;

    const leaseData = lease[0];

    const [requirements]: any = await connection.query(
        `
        SELECT *
        FROM rentalley_db.LeaseSetupRequirements
        WHERE agreement_id = ?
        LIMIT 1
        `,
        [agreement_id]
    );

    const document_uploaded =
        !!leaseData.agreement_url && leaseData.agreement_url !== "null";

    if (!requirements.length) {
        if (leaseData.start_date) {
            await connection.query(
                `
                UPDATE rentalley_db.LeaseAgreement
                SET status = 'active'
                WHERE agreement_id = ?
                `,
                [agreement_id]
            );
        }
        return;
    }

    const reqData = requirements[0];

    const setup_completed =
        (!reqData.lease_agreement || document_uploaded) &&
        (!reqData.move_in_checklist || leaseData.start_date) &&
        (!reqData.security_deposit || true) &&
        (!reqData.advance_payment || true);

    if (setup_completed) {
        await connection.query(
            `
            UPDATE rentalley_db.LeaseAgreement
            SET status = 'active'
            WHERE agreement_id = ?
            `,
            [agreement_id]
        );
    }
}

/* ======================================================
   PURE FUNCTION — Setup completion checker
====================================================== */
function computeSetupCompleted(
    requirements: any,
    lease: any,
    document_uploaded: boolean
) {
    if (!lease) return false;

    if (!requirements) {
        return !!lease.start_date;
    }

    return (
        (!requirements.lease_agreement || document_uploaded) &&
        (!requirements.move_in_checklist || lease.start_date) &&
        (!requirements.security_deposit || true) &&
        (!requirements.advance_payment || true)
    );
}
