import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { findGenerationByUuid } from "@/models/generation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/generations/status/[uuid]
 * Get the status of a generation request
 *
 * Response:
 * {
 *   uuid: string,
 *   status: "pending" | "processing" | "success" | "failed",
 *   imageUrl?: string,
 *   thumbnailUrl?: string,
 *   errorMessage?: string,
 *   creditsUsed: number,
 *   generationTimeMs?: number
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 404: Generation not found
 * - 403: Forbidden (not owner)
 * - 500: Server error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const userUuid = session.user.uuid;
    const { uuid: generationUuid } = await params;

    // 2. Validate UUID parameter
    if (!generationUuid) {
      return NextResponse.json(
        { error: "Generation UUID is required", code: "INVALID_UUID" },
        { status: 400 }
      );
    }

    // 3. Fetch generation record
    const generation = await findGenerationByUuid(generationUuid);

    if (!generation) {
      return NextResponse.json(
        { error: "Generation not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // 4. Check ownership (unless generation is public)
    if (generation.user_uuid !== userUuid && !generation.is_public) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // 5. Return generation status
    return NextResponse.json({
      uuid: generation.uuid,
      status: generation.status,
      prompt: generation.prompt,
      aspectRatio: generation.aspect_ratio,
      imageUrl: generation.image_url,
      thumbnailUrl: generation.thumbnail_url,
      errorMessage: generation.error_message,
      creditsUsed: generation.credits_used,
      generationTimeMs: generation.generation_time_ms,
      createdAt: generation.created_at,
      isPublic: generation.is_public,
      likeCount: generation.like_count,
      viewCount: generation.view_count,
    });
  } catch (error) {
    console.error("Error in /api/generations/status/[uuid]:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
