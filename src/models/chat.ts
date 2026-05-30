import { and, desc, eq } from "drizzle-orm";
import type { UIMessage } from "ai";

import { db } from "@/db";
import { chatConversations } from "@/db/schema";

export type ChatConversationRow = typeof chatConversations.$inferSelect;

export async function listUserChatConversations(
  userUuid: string,
  limit = 100
): Promise<ChatConversationRow[]> {
  return db()
    .select()
    .from(chatConversations)
    .where(eq(chatConversations.user_uuid, userUuid))
    .orderBy(desc(chatConversations.updated_at))
    .limit(limit);
}

export async function getUserChatConversation(
  userUuid: string,
  uuid: string
): Promise<ChatConversationRow | undefined> {
  const [row] = await db()
    .select()
    .from(chatConversations)
    .where(
      and(
        eq(chatConversations.user_uuid, userUuid),
        eq(chatConversations.uuid, uuid)
      )
    )
    .limit(1);
  return row;
}

// Upsert conversation. On insert, derives title from first user message text if
// none provided. On update, preserves existing title (rename uses a separate path).
export async function upsertUserChatConversation(params: {
  uuid: string;
  userUuid: string;
  messages: UIMessage[];
  modelId?: string;
}): Promise<ChatConversationRow> {
  const { uuid, userUuid, messages, modelId } = params;
  const derivedTitle = deriveTitle(messages);
  const now = new Date();

  const [row] = await db()
    .insert(chatConversations)
    .values({
      uuid,
      user_uuid: userUuid,
      title: derivedTitle,
      model_id: modelId,
      messages: messages as unknown as ChatConversationRow["messages"],
      created_at: now,
      updated_at: now,
    })
    .onConflictDoUpdate({
      target: chatConversations.uuid,
      set: {
        messages: messages as unknown as ChatConversationRow["messages"],
        model_id: modelId,
        updated_at: now,
      },
    })
    .returning();

  return row;
}

export async function renameUserChatConversation(
  userUuid: string,
  uuid: string,
  title: string
): Promise<ChatConversationRow | undefined> {
  const [row] = await db()
    .update(chatConversations)
    .set({ title, updated_at: new Date() })
    .where(
      and(
        eq(chatConversations.user_uuid, userUuid),
        eq(chatConversations.uuid, uuid)
      )
    )
    .returning();
  return row;
}

export async function deleteUserChatConversation(
  userUuid: string,
  uuid: string
): Promise<boolean> {
  const rows = await db()
    .delete(chatConversations)
    .where(
      and(
        eq(chatConversations.user_uuid, userUuid),
        eq(chatConversations.uuid, uuid)
      )
    )
    .returning({ uuid: chatConversations.uuid });
  return rows.length > 0;
}

function deriveTitle(messages: UIMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "";
  const parts = (firstUser as { parts?: Array<{ type: string; text?: string }> })
    .parts;
  const text = Array.isArray(parts)
    ? parts
        .filter((p) => p.type === "text" && typeof p.text === "string")
        .map((p) => p.text as string)
        .join("")
        .trim()
    : "";
  if (!text) return "";
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}
