import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { countTwitterPosts, listTwitterPosts, type TwitterPostStatus } from "@/models/twitter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.uuid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || "20")));
  const status = (searchParams.get("status") || "all") as TwitterPostStatus | "all";
  const validStatuses = ["all", "draft", "generating", "ready", "publishing", "success", "failed"];

  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status filter." }, { status: 400 });
  }

  const [posts, total] = await Promise.all([
    listTwitterPosts(session.user.uuid, page, limit, status),
    countTwitterPosts(session.user.uuid, status),
  ]);

  return NextResponse.json({
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
