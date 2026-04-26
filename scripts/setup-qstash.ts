import { Client } from "@upstash/qstash";

const client = new Client({
    token: process.env.QSTASH_TOKEN!,
});

async function main() {
    await client.schedules.create({
        destination: "https://yourdomain.com/api/cron/generate-billing",
        cron: "0 0 1 * *",
    });

    console.log("Cron job created!");
}

main();