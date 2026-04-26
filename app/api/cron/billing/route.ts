import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import {sendBillingNotifications} from "@/utils/cronjobs/billingCron";


export const POST = verifySignatureAppRouter(async (request: Request) => {
    try {
        console.log("Cron triggered");

        await sendBillingNotifications();

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error: unknown) {
        console.error("CRON ERROR:", error);

        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : "Unknown error",
            }),
            { status: 500 }
        );
    }
});