import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { createTwitterPost, updateTwitterPost } from "@/models/twitter";
import { generateTweetImage, generateTweetText } from "@/services/twitter";
import { getUuid } from "@/lib/hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.uuid) {
    return NextResponse.json(
      { error: "Please sign in before generating Twitter/X content." },
      { status: 401 }
    );
  }

  const { inputText } = await req.json();
  const normalizedInput = String(inputText || "").trim();
  if (!normalizedInput) {
    return NextResponse.json({ error: "Input text is required." }, { status: 400 });
  }
  if (normalizedInput.length < 3) {
    return NextResponse.json(
      { error: "Please enter a more specific input." },
      { status: 400 }
    );
  }

  const postUuid = getUuid();
  await createTwitterPost({
    uuid: postUuid,
    user_uuid: session.user.uuid,
    input_text: normalizedInput,
    status: "generating",
    created_at: new Date(),
    updated_at: new Date(),
  });

  let tweetText: string | null = null;
  try {
    tweetText = await generateTweetText(normalizedInput);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate tweet text.";
    const post = await updateTwitterPost(postUuid, {
      status: "failed",
      error_message: message,
    });
    return NextResponse.json({ error: message, post }, { status: 500 });
  }

  try {
    const image = await generateTweetImage({ tweetText, postUuid });

    const post = await updateTwitterPost(postUuid, {
      tweet_text: tweetText,
      image_prompt: image.imagePrompt,
      image_url: image.imageUrl,
      image_width: image.imageWidth,
      image_height: image.imageHeight,
      file_size: image.fileSize,
      status: "ready",
      error_message: null,
    });

    return NextResponse.json({ post });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate tweet image.";
    const post = await updateTwitterPost(postUuid, {
      tweet_text: tweetText,
      status: "failed",
      error_message: message,
    });
    return NextResponse.json({ error: message, post }, { status: 500 });
  }
}
