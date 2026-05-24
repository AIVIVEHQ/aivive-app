import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { findUserTwitterPost, updateTwitterPost } from "@/models/twitter";
import { generateTweetImage } from "@/services/twitter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.uuid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postUuid, tweetText } = await req.json();
  const post = await findUserTwitterPost(session.user.uuid, String(postUuid || ""));
  if (!post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const finalTweetText = String(tweetText || post.tweet_text || "").trim();
  if (!finalTweetText) {
    return NextResponse.json(
      { error: "Tweet text is required before regenerating the image." },
      { status: 400 }
    );
  }

  try {
    const image = await generateTweetImage({
      tweetText: finalTweetText,
      postUuid: post.uuid,
    });
    const updated = await updateTwitterPost(post.uuid, {
      tweet_text: finalTweetText,
      image_prompt: image.imagePrompt,
      image_url: image.imageUrl,
      image_width: image.imageWidth,
      image_height: image.imageHeight,
      file_size: image.fileSize,
      status: "ready",
      error_message: null,
    });

    return NextResponse.json({ post: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Image regeneration failed.";
    const updated = await updateTwitterPost(post.uuid, {
      status: "failed",
      error_message: message,
    });
    return NextResponse.json({ error: message, post: updated }, { status: 500 });
  }
}
