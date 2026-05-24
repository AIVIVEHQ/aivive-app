import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { auth } from "@/auth";
import {
  createPkcePair,
  createTwitterState,
  getTwitterAuthUrl,
} from "@/lib/twitter-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.uuid) {
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";
    return NextResponse.redirect(new URL("/auth/signin", baseUrl));
  }

  const { verifier, challenge } = createPkcePair();
  const state = createTwitterState(session.user.uuid);
  const cookieStore = await cookies();

  cookieStore.set("twitter_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });
  cookieStore.set("twitter_oauth_verifier", verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });

  return NextResponse.redirect(getTwitterAuthUrl({ state, codeChallenge: challenge }));
}
