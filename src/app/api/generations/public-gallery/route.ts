import { NextRequest, NextResponse } from "next/server";
import {
  getPublicGenerations,
  countPublicGenerations,
} from "@/models/generation";
import type { AspectRatio } from "@/types/generation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/generations/public-gallery
 * Get public generations for the gallery (Phase 2 feature)
 *
 * Query parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 50)
 * - aspectRatio?: "1:1" | "16:9" | "9:16" | "3:4"
 * - sort: "recent" | "popular" (default: "recent")
 *
 * Response:
 * {
 *   generations: Array<PublicGeneration>,
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     total: number,
 *     totalPages: number
 *   }
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "20"))
    );
    const aspectRatioFilter = searchParams.get("aspectRatio");
    const sort = searchParams.get("sort") || "recent";

    // Validate sort parameter
    if (!["recent", "popular"].includes(sort)) {
      return NextResponse.json(
        {
          error: 'Invalid sort parameter. Must be "recent" or "popular"',
          code: "INVALID_SORT",
        },
        { status: 400 }
      );
    }

    // Build filters
    const filters: {
      aspect_ratio?: AspectRatio;
      sort?: "recent" | "popular";
    } = {
      sort: sort as "recent" | "popular",
    };

    if (aspectRatioFilter) {
      const validAspectRatios: AspectRatio[] = ["1:1", "16:9", "9:16", "3:4"];
      if (validAspectRatios.includes(aspectRatioFilter as AspectRatio)) {
        filters.aspect_ratio = aspectRatioFilter as AspectRatio;
      } else {
        return NextResponse.json(
          {
            error: `Invalid aspect ratio. Must be one of: ${validAspectRatios.join(", ")}`,
            code: "INVALID_ASPECT_RATIO",
          },
          { status: 400 }
        );
      }
    }

    // Fetch public generations
    const generations = await getPublicGenerations(page, limit, filters);

    // Get total count for pagination
    const total = await countPublicGenerations({ aspect_ratio: filters.aspect_ratio });
    const totalPages = Math.ceil(total / limit);

    // Return response with sanitized data (don't expose user emails, etc.)
    return NextResponse.json({
      generations: generations.map((g) => ({
        uuid: g.uuid,
        prompt: g.prompt,
        aspectRatio: g.aspect_ratio,
        thumbnailUrl: g.thumbnail_url,
        imageUrl: g.image_url,
        likeCount: g.like_count,
        viewCount: g.view_count,
        createdAt: g.created_at,
        imageWidth: g.image_width,
        imageHeight: g.image_height,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error in /api/generations/public-gallery:", error);

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
