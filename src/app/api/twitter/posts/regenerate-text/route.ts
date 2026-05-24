import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { findUserTwitterPost, updateTwitterPost } from "@/models/twitter";
import { generateTweetText } from "@/services/twitter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.uuid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postUuid } = await req.json();
  const post = await findUserTwitterPost(session.user.uuid, String(postUuid || ""));
  if (!post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  try {
    const tweetText = await generateTweetText(post.input_text);
    const updated = await updateTwitterPost(post.uuid, {
      tweet_text: tweetText,
      status: "ready",
      error_message: null,
    });

    return NextResponse.json({ post: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tweet regeneration failed.";
    const updated = await updateTwitterPost(post.uuid, {
      status: "failed",
      error_message: message,
    });
    return NextResponse.json({ error: message, post: updated }, { status: 500 });
  }
}
