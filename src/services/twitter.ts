import "server-only";

import { GoogleGenAI } from "@google/genai";

import { findTwitterAccountByUserUuid, updateTwitterAccount } from "@/models/twitter";
import { getTwitterBasicAuthHeader, getTwitterRedirectUri } from "@/lib/twitter-oauth";
import { newStorage } from "@/lib/storage";
import { generateImage as generateImageWithGemini } from "@/services/geminiService";

const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const TWEET_LIMIT = 280;

export function assertTweetLength(tweetText: string) {
  if (tweetText.length > TWEET_LIMIT) {
    throw new Error(`Tweet text must be ${TWEET_LIMIT} characters or fewer.`);
  }
}

export async function generateTweetText(inputText: string) {
  const model = process.env.TWITTER_TEXT_MODEL || "gemini-flash-latest";
  const fallback = compactFallbackTweet(inputText);

  if (!geminiClient) {
    return fallback;
  }

  const prompt = [
    "You write concise single-post Twitter/X copy. Return only the final tweet text. No markdown, no alternatives, no explanation.",
    "",
    "Turn the user's input into one polished Twitter/X post.",
    "Requirements:",
    "- one single tweet, not a thread",
    "- 280 characters or fewer",
    "- keep the original language unless a better mixed-language result is obvious",
    "- clear, specific, and suitable for social media",
    "",
    `Input:\n${inputText}`,
  ].join("\n");

  const response = await geminiClient.models.generateContent({
    model,
    contents: { parts: [{ text: prompt }] },
  });

  const rawText = (response.candidates?.[0]?.content?.parts || [])
    .map((p) => p.text || "")
    .join("")
    .trim();

  const cleaned = rawText.replace(/^["“]|["”]$/g, "").trim();
  if (!cleaned) return fallback;
  return cleaned.length <= TWEET_LIMIT ? cleaned : compactFallbackTweet(cleaned);
}

export function buildImagePrompt(tweetText: string) {
  return [
    "Create a polished 16:9 social media image for a Twitter/X post.",
    "The image must visually match this tweet:",
    tweetText,
    "Style: premium editorial, crisp composition, high contrast, modern, readable if text appears, no UI screenshots unless implied, no logos.",
  ].join("\n");
}

export async function generateTweetImage({
  tweetText,
  postUuid,
}: {
  tweetText: string;
  postUuid: string;
}) {
  const prompt = buildImagePrompt(tweetText);

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required to generate tweet images.");
  }

  const dataUrl = await generateImageWithGemini(prompt, "16:9");
  if (!dataUrl) {
    throw new Error("AI image generation failed.");
  }

  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64, "base64");
  const storage = newStorage();
  const upload = await storage.uploadGenerationImageFromBuffer(
    imageBuffer,
    `twitter-posts/${postUuid}`
  );

  return {
    imagePrompt: prompt,
    imageUrl: upload.imageUrl,
    imageWidth: upload.width,
    imageHeight: upload.height,
    fileSize: upload.fileSize,
  };
}

export async function exchangeTwitterCode({
  code,
  codeVerifier,
}: {
  code: string;
  codeVerifier: string;
}) {
  const clientId = process.env.TWITTER_CLIENT_ID;
  if (!clientId) {
    throw new Error("TWITTER_CLIENT_ID is not configured");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  const basicAuth = getTwitterBasicAuthHeader();
  if (basicAuth) {
    headers.Authorization = basicAuth;
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getTwitterRedirectUri(),
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  const response = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers,
    body,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || "Twitter token exchange failed");
  }

  return data as {
    token_type: string;
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };
}

export async function refreshTwitterToken(userUuid: string) {
  const account = await findTwitterAccountByUserUuid(userUuid);
  if (!account?.refresh_token) {
    throw new Error("Twitter authorization expired. Please reconnect Twitter/X.");
  }

  const clientId = process.env.TWITTER_CLIENT_ID;
  if (!clientId) {
    throw new Error("TWITTER_CLIENT_ID is not configured");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  const basicAuth = getTwitterBasicAuthHeader();
  if (basicAuth) {
    headers.Authorization = basicAuth;
  }

  const response = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers,
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
      client_id: clientId,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    await updateTwitterAccount(userUuid, { status: "expired" });
    throw new Error(data.error_description || data.error || "Twitter token refresh failed");
  }

  const expiresAt = data.expires_in
    ? new Date(Date.now() + Number(data.expires_in) * 1000)
    : account.expires_at;

  return updateTwitterAccount(userUuid, {
    access_token: data.access_token,
    refresh_token: data.refresh_token || account.refresh_token,
    token_type: data.token_type || "bearer",
    scope: data.scope || account.scope,
    expires_at: expiresAt,
    status: "active",
  });
}

export async function getValidTwitterAccount(userUuid: string) {
  let account = await findTwitterAccountByUserUuid(userUuid);
  if (!account || account.status !== "active") {
    throw new Error("Please connect your Twitter/X account before publishing.");
  }

  if (account.expires_at && account.expires_at.getTime() < Date.now() + 60_000) {
    account = await refreshTwitterToken(userUuid);
  }

  if (!account) {
    throw new Error("Twitter/X account is not available.");
  }

  return account;
}

export async function fetchTwitterMe(accessToken: string) {
  const response = await fetch("https://api.twitter.com/2/users/me?user.fields=username", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.detail || body.title || "Failed to fetch Twitter/X account");
  }

  return body.data as { id: string; username: string };
}

export async function uploadTwitterMedia({
  accessToken,
  imageUrl,
}: {
  accessToken: string;
  imageUrl: string;
}) {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error("Failed to download generated image for Twitter/X upload.");
  }

  const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
  const blob = await imageResponse.blob();
  const formData = new FormData();
  formData.set("media", blob, "tweet-image.jpg");
  formData.set("media_category", "tweet_image");

  const response = await fetch("https://api.twitter.com/2/media/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.detail || body.title || "Twitter/X image upload failed.");
  }

  const mediaId = body.data?.id || body.media_id_string || body.media_id;
  if (!mediaId) {
    throw new Error("Twitter/X did not return a media id.");
  }

  return String(mediaId);
}

export async function publishTweet({
  accessToken,
  tweetText,
  mediaId,
}: {
  accessToken: string;
  tweetText: string;
  mediaId: string;
}) {
  assertTweetLength(tweetText);

  const response = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: tweetText,
      media: {
        media_ids: [mediaId],
      },
    }),
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.detail || body.title || "Twitter/X publish failed.");
  }

  const tweetId = body.data?.id;
  if (!tweetId) {
    throw new Error("Twitter/X did not return a tweet id.");
  }

  return {
    tweetId: String(tweetId),
    tweetUrl: `https://twitter.com/i/web/status/${tweetId}`,
  };
}

function compactFallbackTweet(input: string) {
  const text = input.replace(/\s+/g, " ").trim();
  if (text.length <= TWEET_LIMIT) {
    return text;
  }

  return `${text.slice(0, TWEET_LIMIT - 1).trimEnd()}…`;
}
