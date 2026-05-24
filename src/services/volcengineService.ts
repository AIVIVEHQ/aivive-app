import "server-only";

import OpenAI from "openai";
import type { AspectRatio } from "@/types/generation";

const ARK_BASE_URL =
  process.env.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";

const apiKey = process.env.ARK_API_KEY || "";

const client = apiKey
  ? new OpenAI({
      baseURL: ARK_BASE_URL,
      apiKey,
    })
  : null;

const IMAGE_MODEL =
  process.env.IMAGE_MODEL || "doubao-seedream-5-0-260128";

const TEXT_MODEL =
  process.env.TEXT_MODEL || "doubao-1-5-lite-32k";

const TWEET_LIMIT = 280;

function assertClient(): OpenAI {
  if (!client) {
    throw new Error(
      "ARK_API_KEY is missing. Set it in your environment to use Volcengine Ark."
    );
  }
  return client;
}

function aspectRatioToSize(aspectRatio: AspectRatio): string {
  switch (aspectRatio) {
    case "1:1":
      return "2048x2048";
    case "16:9":
      return "2560x1440";
    case "9:16":
      return "1440x2560";
    case "3:4":
      return "1536x2048";
    default:
      return "2048x2048";
  }
}

async function fetchAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download generated image: ${response.status}`);
  }
  const contentType = response.headers.get("content-type") || "image/png";
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return `data:${contentType};base64,${base64}`;
}

interface GenerateImageOptions {
  prompt: string;
  aspectRatio?: AspectRatio;
  referenceImage?: string;
}

export async function generateImage({
  prompt,
  aspectRatio = "1:1",
  referenceImage,
}: GenerateImageOptions): Promise<string> {
  const ark = assertClient();
  const size = aspectRatioToSize(aspectRatio);

  const requestBody = {
    model: IMAGE_MODEL,
    prompt,
    size,
    response_format: "url" as const,
    watermark: false,
    ...(referenceImage ? { image: referenceImage } : {}),
  };

  const response = (await ark.images.generate(
    requestBody as unknown as Parameters<typeof ark.images.generate>[0]
  )) as { data?: Array<{ url?: string; b64_json?: string }> };

  const first = response.data?.[0];
  if (!first) {
    throw new Error("Volcengine returned no image data");
  }

  if (first.b64_json) {
    return `data:image/png;base64,${first.b64_json}`;
  }

  if (first.url) {
    return fetchAsBase64(first.url);
  }

  throw new Error("Volcengine response missing both url and b64_json");
}

export async function generateTweetText(input: string): Promise<string> {
  const ark = assertClient();

  const completion = await ark.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You write concise single-post Twitter/X copy. Return only the final tweet text. No markdown, no alternatives, no explanation.",
      },
      {
        role: "user",
        content: [
          "Turn the user's input into one polished Twitter/X post.",
          "Requirements:",
          "- one single tweet, not a thread",
          "- 280 characters or fewer",
          "- keep the original language unless a better mixed-language result is obvious",
          "- clear, specific, and suitable for social media",
          "",
          `Input:\n${input}`,
        ].join("\n"),
      },
    ],
  });

  const rawText = completion.choices?.[0]?.message?.content?.trim() || "";
  const cleaned = rawText.replace(/^["“]|["”]$/g, "").trim();
  if (!cleaned) {
    return input.slice(0, TWEET_LIMIT);
  }
  return cleaned.length <= TWEET_LIMIT ? cleaned : cleaned.slice(0, TWEET_LIMIT);
}
