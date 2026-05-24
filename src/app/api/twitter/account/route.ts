import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { findTwitterAccountByUserUuid } from "@/models/twitter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.uuid) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const account = await findTwitterAccountByUserUuid(session.user.uuid);

  return NextResponse.json({
    connected: account?.status === "active",
    username: account?.twitter_username || null,
    twitterUserId: account?.twitter_user_id || null,
    status: account?.status || "none",
    updatedAt: account?.updated_at || null,
  });
}
