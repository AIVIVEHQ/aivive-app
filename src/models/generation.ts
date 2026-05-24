import { generations, generation_likes } from "@/db/schema";
import { db } from "@/db";
import { desc, eq, and, sql, gte, lte, inArray, type SQL } from "drizzle-orm";
import type {
  Generation,
  GenerationFilters,
  AspectRatio,
  GenerationStatus,
} from "@/types/generation";

/**
 * Create a new generation record
 */
export async function createGeneration(
  data: typeof generations.$inferInsert
): Promise<typeof generations.$inferSelect> {
  const [generation] = await db().insert(generations).values(data).returning();

  return generation;
}

/**
 * Find generation by UUID
 */
export async function findGenerationByUuid(
  uuid: string
): Promise<typeof generations.$inferSelect | undefined> {
  const [generation] = await db()
    .select()
    .from(generations)
    .where(eq(generations.uuid, uuid))
    .limit(1);

  return generation;
}

/**
 * Update generation record
 */
export async function updateGeneration(
  uuid: string,
  data: Partial<typeof generations.$inferInsert>
): Promise<typeof generations.$inferSelect | undefined> {
  const [updated] = await db()
    .update(generations)
    .set(data)
    .where(eq(generations.uuid, uuid))
    .returning();

  return updated;
}

/**
 * Get user's generation history with pagination and filters
 */
export async function getUserGenerations(
  user_uuid: string,
  page: number = 1,
  limit: number = 20,
  filters?: GenerationFilters
): Promise<(typeof generations.$inferSelect)[]> {
  const offset = (page - 1) * limit;
  const conditions: SQL[] = [eq(generations.user_uuid, user_uuid)];

  // Apply filters
  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(generations.status, filters.status));
  }

  if (filters?.aspect_ratio) {
    conditions.push(eq(generations.aspect_ratio, filters.aspect_ratio));
  }

  if (filters?.date_from) {
    conditions.push(gte(generations.created_at, filters.date_from));
  }

  if (filters?.date_to) {
    conditions.push(lte(generations.created_at, filters.date_to));
  }

  return await db()
    .select()
    .from(generations)
    .where(and(...conditions))
    .orderBy(desc(generations.created_at))
    .limit(limit)
    .offset(offset);
}

/**
 * Count user's total generations
 */
export async function countUserGenerations(
  user_uuid: string,
  filters?: GenerationFilters
): Promise<number> {
  const conditions: SQL[] = [eq(generations.user_uuid, user_uuid)];

  // Apply same filters as getUserGenerations
  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(generations.status, filters.status));
  }

  if (filters?.aspect_ratio) {
    conditions.push(eq(generations.aspect_ratio, filters.aspect_ratio));
  }

  if (filters?.date_from) {
    conditions.push(gte(generations.created_at, filters.date_from));
  }

  if (filters?.date_to) {
    conditions.push(lte(generations.created_at, filters.date_to));
  }

  const [result] = await db()
    .select({ count: sql<number>`count(*)` })
    .from(generations)
    .where(and(...conditions));

  return Number(result.count);
}

/**
 * Get public gallery generations with pagination and filters
 */
export async function getPublicGenerations(
  page: number = 1,
  limit: number = 50,
  filters?: {
    category?: string;
    aspect_ratio?: AspectRatio;
    sort?: "recent" | "popular";
  }
): Promise<(typeof generations.$inferSelect)[]> {
  const offset = (page - 1) * limit;
  const conditions: SQL[] = [
    eq(generations.is_public, true),
    eq(generations.status, "success")
  ];

  // Apply filters
  if (filters?.aspect_ratio) {
    conditions.push(eq(generations.aspect_ratio, filters.aspect_ratio));
  }

  if (filters?.category) {
    // Match style_preset containing category keyword
    conditions.push(sql`${generations.style_preset} LIKE ${"%" + filters.category + "%"}`);
  }

  const orderByClauses: (SQL | any)[] = [];

  // Apply sorting
  if (filters?.sort === "popular") {
    orderByClauses.push(desc(generations.like_count));
    orderByClauses.push(desc(generations.created_at));
  } else {
    // Default: most recent
    orderByClauses.push(desc(generations.created_at));
  }

  return await db()
    .select()
    .from(generations)
    .where(and(...conditions))
    .orderBy(...orderByClauses)
    .limit(limit)
    .offset(offset);
}

/**
 * Count public gallery generations
 */
