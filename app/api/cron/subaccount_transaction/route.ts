import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { syncSubaccountTransactions } from "@/utils/cronjobs/subaccountTransactions";

export const POST = verifySignatureAppRouter(async (request: Request) => {
    try {
        const inserted = await syncSubaccountTransactions();
        return new Response(JSON.stringify({ ok: true, message: `Inserted ${inserted} transactions` }), { status: 200 });
    } catch (error: unknown) {
        console.error("SUBACCOUNT TRANSACTION CRON ERROR:", error);
        return new Response(
            JSON.stringify({
                ok: false,
                error: error instanceof Error ? error.message : "Unknown error",
            }),
            { status: 500 }
        );
    }
});
