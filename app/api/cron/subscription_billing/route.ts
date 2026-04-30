import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import {generateSubscriptionBillingSnapshots} from "@/utils/cronjobs/subscriptionBilling";

export const POST = verifySignatureAppRouter(async (request: Request) => {
    try {
        const count = await generateSubscriptionBillingSnapshots();
        return new Response(JSON.stringify({ ok: true, message: `Generated ${count} billing snapshots` }), { status: 200 });
    } catch (error: unknown) {
        console.error("SUBSCRIPTION BILLING CRON ERROR:", error);
        return new Response(
            JSON.stringify({
                ok: false,
                error: error instanceof Error ? error.message : "Unknown error",
            }),
            { status: 500 }
        );
    }
});