export async function countPublicGenerations(filters?: {
  category?: string;
  aspect_ratio?: AspectRatio;
}): Promise<number> {
  const conditions: SQL[] = [
    eq(generations.is_public, true),
    eq(generations.status, "success")
  ];

  if (filters?.aspect_ratio) {
    conditions.push(eq(generations.aspect_ratio, filters.aspect_ratio));
  }

  if (filters?.category) {
    conditions.push(sql`${generations.style_preset} LIKE ${"%" + filters.category + "%"}`);
  }

  const [result] = await db()
    .select({ count: sql<number>`count(*)` })
    .from(generations)
    .where(and(...conditions));

  return Number(result.count);
}

/**
 * Delete generation (soft or hard delete)
 */
export async function deleteGeneration(
  uuid: string,
  user_uuid: string
): Promise<boolean> {
  const result = await db()
    .delete(generations)
    .where(and(eq(generations.uuid, uuid), eq(generations.user_uuid, user_uuid)))
    .returning();

  return result.length > 0;
}

/**
 * Toggle generation visibility (public/private)
 */
export async function toggleGenerationVisibility(
  uuid: string,
  user_uuid: string,
  is_public: boolean
): Promise<typeof generations.$inferSelect | undefined> {
  const [updated] = await db()
    .update(generations)
    .set({ is_public })
    .where(and(eq(generations.uuid, uuid), eq(generations.user_uuid, user_uuid)))
    .returning();

  return updated;
}

/**
 * Increment view count
 */
export async function incrementViewCount(uuid: string): Promise<void> {
  await db()
    .update(generations)
    .set({ view_count: sql`${generations.view_count} + 1` })
    .where(eq(generations.uuid, uuid));
}

/**
 * Get user's pending or processing generations count (for concurrent limit)
 */
export async function countUserActiveGenerations(
  user_uuid: string
): Promise<number> {
  const [result] = await db()
    .select({ count: sql<number>`count(*)` })
    .from(generations)
    .where(
      and(
        eq(generations.user_uuid, user_uuid),
        inArray(generations.status, ["pending", "processing"])
      )
    );

  return Number(result.count);
}

/**
 * Get total generations count for analytics
 */
export async function getTotalGenerationsCount(): Promise<number> {
  return await db().$count(generations);
}

/**
 * Get generation statistics by status
 */
export async function getGenerationStatsByStatus(): Promise<
  { status: string; count: number }[]
> {
  const results = await db()
    .select({
      status: generations.status,
      count: sql<number>`count(*)`,
    })
    .from(generations)
    .groupBy(generations.status);

  return results.map((r) => ({
    status: r.status,
    count: Number(r.count),
  }));
}

// ============================================================================
// Generation Likes (Phase 2)
// ============================================================================

/**
 * Add like to generation
 */
export async function addGenerationLike(
  generation_uuid: string,
  user_uuid: string
): Promise<typeof generation_likes.$inferSelect | undefined> {
  try {
    const [like] = await db()
      .insert(generation_likes)
      .values({ generation_uuid, user_uuid })
      .returning();

    // Increment like count
    await db()
      .update(generations)
      .set({ like_count: sql`${generations.like_count} + 1` })
      .where(eq(generations.uuid, generation_uuid));

    return like;
  } catch (error) {
    // Unique constraint violation (already liked)
    return undefined;
  }
}

/**
 * Remove like from generation
 */
export async function removeGenerationLike(
  generation_uuid: string,
  user_uuid: string
): Promise<boolean> {
  const result = await db()
    .delete(generation_likes)
    .where(
      and(
        eq(generation_likes.generation_uuid, generation_uuid),
        eq(generation_likes.user_uuid, user_uuid)
      )
    )
    .returning();

  if (result.length > 0) {
    // Decrement like count
    await db()
      .update(generations)
      .set({ like_count: sql`${generations.like_count} - 1` })
      .where(eq(generations.uuid, generation_uuid));

    return true;
  }

  return false;
}

/**
 * Check if user has liked a generation
 */
export async function hasUserLikedGeneration(
  generation_uuid: string,
  user_uuid: string
): Promise<boolean> {
  const [like] = await db()
    .select()
    .from(generation_likes)
    .where(
      and(
        eq(generation_likes.generation_uuid, generation_uuid),
        eq(generation_likes.user_uuid, user_uuid)
      )
    )
    .limit(1);

  return !!like;
}

/**
 * Get user's liked generations
 */
export async function getUserLikedGenerations(
  user_uuid: string,
  page: number = 1,
  limit: number = 50
): Promise<(typeof generations.$inferSelect)[]> {
  const offset = (page - 1) * limit;

  const results = await db()
    .select()
    .from(generations)
    .innerJoin(
      generation_likes,
      eq(generations.uuid, generation_likes.generation_uuid)
    )
    .where(eq(generation_likes.user_uuid, user_uuid))
    .orderBy(desc(generation_likes.created_at))
    .limit(limit)
    .offset(offset);

  return results.map((r) => r.generations);
}