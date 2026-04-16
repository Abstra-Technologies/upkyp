import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { GOOGLE_CLIENT_ID, REDIRECT_URI_SIGNIN } = process.env;

    if (!GOOGLE_CLIENT_ID || !REDIRECT_URI_SIGNIN) {
        return NextResponse.json(
            { error: "Missing GOOGLE_CLIENT_ID or REDIRECT_URI_SIGNIN" },
            { status: 500 }
        );
    }

    const { searchParams } = new URL(req.url);
    const callbackUrl = searchParams.get("callbackUrl") || "";

    const state = JSON.stringify({ callbackUrl });

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

    googleAuthUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    googleAuthUrl.searchParams.set("redirect_uri", REDIRECT_URI_SIGNIN);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "consent");
    googleAuthUrl.searchParams.set("state", state);

    return NextResponse.redirect(googleAuthUrl);
}
