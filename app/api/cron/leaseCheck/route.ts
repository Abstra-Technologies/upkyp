import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import {checkExpiringLeases} from "@/utils/cronjobs/leaseCron";

export const POST = verifySignatureAppRouter(async (request: Request) => {
    try {
        const count = await checkExpiringLeases();
        return new Response(JSON.stringify({ ok: true, message: `Checked ${count} leases` }), { status: 200 });
    } catch (error: unknown) {
        console.error("LEASE CHECK ERROR:", error);
        return new Response(
            JSON.stringify({
                ok: false,
                error: error instanceof Error ? error.message : "Unknown error",
            }),
            { status: 500 }
        );
    }
});