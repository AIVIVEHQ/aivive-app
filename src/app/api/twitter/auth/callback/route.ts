import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { auth } from "@/auth";
import { exchangeTwitterCode, fetchTwitterMe } from "@/services/twitter";
import { upsertTwitterAccount } from "@/models/twitter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || req.nextUrl.origin;
  const redirectUrl = new URL("/twitter-publisher", baseUrl);

  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      redirectUrl.searchParams.set("twitter_error", "Please sign in first.");
      return NextResponse.redirect(redirectUrl);
    }

    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const error = req.nextUrl.searchParams.get("error");

    if (error) {
      throw new Error(error);
    }
    if (!code || !state) {
      throw new Error("Missing Twitter/X authorization response.");
    }

    const cookieStore = await cookies();
    const expectedState = cookieStore.get("twitter_oauth_state")?.value;
    const codeVerifier = cookieStore.get("twitter_oauth_verifier")?.value;
    const stateUserUuid = state.split(":")[0];

    if (!expectedState || expectedState !== state || stateUserUuid !== session.user.uuid) {
      throw new Error("Invalid Twitter/X authorization state.");
    }
    if (!codeVerifier) {
      throw new Error("Missing Twitter/X authorization verifier.");
    }

    const token = await exchangeTwitterCode({ code, codeVerifier });
    const me = await fetchTwitterMe(token.access_token);

    await upsertTwitterAccount({
      user_uuid: session.user.uuid,
      twitter_user_id: me.id,
      twitter_username: me.username,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      token_type: token.token_type || "bearer",
      scope: token.scope,
      expires_at: token.expires_in
        ? new Date(Date.now() + Number(token.expires_in) * 1000)
        : null,
      status: "active",
      created_at: new Date(),
      updated_at: new Date(),
    });

    cookieStore.delete("twitter_oauth_state");
    cookieStore.delete("twitter_oauth_verifier");
    redirectUrl.searchParams.set("twitter_connected", "true");
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("Twitter OAuth callback failed:", err);
    redirectUrl.searchParams.set(
      "twitter_error",
      err instanceof Error ? err.message : "Twitter/X authorization failed."
    );
    return NextResponse.redirect(redirectUrl);
  }
}
