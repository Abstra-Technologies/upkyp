import { NextRequest, NextResponse } from "next/server";
//  for onboaridng data save to notion.

const NOTION_TOKEN = process.env.NOTION_ACCESS_TOKEN ;
const DB_ID = process.env.NOTION_ONBOARDING_DB_ID;

const NOTION_API = "https://api.notion.com/v1";

const REQUIRED_PROPERTIES = {
    landlord_id: { type: "title" },
    portfolio_size: { type: "select" },
    experience_level: { type: "select" },
    primary_goals: { type: "multi_select" },
    registered_at: { type: "date" },
};

async function ensureDatabaseProperties() {
    const dbRes = await fetch(`${NOTION_API}/databases/${DB_ID}`, {
        headers: {
            Authorization: `Bearer ${NOTION_TOKEN}`,
            "Notion-Version": "2022-06-28",
        },
    });

    if (!dbRes.ok) {
        console.error("Failed to fetch database:", await dbRes.text());
        return;
    }

    const dbData = await dbRes.json();
    const existingProps = dbData.properties;

    for (const [name, config] of Object.entries(REQUIRED_PROPERTIES)) {
        if (!existingProps[name]) {
            await fetch(`${NOTION_API}/databases/${DB_ID}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${NOTION_TOKEN}`,
                    "Notion-Version": "2022-06-28",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    properties: {
                        [name]: { type: config.type, [config.type]: {} },
                    },
                }),
            });
        }
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { landlordId, portfolioSize, experienceLevel, primaryGoals } = body;

        if (!landlordId) {
            return NextResponse.json({ error: "Landlord ID is required" }, { status: 400 });
        }

        await ensureDatabaseProperties();

        const notionBody: any = {
            parent: { database_id: DB_ID },
            properties: {
                landlord_id: {
                    title: [{ text: { content: landlordId } }],
                },
                registered_at: {
                    date: { start: new Date().toISOString() },
                },
            },
        };

        if (portfolioSize) {
            notionBody.properties.portfolio_size = {
                select: { name: portfolioSize },
            };
        }

        if (experienceLevel) {
            notionBody.properties.experience_level = {
                select: { name: experienceLevel },
            };
        }

        if (primaryGoals && Array.isArray(primaryGoals) && primaryGoals.length > 0) {
            notionBody.properties.primary_goals = {
                multi_select: primaryGoals.map((goal: string) => ({ name: goal })),
            };
        }

        const createRes = await fetch(`${NOTION_API}/pages`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${NOTION_TOKEN}`,
                "Notion-Version": "2022-06-28",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(notionBody),
        });

        if (!createRes.ok) {
            const errorText = await createRes.text();
            console.error("Notion API error:", errorText);
            return NextResponse.json({ error: "Failed to save to Notion" }, { status: 500 });
        }

        return NextResponse.json({ message: "Onboarding data saved successfully" });
    } catch (error: any) {
        console.error("Onboarding save error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
