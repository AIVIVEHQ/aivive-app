import { createHash, randomBytes } from "crypto";

export const TWITTER_SCOPES = [
  "tweet.read",
  "tweet.write",
  "users.read",
  "offline.access",
  "media.write",
].join(" ");

function base64Url(input: Buffer) {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function createPkcePair() {
  const verifier = base64Url(randomBytes(32));
  const challenge = base64Url(createHash("sha256").update(verifier).digest());

  return { verifier, challenge };
}

export function createTwitterState(userUuid: string) {
  return `${userUuid}:${base64Url(randomBytes(16))}`;
}

export function getTwitterRedirectUri() {
  const baseUrl =
    process.env.NEXT_PUBLIC_WEB_URL ||
    process.env.AUTH_URL?.replace(/\/api\/auth$/, "") ||
    "http://localhost:3000";

  return `${baseUrl.replace(/\/$/, "")}/api/twitter/auth/callback`;
}

export function getTwitterAuthUrl({
  state,
  codeChallenge,
}: {
  state: string;
  codeChallenge: string;
}) {
  const clientId = process.env.TWITTER_CLIENT_ID;
  if (!clientId) {
    throw new Error("TWITTER_CLIENT_ID is not configured");
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: getTwitterRedirectUri(),
    scope: TWITTER_SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `https://x.com/i/oauth2/authorize?${params.toString()}`;
}

export function getTwitterBasicAuthHeader() {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return undefined;
  }

  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}
