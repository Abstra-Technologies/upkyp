import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cacheLife, cacheTag } from "next/cache";

const log = (stage: string, data?: any) => {
    console.log(`[EKYP ID: STATUS ${stage}]`, data ?? "");
};

/* ========================================================
   1. ISOLATED MEMORY CACHE LAYER
   Uses Next.js 16 Cache Components architecture.
   Automatically maps a distinct cache entry per agreement_id.
======================================================== */
async function getCachedEkypRecord(agreement_id: string) {
    "use cache";
    cacheLife("minutes"); // Automatic time-based background refresh
    cacheTag(`ekyp-status-${agreement_id}`); // For instant on-demand mutations

    const [rows]: any[] = await db.query(
        `
        SELECT 
            ek.status,
            ek.qr_hash,
            ek.issued_at
        FROM rentalley_db.LeaseEKyp ek
        WHERE ek.agreement_id = ?
        LIMIT 1
        `,
        [agreement_id]
    );

    return rows?.[0] || null;
}

/* ========================================================
   2. DYNAMIC ROUTE HANDLER
======================================================== */
export async function GET(request: NextRequest) {
    // CRITICAL: Extract searchParams BEFORE the try/catch block.
    // Next.js safely handles its build-time prerender bailout signals here.
    const agreement_id = request.nextUrl.searchParams.get("agreement_id");

    if (!agreement_id) {
        return NextResponse.json(
            { message: "agreement_id is required" },
            { status: 400 }
        );
    }

    try {
        log("START");
        log("AGREEMENT_ID", agreement_id);

        // Fetch data instantly from memory cache or backfill from MySQL if cold
        const ekyp = await getCachedEkypRecord(agreement_id);

        if (!ekyp) {
            log("NOT_FOUND");
            return NextResponse.json({
                exists: false,
                status: "draft",
                qr_url: null,
            });
        }

        const qrUrl = ekyp.qr_hash
            ? `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/ekypid/${agreement_id}/${ekyp.qr_hash}.png`
            : null;

        log("FOUND", ekyp.status);

        return NextResponse.json(
            {
                exists: true,
                status: ekyp.status, // draft | active | revoked
                qr_url: qrUrl,
                issued_at: ekyp.issued_at,
            },
            {
                headers: {
                    // Instructs browsers not to lock stale data, ensuring clients
                    // always ping your ultra-fast Next.js memory cache edge.
                    'Cache-Control': 'no-store, must-revalidate',
                },
            }
        );
    } catch (err) {
        // Captured database runtime or S3 logic faults go here cleanly
        console.error("[EKYP STATUS ERROR]", err);
        return NextResponse.json(
            { message: "Failed to fetch eKYP status" },
            { status: 500 }
        );
    }
}
