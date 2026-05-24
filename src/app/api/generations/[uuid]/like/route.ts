import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth/index";
import { db } from "@/db";
import { generations, generation_likes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/generations/[uuid]/like
 * Toggle like on a generation
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { uuid } = await params;

    // Check if generation exists and is public
    const [generation] = await db()
      .select()
      .from(generations)
      .where(eq(generations.uuid, uuid))
      .limit(1);

    if (!generation) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 }
      );
    }

    if (!generation.is_public) {
      return NextResponse.json(
        { error: "Cannot like private generations" },
        { status: 403 }
      );
    }

    // Check if user already liked this generation
    const [existingLike] = await db()
      .select()
      .from(generation_likes)
      .where(
        and(
          eq(generation_likes.generation_uuid, uuid),
          eq(generation_likes.user_uuid, session.user.uuid)
        )
      )
      .limit(1);

    if (existingLike) {
      // Unlike - remove the like
      await db()
        .delete(generation_likes)
        .where(
          and(
            eq(generation_likes.generation_uuid, uuid),
            eq(generation_likes.user_uuid, session.user.uuid)
          )
        );

      // Decrement like count
      await db()
        .update(generations)
        .set({
          like_count: generation.like_count - 1,
        })
        .where(eq(generations.uuid, uuid));

      return NextResponse.json({
        liked: false,
        likeCount: generation.like_count - 1,
      });
    } else {
      // Like - add the like
      await db().insert(generation_likes).values({
        generation_uuid: uuid,
        user_uuid: session.user.uuid,
      });

      // Increment like count
      await db()
        .update(generations)
        .set({
          like_count: generation.like_count + 1,
        })
        .where(eq(generations.uuid, uuid));

      return NextResponse.json({
        liked: true,
        likeCount: generation.like_count + 1,
      });
    }
  } catch (error) {
    console.error("Error in /api/generations/[uuid]/like:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generations/[uuid]/like
 * Check if user has liked this generation
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json({ liked: false });
    }

    const { uuid } = await params;

    // Check if user liked this generation
    const [existingLike] = await db()
      .select()
      .from(generation_likes)
      .where(
        and(
          eq(generation_likes.generation_uuid, uuid),
          eq(generation_likes.user_uuid, session.user.uuid)
        )
      )
      .limit(1);

    return NextResponse.json({ liked: !!existingLike });
  } catch (error) {
    console.error("Error in GET /api/generations/[uuid]/like:", error);

    return NextResponse.json({ liked: false });
  }
}
