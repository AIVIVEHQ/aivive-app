import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  findGenerationByUuid,
  updateGeneration,
  deleteGeneration,
} from "@/models/generation";
import { toggleGenerationVisibility } from "@/services/generation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/generations/[uuid]
 * Get detailed information about a single generation
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const userUuid = session.user.uuid;
    const { uuid: generationUuid } = await params;

    const generation = await findGenerationByUuid(generationUuid);

    if (!generation) {
      return NextResponse.json(
        { error: "Generation not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Check ownership or public visibility
    if (generation.user_uuid !== userUuid && !generation.is_public) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      uuid: generation.uuid,
      userUuid: generation.user_uuid,
      prompt: generation.prompt,
      negativePrompt: generation.negative_prompt,
      aspectRatio: generation.aspect_ratio,
      size: generation.size,
      stylePreset: generation.style_preset,
      status: generation.status,
      imageUrl: generation.image_url,
      thumbnailUrl: generation.thumbnail_url,
      imageWidth: generation.image_width,
      imageHeight: generation.image_height,
      fileSize: generation.file_size,
      creditsUsed: generation.credits_used,
      isPublic: generation.is_public,
      likeCount: generation.like_count,
      viewCount: generation.view_count,
      generationTimeMs: generation.generation_time_ms,
      errorMessage: generation.error_message,
      createdAt: generation.created_at,
      klingTaskId: generation.kling_task_id,
    });
  } catch (error) {
    console.error("Error in GET /api/generations/[uuid]:", error);
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

/**
 * PATCH /api/generations/[uuid]
 * Update generation properties (currently only supports toggling public visibility)
 *
 * Request body:
 * {
 *   isPublic?: boolean
 * }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const userUuid = session.user.uuid;
    const { uuid: generationUuid } = await params;
    const body = await req.json();

    // Verify ownership
    const generation = await findGenerationByUuid(generationUuid);

    if (!generation) {
      return NextResponse.json(
        { error: "Generation not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (generation.user_uuid !== userUuid) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Only allow updating isPublic for now
    if (typeof body.isPublic === "boolean") {
      const result = await toggleGenerationVisibility(
        generationUuid,
        userUuid
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Update failed", code: "UPDATE_FAILED" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        isPublic: result.isPublic,
        message: "Visibility updated successfully",
      });
    }

    return NextResponse.json(
      {
        error: "No valid update fields provided",
        code: "INVALID_UPDATE",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in PATCH /api/generations/[uuid]:", error);
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

/**
 * DELETE /api/generations/[uuid]
 * Delete a generation (soft delete - marks as deleted)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const userUuid = session.user.uuid;
    const { uuid: generationUuid } = await params;

    // Verify ownership
    const generation = await findGenerationByUuid(generationUuid);

    if (!generation) {
      return NextResponse.json(
        { error: "Generation not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (generation.user_uuid !== userUuid) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Delete generation
    await deleteGeneration(generationUuid, userUuid);

    return NextResponse.json({
      success: true,
      message: "Generation deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/generations/[uuid]:", error);
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
