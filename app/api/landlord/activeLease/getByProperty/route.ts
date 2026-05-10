import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

export async function GET(req: NextRequest) {
    const property_id = req.nextUrl.searchParams.get("property_id");
    const month = req.nextUrl.searchParams.get("month");
    const year = req.nextUrl.searchParams.get("year");

    if (!property_id) {
        return NextResponse.json(
            { error: "Missing property_id" },
            { status: 400 }
        );
    }

    let periodFilter = "";
    let periodParams: any[] = [property_id];

    if (month !== null && year !== null) {
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        const periodEnd = new Date(yearNum, monthNum + 1, 0);
        periodFilter = ` AND (la.start_date <= ? OR (la.start_date IS NULL AND la.created_at <= ?))`;
        periodParams = [property_id, periodEnd.toISOString().split('T')[0], periodEnd.toISOString().split('T')[0]];
    }

    try {
        /* ========================================================
           1️⃣ SCORECARD STATS (AUTHORITATIVE)
        ======================================================== */
        const [[totalRow]]: any = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM LeaseAgreement la
            JOIN Unit u ON la.unit_id = u.unit_id
            WHERE u.property_id = ?
              AND la.status != 'cancelled'
            `,
            [property_id]
        );

        const [[lastMonthRow]]: any = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM LeaseAgreement la
            JOIN Unit u ON la.unit_id = u.unit_id
            WHERE u.property_id = ?
              AND la.status != 'cancelled'
              AND la.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH)
            `,
            [property_id]
        );

        const totalLeases = totalRow?.total || 0;
        const lastMonthTotal = lastMonthRow?.total || 0;

        const delta = totalLeases - lastMonthTotal;
        const deltaPct =
            lastMonthTotal > 0
                ? Math.round((delta / lastMonthTotal) * 100)
                : totalLeases > 0
                    ? 100
                    : 0;

        /* ========================================================
           2️⃣ FETCH LEASE AGREEMENTS
        ======================================================== */
        const [leaseRows]: any = await db.query(
            `
            SELECT
                la.agreement_id AS lease_id,
                la.start_date,
                la.end_date,
                la.move_in_date,
                la.status AS lease_status,
                la.security_deposit_amount,
                la.advance_payment_amount,
                la.agreement_url,
                la.rent_amount,

                u.unit_id,
                u.unit_name,
                u.property_id,
                u.rent_amount,

                p.property_name,
                p.city AS property_city,
                p.province AS property_province,

                t.tenant_id,
                usr.firstName AS enc_firstName,
                usr.lastName AS enc_lastName,
                usr.email AS enc_email,
                usr.phoneNumber AS enc_phoneNumber

            FROM LeaseAgreement la
            JOIN Unit u ON la.unit_id = u.unit_id
            JOIN Property p ON u.property_id = p.property_id
            LEFT JOIN Tenant t ON la.tenant_id = t.tenant_id
            LEFT JOIN User usr ON t.user_id = usr.user_id

            WHERE u.property_id = ?
              AND la.status IN (
                    'active',
                    'draft',
                    'pending',
                    'sent',
                    'pending_signature',
                    'tenant_signed',
                    'landlord_signed',
                    'expired'
              )
              ${periodFilter}
            ORDER BY la.start_date DESC;
            `,
            periodParams
        );

        /* ========================================================
           3️⃣ FETCH SIGNATURES
        ======================================================== */
        const agreementIds = leaseRows.map((l: any) => l.lease_id);

        const landlordSigMap = new Map<string, any>();
        const tenantSigMap = new Map<string, any>();

        if (agreementIds.length > 0) {
            const [sigRows]: any = await db.query(
                `
                SELECT agreement_id, role, signed_at, status, email
                FROM LeaseSignature
                WHERE agreement_id IN (?)
                `,
                [agreementIds]
            );

            sigRows.forEach((sig: any) => {
                const payload = {
                    signed: !!sig.signed_at,
                    signed_at: sig.signed_at || null,
                    email: sig.email || null,
                    status: sig.status,
                };

                if (sig.role === "landlord") {
                    landlordSigMap.set(sig.agreement_id, payload);
                }

                if (sig.role === "tenant") {
                    tenantSigMap.set(sig.agreement_id, payload);
                }
            });
        }

        /* ========================================================
           4️⃣ MAP + DERIVE EFFECTIVE STATUS
        ======================================================== */
        const leases = leaseRows.map((lease: any) => {
            const safeDecrypt = (value: any) => {
                try {
                    return value
                        ? decryptData(JSON.parse(value), SECRET_KEY)
                        : "";
                } catch {
                    return "";
                }
            };

            const landlordSig =
                landlordSigMap.get(lease.lease_id) || { signed: false };
            const tenantSig =
                tenantSigMap.get(lease.lease_id) || { signed: false };

            let effectiveStatus = lease.lease_status;

            if (lease.lease_status === "pending_signature") {
                if (landlordSig.signed && !tenantSig.signed) {
                    effectiveStatus = "tenant_pending_signature";
                } else if (!landlordSig.signed && tenantSig.signed) {
                    effectiveStatus = "landlord_pending_signature";
                } else if (landlordSig.signed && tenantSig.signed) {
                    effectiveStatus = "active";
                }
            }

            let decryptedUrl = null;
            if (lease.agreement_url) {
                try {
                    decryptedUrl = decryptData(
                        JSON.parse(lease.agreement_url),
                        SECRET_KEY
                    );
                } catch {}
            }

            return {
                type: "lease",
                lease_id: lease.lease_id,

                lease_status: effectiveStatus,
                raw_lease_status: lease.lease_status,

                landlord_signed: landlordSig.signed,
                landlord_signed_at: landlordSig.signed_at,

                tenant_signed: tenantSig.signed,
                tenant_signed_at: tenantSig.signed_at,

                start_date: lease.start_date,
                end_date: lease.end_date,
                move_in_date: lease.move_in_date,

                unit_id: lease.unit_id,
                unit_name: lease.unit_name,
                rent_amount: lease.rent_amount,

                tenant_id: lease.tenant_id,
                tenant_name: `${safeDecrypt(
                    lease.enc_firstName
                )} ${safeDecrypt(lease.enc_lastName)}`.trim(),
                tenant_email: safeDecrypt(lease.enc_email),
                tenant_phone: safeDecrypt(lease.enc_phoneNumber),

                agreement_url: decryptedUrl,

                property_id: lease.property_id,
                property_name: lease.property_name,
                property_city: lease.property_city,
                property_province: lease.property_province,
            };
        });

        /* ========================================================
           5️⃣ RESPONSE
        ======================================================== */
        return NextResponse.json(
            {
                leases,
                stats: {
                    total_leases: totalLeases,
                    total_leases_last_month: lastMonthTotal,
                    total_leases_change: delta,
                    total_leases_change_pct: deltaPct,
                },
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("❌ Error fetching leases:", err);
        return NextResponse.json(
            { error: "Failed to fetch leases" },
            { status: 500 }
        );
    }
}
