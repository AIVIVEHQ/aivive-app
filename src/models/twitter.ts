import { and, desc, eq, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { twitterAccounts, twitterPosts } from "@/db/schema";

export type TwitterPostStatus =
  | "draft"
  | "generating"
  | "ready"
  | "publishing"
  | "success"
  | "failed";

export async function upsertTwitterAccount(
  data: typeof twitterAccounts.$inferInsert
) {
  const [account] = await db()
    .insert(twitterAccounts)
    .values(data)
    .onConflictDoUpdate({
      target: twitterAccounts.user_uuid,
      set: {
        twitter_user_id: data.twitter_user_id,
        twitter_username: data.twitter_username,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type,
        scope: data.scope,
        expires_at: data.expires_at,
        status: data.status || "active",
        updated_at: new Date(),
      },
    })
    .returning();

  return account;
}

export async function findTwitterAccountByUserUuid(userUuid: string) {
  const [account] = await db()
    .select()
    .from(twitterAccounts)
    .where(eq(twitterAccounts.user_uuid, userUuid))
    .limit(1);

  return account;
}

export async function updateTwitterAccount(
  userUuid: string,
  data: Partial<typeof twitterAccounts.$inferInsert>
) {
  const [account] = await db()
    .update(twitterAccounts)
    .set({ ...data, updated_at: new Date() })
    .where(eq(twitterAccounts.user_uuid, userUuid))
    .returning();

  return account;
}

export async function createTwitterPost(data: typeof twitterPosts.$inferInsert) {
  const [post] = await db().insert(twitterPosts).values(data).returning();
  return post;
}

export async function findTwitterPostByUuid(uuid: string) {
  const [post] = await db()
    .select()
    .from(twitterPosts)
    .where(eq(twitterPosts.uuid, uuid))
    .limit(1);

  return post;
}

export async function findUserTwitterPost(userUuid: string, uuid: string) {
  const [post] = await db()
    .select()
    .from(twitterPosts)
    .where(and(eq(twitterPosts.user_uuid, userUuid), eq(twitterPosts.uuid, uuid)))
    .limit(1);

  return post;
}

export async function updateTwitterPost(
  uuid: string,
  data: Partial<typeof twitterPosts.$inferInsert>
) {
  const [post] = await db()
    .update(twitterPosts)
    .set({ ...data, updated_at: new Date() })
    .where(eq(twitterPosts.uuid, uuid))
    .returning();

  return post;
}

export async function listTwitterPosts(
  userUuid: string,
  page = 1,
  limit = 20,
  status?: TwitterPostStatus | "all"
) {
  const offset = (page - 1) * limit;
  const conditions: SQL[] = [eq(twitterPosts.user_uuid, userUuid)];

  if (status && status !== "all") {
    conditions.push(eq(twitterPosts.status, status));
  }

  return db()
    .select()
    .from(twitterPosts)
    .where(and(...conditions))
    .orderBy(desc(twitterPosts.created_at))
    .limit(limit)
    .offset(offset);
}

export async function countTwitterPosts(
  userUuid: string,
  status?: TwitterPostStatus | "all"
) {
  const conditions: SQL[] = [eq(twitterPosts.user_uuid, userUuid)];

  if (status && status !== "all") {
    conditions.push(eq(twitterPosts.status, status));
  }

  return db().$count(twitterPosts, and(...conditions));
}
