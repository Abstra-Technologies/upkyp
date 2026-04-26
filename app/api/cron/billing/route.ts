import { verifySignature } from "@upstash/qstash/nextjs";
import {sendBillingNotifications} from "@/utils/cronjobs/billingCron";

export const POST = verifySignature(async () => {
    console.log("Running billing notification cron...");

    await sendBillingNotifications();

    return Response.json({ success: true });
});