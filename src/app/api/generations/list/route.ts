import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getUserGenerations,
  countUserGenerations,
} from "@/models/generation";
import type { GenerationStatus } from "@/types/generation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/generations/list
 * Get user's generation history with pagination and filtering
 *
 * Query parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - status: "all" | "pending" | "processing" | "success" | "failed" (default: "all")
 *
 * Response:
 * {
 *   generations: Array<Generation>,
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     total: number,
 *     totalPages: number
 *   }
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 400: Bad request (invalid parameters)
 * - 500: Server error
 */
export async function GET(req: NextRequest) {
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

    // 2. Parse query parameters
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20"))
    );
    const statusFilter = searchParams.get("status") || "all";

    // 3. Validate status filter
    const validStatuses: Array<GenerationStatus | "all"> = [
      "all",
      "pending",
      "processing",
      "success",
      "failed",
    ];

    if (!validStatuses.includes(statusFilter as any)) {
      return NextResponse.json(
        {
          error: `Invalid status filter. Must be one of: ${validStatuses.join(", ")}`,
          code: "INVALID_STATUS_FILTER",
        },
        { status: 400 }
      );
    }

    // 4. Build filters
    const filters: {
      status?: GenerationStatus;
    } = {};

    if (statusFilter !== "all") {
      filters.status = statusFilter as GenerationStatus;
    }

    // 5. Fetch generations
    const generations = await getUserGenerations(userUuid, page, limit, filters);

    // 6. Get total count for pagination
    const total = await countUserGenerations(userUuid, filters);
    const totalPages = Math.ceil(total / limit);

    // 7. Return response
    return NextResponse.json({
      generations: generations.map((g) => ({
        uuid: g.uuid,
        prompt: g.prompt,
        aspectRatio: g.aspect_ratio,
        status: g.status,
        imageUrl: g.image_url,
        thumbnailUrl: g.thumbnail_url,
        creditsUsed: g.credits_used,
        createdAt: g.created_at,
        generationTimeMs: g.generation_time_ms,
        isPublic: g.is_public,
        likeCount: g.like_count,
        errorMessage: g.error_message,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error in /api/generations/list:", error);

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
