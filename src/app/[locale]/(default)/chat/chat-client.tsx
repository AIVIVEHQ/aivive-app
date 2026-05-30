"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowUpIcon,
  CopyIcon,
  MenuIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SparklesIcon,
  SquareIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Loader } from "@/components/ai-elements/loader";

type ConversationSummary = {
  uuid: string;
  title: string;
  updated_at: string | null;
};

function extractText(message: UIMessage): string {
  const parts = (message as { parts?: Array<{ type: string; text?: string }> })
    .parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .filter((p) => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text as string)
    .join("");
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChatClient() {
  const t = useTranslations("chat");

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Stable id used for the next outgoing request when there is no active
  // conversation yet. Rotated whenever the user starts a new chat.
  const [draftId, setDraftId] = useState<string>(() => newId());
  const conversationIdRef = useRef<string>(draftId);
  conversationIdRef.current = activeId ?? draftId;

  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [chatKey, setChatKey] = useState(0);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [composerText, setComposerText] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  const refreshConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      if (!res.ok) return;
      const data = (await res.json()) as { conversations: ConversationSummary[] };
      setConversations(data.conversations ?? []);
    } catch (err) {
      console.error("load conversations failed:", err);
    }
  }, []);

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ conversationId: conversationIdRef.current }),
      }),
    []
  );

  const {
    messages,
    sendMessage,
    status,
    stop,
    regenerate,
    error,
    setMessages,
  } = useChat({
    id: activeId ?? `draft-${chatKey}`,
    messages: initialMessages,
    transport,
    onError: (err) => {
      console.error("chat error:", err);
      toast.error(t("errorMessage"));
    },
    onFinish: () => {
      // Adopt the outgoing id as active so future sends keep updating the same
      // row, then refresh the sidebar to pick up the server-derived title.
      if (!activeId) setActiveId(conversationIdRef.current);
      void refreshConversations();
    },
  });

  function startNewChat() {
    setActiveId(null);
    setDraftId(newId());
    setInitialMessages([]);
    setMessages([]);
    setChatKey((k) => k + 1);
    setSidebarOpen(false);
  }

  async function openConversation(uuid: string) {
    try {
      const res = await fetch(`/api/chat/conversations/${uuid}`);
      if (!res.ok) {
        toast.error(t("errorMessage"));
        return;
      }
      const data = (await res.json()) as {
        conversation: { uuid: string; messages: UIMessage[] };
      };
      const loaded = data.conversation.messages ?? [];
      setActiveId(data.conversation.uuid);
      setInitialMessages(loaded);
      setMessages(loaded);
      setChatKey((k) => k + 1);
      setSidebarOpen(false);
    } catch (err) {
      console.error("open conversation failed:", err);
      toast.error(t("errorMessage"));
    }
  }

  async function handleDelete(uuid: string) {
    try {
      const res = await fetch(`/api/chat/conversations/${uuid}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error(t("errorMessage"));
        return;
      }
      if (activeId === uuid) startNewChat();
      await refreshConversations();
    } catch (err) {
      console.error("delete conversation failed:", err);
      toast.error(t("errorMessage"));
    }
  }

  async function handleRenameCommit() {
    if (!editingTitleId) return;
    const next = titleDraft.trim();
    const id = editingTitleId;
    setEditingTitleId(null);
    setTitleDraft("");
    if (!next) return;
    try {
      const res = await fetch(`/api/chat/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: next }),
      });
      if (!res.ok) {
        toast.error(t("errorMessage"));
        return;
      }
      await refreshConversations();
    } catch (err) {
      console.error("rename conversation failed:", err);
      toast.error(t("errorMessage"));
    }
  }

  function handleCopy(text: string) {
    if (!text) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => toast.success(t("copied")),
        () => toast.error(t("copyFailed"))
      );
    }
  }

  function handleSend(payload: { text?: string }) {
    const text = payload.text?.trim();
    if (!text) return;
    sendMessage({ text });
  }

  function handleSuggestion(text: string) {
    sendMessage({ text });
  }

  const suggestions = useMemo(
    () => [
      t("suggestionExplain"),
      t("suggestionWrite"),
      t("suggestionDebug"),
      t("suggestionBrainstorm"),
    ],
    [t]
  );

  const isLoading = status === "submitted" || status === "streaming";
  const canRegenerate =
    !isLoading &&
    messages.length > 0 &&
    messages[messages.length - 1]?.role === "assistant";

  return (
    <div className="container mx-auto flex h-[calc(100vh-9rem)] gap-4 px-2 py-4 md:px-4">
      <ConversationSidebar
        conversations={conversations}
        activeId={activeId}
        editingTitleId={editingTitleId}
        titleDraft={titleDraft}
        setTitleDraft={setTitleDraft}
        setEditingTitleId={setEditingTitleId}
        onCommitRename={handleRenameCommit}
        onNewChat={startNewChat}
        onOpenConversation={openConversation}
        onDelete={handleDelete}
        t={t}
        className="hidden w-64 shrink-0 md:flex"
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
        <header className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label={t("openSidebar")}
                >
                  <MenuIcon className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="border-b px-4 py-3">
                  <SheetTitle>{t("conversations")}</SheetTitle>
                </SheetHeader>
                <div className="h-[calc(100%-3.5rem)] p-2">
                  <ConversationSidebar
                    conversations={conversations}
                    activeId={activeId}
                    editingTitleId={editingTitleId}
                    titleDraft={titleDraft}
                    setTitleDraft={setTitleDraft}
                    setEditingTitleId={setEditingTitleId}
                    onCommitRename={handleRenameCommit}
                    onNewChat={startNewChat}
                    onOpenConversation={openConversation}
                    onDelete={handleDelete}
                    t={t}
                    className="flex h-full w-full border-none p-0"
                    embedded
                  />
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]"
              />
              <h1 className="truncate text-sm font-medium text-foreground/90 sm:text-base">
                {activeTitle(activeId, conversations, t)}
              </h1>
            </div>
          </div>
        </header>

        <Conversation className="min-h-0 flex-1">
          <ConversationContent>
            {messages.length === 0 ? (
              <div className="flex size-full flex-col items-center justify-center gap-5 p-8 text-center">
                <div className="relative">
                  <div
                    aria-hidden
                    className="absolute inset-0 -m-6 rounded-full bg-primary/20 blur-2xl"
                  />
                  <div className="relative flex size-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
                    <SparklesIcon className="size-7" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-lg font-semibold tracking-tight">
                    {t("emptyTitle")}
                  </h2>
                  <p className="max-w-md text-sm text-muted-foreground">
                    {t("emptyDescription")}
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message, idx) => {
                const isLast = idx === messages.length - 1;
                return (
                  <Message key={message.id} from={message.role}>
                    <MessageContent>
                      {(message.parts ?? []).map((part, i) => {
                        if (part.type === "text") {
                          return (
                            <MessageResponse key={i}>
                              {part.text}
                            </MessageResponse>
                          );
                        }
                        if (part.type === "reasoning") {
                          const isStreaming =
                            isLast &&
                            status === "streaming" &&
                            message.role === "assistant";
                          return (
                            <Reasoning
                              key={i}
                              className="w-full"
                              isStreaming={isStreaming}
                            >
                              <ReasoningTrigger />
                              <ReasoningContent>{part.text}</ReasoningContent>
                            </Reasoning>
                          );
                        }
                        return null;
                      })}
                      {message.role === "assistant" && (
                        <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                            onClick={() => handleCopy(extractText(message))}
                          >
                            <CopyIcon className="size-3" />
                            {t("copy")}
                          </Button>
                          {isLast && canRegenerate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1 px-2 text-xs"
                              onClick={() => regenerate()}
                            >
                              <RotateCcwIcon className="size-3" />
                              {t("regenerate")}
                            </Button>
                          )}
                        </div>
                      )}
                    </MessageContent>
                  </Message>
                );
              })
            )}
            {status === "submitted" && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader />
                <span className="text-xs">{t("thinking")}</span>
              </div>
            )}
            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {t("errorMessage")}
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t border-border/60 bg-background/40 px-3 pb-3 pt-3 md:px-4">
          <div className="mx-auto w-full max-w-3xl">
            {messages.length === 0 && (
              <Suggestions className="mb-2.5 justify-center">
                {suggestions.map((s) => (
                  <Suggestion
                    key={s}
                    suggestion={s}
                    onClick={handleSuggestion}
                    className="h-7 border-border/50 bg-background/30 px-3 text-xs font-normal text-foreground/75 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                  />
                ))}
              </Suggestions>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const text = composerText.trim();
                if (!text || isLoading || status === "error") return;
                handleSend({ text });
                setComposerText("");
              }}
            >
              <div className="relative flex items-end rounded-2xl border border-border/60 bg-background/60 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[border-color,background-color,box-shadow] duration-150 focus-within:border-primary/35 focus-within:bg-background/80 focus-within:shadow-[0_8px_24px_-12px_color-mix(in_oklch,var(--color-primary)_28%,transparent)]">
                <textarea
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !e.nativeEvent.isComposing &&
                      !isComposing
                    ) {
                      e.preventDefault();
                      const text = composerText.trim();
                      if (!text || isLoading || status === "error") return;
                      handleSend({ text });
                      setComposerText("");
                    }
                  }}
                  placeholder={t("inputPlaceholder")}
                  disabled={status === "error"}
                  rows={1}
                  className="field-sizing-content max-h-40 min-h-[44px] w-full resize-none bg-transparent px-4 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {isLoading ? (
                  <button
                    type="button"
                    onClick={() => stop()}
                    aria-label={t("stop")}
                    className="m-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground/80 transition-colors hover:bg-muted/70"
                  >
                    <SquareIcon className="size-3.5 fill-current" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    aria-label={t("send")}
                    disabled={!composerText.trim() || status === "error"}
                    className="m-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground/50 disabled:shadow-none"
                  >
                    <ArrowUpIcon className="size-4" strokeWidth={2.5} />
                  </button>
                )}
              </div>
              <p className="mt-1.5 px-1 text-center text-[11px] text-muted-foreground/60">
                {t("submitHint")}
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function activeTitle(
  activeId: string | null,
  conversations: ConversationSummary[],
  t: ReturnType<typeof useTranslations>
): string {
  if (!activeId) return t("newChat");
  const found = conversations.find((c) => c.uuid === activeId);
  return found?.title?.trim() || t("newChat");
}

