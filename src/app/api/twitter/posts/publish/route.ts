import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { findUserTwitterPost, updateTwitterPost } from "@/models/twitter";
import {
  assertTweetLength,
  getValidTwitterAccount,
  publishTweet,
  uploadTwitterMedia,
} from "@/services/twitter";

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

  if (post.status === "publishing") {
    return NextResponse.json(
      { error: "This post is already publishing." },
      { status: 409 }
    );
  }
  if (post.status === "success") {
    return NextResponse.json({ post });
  }

  const finalTweetText = String(tweetText || post.tweet_text || "").trim();
  if (!finalTweetText) {
    return NextResponse.json({ error: "Tweet text is required." }, { status: 400 });
  }
  if (!post.image_url) {
    return NextResponse.json({ error: "Generated image is required." }, { status: 400 });
  }

  try {
    assertTweetLength(finalTweetText);
    await updateTwitterPost(post.uuid, {
      status: "publishing",
      tweet_text: finalTweetText,
      error_message: null,
    });

    const account = await getValidTwitterAccount(session.user.uuid);
    const mediaId = await uploadTwitterMedia({
      accessToken: account.access_token,
      imageUrl: post.image_url,
    });
    const published = await publishTweet({
      accessToken: account.access_token,
      tweetText: finalTweetText,
      mediaId,
    });

    const updated = await updateTwitterPost(post.uuid, {
      status: "success",
      twitter_media_id: mediaId,
      twitter_tweet_id: published.tweetId,
      twitter_tweet_url: published.tweetUrl,
      published_at: new Date(),
      error_message: null,
    });

    return NextResponse.json({ post: updated });
  } catch (err) {
    console.error("Twitter publish failed:", err);
    const message = err instanceof Error ? err.message : "Twitter/X publish failed.";
    const updated = await updateTwitterPost(post.uuid, {
      status: "failed",
      error_message: message,
    });
    return NextResponse.json({ error: message, post: updated }, { status: 500 });
  }
}
