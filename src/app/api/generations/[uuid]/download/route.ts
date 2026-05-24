import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { findGenerationByUuid } from "@/models/generation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/generations/[uuid]/download
 * Download generated image (redirects to storage URL)
 *
 * This endpoint provides a controlled download mechanism that:
 * 1. Verifies user has access to the image
 * 2. Redirects to the storage URL (or signed URL if needed)
 * 3. Can track download counts (optional)
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

    // Fetch generation
    const generation = await findGenerationByUuid(generationUuid);

    if (!generation) {
      return NextResponse.json(
        { error: "Generation not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Check access permission
    if (generation.user_uuid !== userUuid && !generation.is_public) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Check if image is available
    if (!generation.image_url || generation.status !== "success") {
      return NextResponse.json(
        {
          error: "Image not available",
          code: "IMAGE_NOT_AVAILABLE",
          status: generation.status,
        },
        { status: 404 }
      );
    }

    // In a production environment, you might want to:
    // 1. Generate a signed URL with expiration
    // 2. Track download counts
    // 3. Apply rate limiting
    //
    // For now, we'll redirect directly to the image URL
    // If using Cloudflare R2 or similar, the URL is already accessible

    // Optional: Track download (uncomment if needed)
    // await incrementDownloadCount(generationUuid);

    // Redirect to image URL with attachment disposition
    const imageUrl = new URL(generation.image_url);
    const searchParams = new URLSearchParams(req.nextUrl.searchParams);

    // Add download filename
    const filename = `generation-${generationUuid}.jpg`;
    searchParams.set("response-content-disposition", `attachment; filename="${filename}"`);

    imageUrl.search = searchParams.toString();

    return NextResponse.redirect(imageUrl.toString(), 302);
  } catch (error) {
    console.error("Error in GET /api/generations/[uuid]/download:", error);
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
