import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  validateGenerationRequest,
  processGeneration,
  checkRateLimit,
} from "@/services/generation";
import { getUserCreditBalance } from "@/services/credit";
import type { AspectRatio } from "@/types/generation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/generations/create
 * Create a new image generation request
 *
 * Request body:
 * {
 *   prompt: string (required, max 2000 chars)
 *   aspectRatio: "1:1" | "16:9" | "9:16" | "3:4" (required)
 *   stylePreset?: string (optional)
 *   negativePrompt?: string (optional, max 2000 chars)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   generationUuid: string,
 *   status: "pending" | "processing"
 * }
 *
 * Errors:
 * - 401: Unauthorized (not authenticated)
 * - 400: Bad request (invalid parameters)
 * - 429: Too many requests (rate limit exceeded)
 * - 402: Payment required (insufficient credits)
 * - 500: Server error
 */
export async function POST(req: NextRequest) {
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

    // 2. Parse and validate request body
    const body = await req.json();
    const {
      prompt,
      aspectRatio,
      stylePreset,
      negativePrompt,
    }: {
      prompt?: string;
      aspectRatio?: AspectRatio;
      stylePreset?: string;
      negativePrompt?: string;
    } = body;

    // Validate required fields
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        {
          error: "Prompt is required and must be a string",
          code: "INVALID_PROMPT",
        },
        { status: 400 }
      );
    }

    if (!aspectRatio) {
      return NextResponse.json(
        {
          error: "Aspect ratio is required",
          code: "INVALID_ASPECT_RATIO",
        },
        { status: 400 }
      );
    }

    // Validate prompt length
    if (prompt.length > 2000) {
      return NextResponse.json(
        {
          error: "Prompt must be at most 2000 characters",
          code: "PROMPT_TOO_LONG",
        },
        { status: 400 }
      );
    }

    // Validate negative prompt length
    if (negativePrompt && negativePrompt.length > 2000) {
      return NextResponse.json(
        {
          error: "Negative prompt must be at most 2000 characters",
          code: "NEGATIVE_PROMPT_TOO_LONG",
        },
        { status: 400 }
      );
    }

    // 3. Check rate limits
    const creditBalance = await getUserCreditBalance(userUuid);
    const rateLimitCheck = await checkRateLimit(userUuid, creditBalance);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: rateLimitCheck.reason || "Rate limit exceeded",
          code: "RATE_LIMIT_EXCEEDED",
        },
        { status: 429 }
      );
    }

    // 4. Validate generation request (prompt, credits, etc.)
    const validation = await validateGenerationRequest({
      userUuid,
      prompt,
      aspectRatio,
    });

    if (!validation.valid) {
      const status = validation.error?.includes("credits") ? 402 : 400;
      return NextResponse.json(
        {
          error: validation.error,
          code:
            status === 402 ? "INSUFFICIENT_CREDITS" : "VALIDATION_FAILED",
          requiredCredits: validation.credits,
        },
        { status }
      );
    }

    // 5. Process generation asynchronously
    // Note: In production, this should be enqueued to a background job queue (e.g., Bull)
    // For now, we'll process it directly but return immediately
    const { generationUuid, error } = await processGeneration({
      userUuid,
      prompt,
      aspectRatio,
      stylePreset,
      negativePrompt,
    });

    if (error) {
      return NextResponse.json(
        {
          error: error,
          code: "GENERATION_FAILED",
          generationUuid,
        },
        { status: 500 }
      );
    }

    // 6. Return success response
    return NextResponse.json(
      {
        success: true,
        generationUuid,
        status: "processing",
        message: "Generation started successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in /api/generations/create:", error);

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
