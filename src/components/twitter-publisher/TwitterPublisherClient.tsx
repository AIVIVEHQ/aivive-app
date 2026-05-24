"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Twitter,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type TwitterAccount = {
  connected: boolean;
  username: string | null;
  status: string;
};

type TwitterPost = {
  uuid: string;
  input_text: string;
  tweet_text: string | null;
  image_url: string | null;
  status: "draft" | "generating" | "ready" | "publishing" | "success" | "failed";
  twitter_tweet_url: string | null;
  error_message: string | null;
  created_at: string;
  published_at: string | null;
};

type ApiResult = {
  post?: TwitterPost;
  error?: string;
};

export default function TwitterPublisherClient() {
  const [account, setAccount] = useState<TwitterAccount | null>(null);
  const [inputText, setInputText] = useState("");
  const [tweetText, setTweetText] = useState("");
  const [currentPost, setCurrentPost] = useState<TwitterPost | null>(null);
  const [history, setHistory] = useState<TwitterPost[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegeneratingText, setIsRegeneratingText] = useState(false);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchAccount();
    void fetchHistory();
  }, []);

  useEffect(() => {
    if (currentPost?.tweet_text) {
      setTweetText(currentPost.tweet_text);
    }
  }, [currentPost?.tweet_text]);

  const canPublish = useMemo(() => {
    return (
      !!account?.connected &&
      !!currentPost?.uuid &&
      !!currentPost.image_url &&
      !!tweetText.trim() &&
      tweetText.length <= 280 &&
      !isPublishing
    );
  }, [account?.connected, currentPost?.uuid, currentPost?.image_url, tweetText, isPublishing]);

  async function fetchAccount() {
    const response = await fetch("/api/twitter/account");
    if (response.ok) {
      setAccount(await response.json());
    }
  }

  async function fetchHistory() {
    const response = await fetch("/api/twitter/posts/history?limit=12");
    if (response.ok) {
      const data = await response.json();
      setHistory(data.posts || []);
    }
  }

  async function callPostApi(url: string, body: Record<string, unknown>) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as ApiResult;
    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }
    if (!data.post) {
      throw new Error("Response did not include a post.");
    }
    setCurrentPost(data.post);
    setTweetText(data.post.tweet_text || "");
    await fetchHistory();
    return data.post;
  }

  async function handleGenerate() {
    setError("");
    if (!inputText.trim()) {
      setError("Please enter source text before generating.");
      return;
    }

    try {
      setIsGenerating(true);
      await callPostApi("/api/twitter/posts/generate", {
        inputText: inputText.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRegenerateText() {
    if (!currentPost?.uuid) return;
    setError("");

    try {
      setIsRegeneratingText(true);
      await callPostApi("/api/twitter/posts/regenerate-text", {
        postUuid: currentPost.uuid,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tweet regeneration failed");
    } finally {
      setIsRegeneratingText(false);
    }
  }

  async function handleRegenerateImage() {
    if (!currentPost?.uuid) return;
    setError("");

    try {
      setIsRegeneratingImage(true);
      await callPostApi("/api/twitter/posts/regenerate-image", {
        postUuid: currentPost.uuid,
        tweetText,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image regeneration failed");
    } finally {
      setIsRegeneratingImage(false);
    }
  }

  async function handlePublish() {
    if (!currentPost?.uuid) return;
    setError("");

    try {
      setIsPublishing(true);
      await callPostApi("/api/twitter/posts/publish", {
        postUuid: currentPost.uuid,
        tweetText,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setIsPublishing(false);
    }
  }

  const statusLabel = currentPost?.status || "draft";

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Twitter/X AI Publisher
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate one polished tweet with a matching image, then publish it to X.
            </p>
          </div>
          <Button asChild variant={account?.connected ? "outline" : "default"}>
            <a href="/api/twitter/auth/start">
              <Twitter className="size-4" />
              {account?.connected ? `@${account.username}` : "Connect Twitter/X"}
            </a>
          </Button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-4 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-medium">Source Text</h2>
            <Badge variant="outline">Single tweet</Badge>
          </div>
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste a product update, launch note, idea, or article summary..."
            className="min-h-40 resize-y"
          />
          <Button onClick={handleGenerate} disabled={isGenerating || !inputText.trim()}>
            {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {isGenerating ? "Generating..." : "Generate Tweet + Image"}
          </Button>
        </div>

        <div className="grid gap-4 rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-medium">Preview</h2>
            <Badge variant={statusLabel === "success" ? "default" : "secondary"}>
              {statusLabel}
            </Badge>
          </div>

          <Textarea
            value={tweetText}
            onChange={(e) => setTweetText(e.target.value)}
            placeholder="Generated tweet text will appear here."
            className="min-h-32 resize-y text-base"
            disabled={!currentPost}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{tweetText.length}/280 characters</span>
            {tweetText.length > 280 && <span className="text-destructive">Tweet is too long.</span>}
          </div>

          <div className="overflow-hidden rounded-md border bg-muted">
            {currentPost?.image_url ? (
              <img
                src={currentPost.image_url}
                alt="Generated Twitter/X image"
                className="aspect-video w-full object-cover"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center text-muted-foreground">
                <ImageIcon className="mr-2 size-5" />
                Generated image preview
              </div>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <Button
              variant="outline"
              onClick={handleRegenerateText}
              disabled={!currentPost || isRegeneratingText}
            >
              {isRegeneratingText ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Text
            </Button>
            <Button
              variant="outline"
              onClick={handleRegenerateImage}
              disabled={!currentPost || !tweetText.trim() || isRegeneratingImage}
            >
              {isRegeneratingImage ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Image
            </Button>
            <Button onClick={handlePublish} disabled={!canPublish}>
              {isPublishing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Publish
            </Button>
          </div>

          {currentPost?.twitter_tweet_url && (
            <Button asChild variant="outline">
              <a href={currentPost.twitter_tweet_url} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                Open Published Tweet
              </a>
            </Button>
          )}
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-lg border bg-card p-4">
          <h2 className="text-lg font-medium">Connection</h2>
          <div className="mt-3 flex items-center gap-2 text-sm">
            {account?.connected ? (
              <>
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>Connected as @{account.username}</span>
              </>
            ) : (
              <>
                <AlertCircle className="size-4 text-amber-500" />
                <span>Twitter/X must be connected before publishing.</span>
              </>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="text-lg font-medium">Publishing History</h2>
          <div className="mt-4 space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No Twitter/X posts yet.</p>
            ) : (
              history.map((post) => (
                <button
                  key={post.uuid}
                  onClick={() => setCurrentPost(post)}
                  className="w-full rounded-md border p-3 text-left transition hover:bg-muted"
                  type="button"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge variant={post.status === "success" ? "default" : "outline"}>
                      {post.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="line-clamp-3 text-sm">
                    {post.tweet_text || post.input_text}
                  </p>
                  {post.error_message && (
                    <p className="mt-2 line-clamp-2 text-xs text-destructive">
                      {post.error_message}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