type SidebarProps = {
  conversations: ConversationSummary[];
  activeId: string | null;
  editingTitleId: string | null;
  titleDraft: string;
  setTitleDraft: (v: string) => void;
  setEditingTitleId: (v: string | null) => void;
  onCommitRename: () => void;
  onNewChat: () => void;
  onOpenConversation: (uuid: string) => void;
  onDelete: (uuid: string) => void;
  t: ReturnType<typeof useTranslations>;
  className?: string;
  embedded?: boolean;
};

function ConversationSidebar({
  conversations,
  activeId,
  editingTitleId,
  titleDraft,
  setTitleDraft,
  setEditingTitleId,
  onCommitRename,
  onNewChat,
  onOpenConversation,
  onDelete,
  t,
  className,
  embedded,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col gap-3 overflow-hidden rounded-xl border bg-card p-3",
        className
      )}
    >
      <Button
        variant="outline"
        onClick={onNewChat}
        className={cn(
          "group w-full justify-start gap-2 border-border/70 bg-background/40 text-foreground/90 hover:border-primary/50 hover:bg-primary/5 hover:text-foreground",
          embedded && "rounded-md"
        )}
      >
        <span className="flex size-5 items-center justify-center rounded-md bg-primary/15 text-primary transition-colors group-hover:bg-primary/25">
          <PlusIcon className="size-3.5" />
        </span>
        <span className="text-sm">{t("newChat")}</span>
      </Button>
      <div className="-mr-1 min-h-0 flex-1 overflow-y-auto pr-1">
        {conversations.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            {t("noConversations")}
          </p>
        ) : (
          <ul className="space-y-1">
            {conversations.map((c) => {
              const isActive = c.uuid === activeId;
              const isEditing = c.uuid === editingTitleId;
              const displayTitle = c.title?.trim() || t("newChat");
              return (
                <li key={c.uuid}>
                  <div
                    className={cn(
                      "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {isEditing ? (
                      <Input
                        autoFocus
                        value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        onBlur={onCommitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") onCommitRename();
                          if (e.key === "Escape") {
                            setEditingTitleId(null);
                            setTitleDraft("");
                          }
                        }}
                        className="h-7 text-sm"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenConversation(c.uuid)}
                        className="flex-1 truncate text-left"
                        title={displayTitle}
                      >
                        {displayTitle}
                      </button>
                    )}
                    {!isEditing && (
                      <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() => {
                            setEditingTitleId(c.uuid);
                            setTitleDraft(displayTitle);
                          }}
                          aria-label={t("rename")}
                        >
                          <PencilIcon className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 text-muted-foreground hover:text-destructive"
                          onClick={() => onDelete(c.uuid)}
                          aria-label={t("delete")}
                        >
                          <Trash2Icon className="size-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
