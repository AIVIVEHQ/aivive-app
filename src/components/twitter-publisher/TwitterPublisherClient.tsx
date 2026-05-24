"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ImageIcon,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
  const [inputText, setInputText] = useState("");
  const [tweetText, setTweetText] = useState("");
  const [currentPost, setCurrentPost] = useState<TwitterPost | null>(null);
  const [history, setHistory] = useState<TwitterPost[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegeneratingText, setIsRegeneratingText] = useState(false);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void fetchHistory();
  }, []);

  useEffect(() => {
    if (currentPost?.tweet_text) {
      setTweetText(currentPost.tweet_text);
    }
  }, [currentPost?.tweet_text]);

  const canPublish = useMemo(() => {
    return (
      !!currentPost?.uuid &&
      !!tweetText.trim() &&
      tweetText.length <= 280 &&
      !isPublishing
    );
  }, [currentPost?.uuid, tweetText, isPublishing]);

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
    setNotice("");
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
    setNotice("");

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
    setNotice("");

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
    if (!currentPost?.uuid || !tweetText.trim()) return;
    setError("");
    setNotice("");
    setIsPublishing(true);

    let imageStatus: "clipboard" | "downloaded" | "opened" | "none" = "none";

    try {
      if (currentPost.image_url) {
        try {
          const res = await fetch(currentPost.image_url);
          if (!res.ok) throw new Error("Fetch failed");
          const blob = await res.blob();
          await navigator.clipboard.write([
            new ClipboardItem({ [blob.type]: blob }),
          ]);
          imageStatus = "clipboard";
        } catch {
          try {
            const res = await fetch(currentPost.image_url);
            if (!res.ok) throw new Error("Fetch failed");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `tweet-image-${currentPost.uuid}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            imageStatus = "downloaded";
          } catch {
            window.open(currentPost.image_url, "_blank", "noopener,noreferrer");
            imageStatus = "opened";
          }
        }
      }

      const intentUrl = `https://x.com/intent/post?text=${encodeURIComponent(tweetText)}`;
      window.open(intentUrl, "_blank", "noopener,noreferrer");

      if (imageStatus === "clipboard") {
        setNotice("Image copied to clipboard. Paste it (Cmd+V) inside X's composer.");
      } else if (imageStatus === "downloaded") {
        setNotice("Image downloaded. Drag it into X's composer.");
      } else if (imageStatus === "opened") {
        setNotice("Image opened in a new tab. Right-click to copy or save, then attach in X.");
      } else {
        setNotice("X composer opened. Add your image manually if needed.");
      }
    } finally {
      setIsPublishing(false);
    }
  }

  const statusLabel = currentPost?.status || "draft";

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Twitter/X AI Publisher
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate one polished tweet with a matching image, then post it on X.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4" />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 size-4" />
            <span>{notice}</span>
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
              Post to X
            </Button>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
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
