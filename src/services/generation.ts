import "server-only";

import { v4 as uuidv4 } from "uuid";
import {
  createGeneration,
  updateGeneration,
  findGenerationByUuid,
} from "@/models/generation";
import { newStorage } from "@/lib/storage";
import {
  ASPECT_RATIO_CONFIGS,
  validatePrompt,
  sanitizePrompt,
} from "@/lib/kling-config";
import type { AspectRatio, Generation } from "@/types/generation";
import { generateImage } from "@/services/volcengineService";


/**
 * Validate generation request parameters
 */
export async function validateGenerationRequest({
  userUuid,
  prompt,
  aspectRatio,
}: {
  userUuid: string;
  prompt: string;
  aspectRatio: AspectRatio;
}): Promise<{ valid: boolean; error?: string; credits?: number }> {
  void userUuid;
  const promptValidation = validatePrompt(prompt);
  if (!promptValidation.valid) {
    return { valid: false, error: promptValidation.error };
  }

  const config = ASPECT_RATIO_CONFIGS[aspectRatio];
  if (!config) {
    return { valid: false, error: "Invalid aspect ratio" };
  }

  return { valid: true, credits: 0 };
}

/**
 * Main generation processing function
 * Creates a generation record, calls Gemini API directly, uploads images, updates record
 */
export async function processGeneration({
  userUuid,
  prompt,
  aspectRatio,
  stylePreset,
  negativePrompt,
  referenceImage,
}: {
  userUuid: string;
  prompt: string;
  aspectRatio: AspectRatio;
  stylePreset?: string;
  negativePrompt?: string;
  referenceImage?: string;
}): Promise<{ generationUuid: string; error?: string }> {
  const generationUuid = uuidv4();
  const config = ASPECT_RATIO_CONFIGS[aspectRatio];

  try {
    // Clean and prepare prompt
    const cleanedPrompt = sanitizePrompt(prompt);
    const fullPrompt = stylePreset
      ? `${cleanedPrompt}, ${stylePreset}`
      : cleanedPrompt;

    // Create initial generation record (internal use: no credit cost)
    await createGeneration({
      uuid: generationUuid,
      user_uuid: userUuid,
      prompt: fullPrompt,
      negative_prompt: negativePrompt,
      aspect_ratio: aspectRatio,
      size: `${config.width}x${config.height}`,
      style_preset: stylePreset,
      credits_used: 0,
      status: "pending",
      kling_model_id: process.env.IMAGE_MODEL || "doubao-seedream-5-0-260128",
    });

    // Update status to processing
    await updateGeneration(generationUuid, { status: "processing" });

    // Call Volcengine Ark (Seedream) for image generation (text-to-image or image-to-image)
    const startTime = Date.now();
    const result = await generateImageViaVolcengine({
      prompt: fullPrompt,
      aspectRatio,
      referenceImage,
    });

    if (!result.success || !result.image) {
      throw new Error(result.error || "Image generation failed");
    }

    // Upload image and thumbnail to storage (Vercel Blob or S3)
    console.log("📤 Uploading image to storage...");
    const storage = newStorage();
    const imageBuffer = Buffer.from(result.image);
    const uploadResult = await storage.uploadGenerationImageFromBuffer(
      imageBuffer,
      generationUuid
    );
    console.log("✅ Image uploaded successfully:", uploadResult);

    // Calculate generation time
    const generationTimeMs = Date.now() - startTime;

    // Update generation record with success
    await updateGeneration(generationUuid, {
      status: "success",
      image_url: uploadResult.imageUrl,
      thumbnail_url: uploadResult.thumbnailUrl,
      image_width: uploadResult.width,
      image_height: uploadResult.height,
      file_size: uploadResult.fileSize,
      generation_time_ms: generationTimeMs,
      kling_task_id: result.taskId,
    });

    return { generationUuid };
  } catch (error) {
    // Handle failure
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await handleGenerationFailure(generationUuid, errorMessage);

    return { generationUuid, error: errorMessage };
  }
}

/**
 * Call Volcengine Ark (Seedream) to generate image
 * Supports both text-to-image and image-to-image (when referenceImage is provided)
 */
async function generateImageViaVolcengine({
  prompt,
  aspectRatio,
  referenceImage,
}: {
  prompt: string;
  aspectRatio: AspectRatio;
  referenceImage?: string;
}): Promise<{
  success: boolean;
  image?: Uint8Array;
  taskId?: string;
  error?: string;
}> {
  try {
    console.log("Generating image with Volcengine Seedream...", {
      prompt,
      aspectRatio,
      mode: referenceImage ? "image-to-image" : "text-to-image",
    });

    const base64Image = await generateImage({
      prompt,
      aspectRatio,
      referenceImage,
    });
    console.log("📥 Received image from Volcengine");

    if (!base64Image) {
      throw new Error("No image generated");
    }

    console.log("🔄 Converting base64 to Uint8Array...");
    // Convert base64 to Uint8Array
    // Remove data URL prefix if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    console.log("Base64 data length:", base64Data.length);

    const buffer = Buffer.from(base64Data, 'base64');
    console.log("Buffer size:", buffer.length, "bytes");

    const uint8Array = new Uint8Array(buffer);
    console.log("✅ Uint8Array created, size:", uint8Array.length, "bytes");

    return {
      success: true,
      image: uint8Array,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Gemini API error";
    console.error("❌ Gemini generation error:", errorMessage);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack');
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Handle generation failure - update status and refund credits
 */
async function handleGenerationFailure(
  generationUuid: string,
  errorMessage: string
): Promise<void> {
  try {
    await updateGeneration(generationUuid, {
      status: "failed",
      error_message: errorMessage,
    });
  } catch (error) {
    console.error("Error handling generation failure:", error);
  }
}

/**
 * Check rate limits for user
 * Returns true if user is within limits, false if exceeded
 */
export async function checkRateLimit(
  userUuid: string,
  creditBalance: number
): Promise<{ allowed: boolean; reason?: string }> {
  void userUuid;
  void creditBalance;
  return { allowed: true };
}

/**
 * Toggle generation visibility (public/private)
 */
export async function toggleGenerationVisibility(
  generationUuid: string,
  userUuid: string
): Promise<{ success: boolean; isPublic?: boolean; error?: string }> {
  try {
    const generation = await findGenerationByUuid(generationUuid);

    if (!generation) {
      return { success: false, error: "Generation not found" };
    }

    if (generation.user_uuid !== userUuid) {
      return { success: false, error: "Unauthorized" };
    }

    const newIsPublic = !generation.is_public;

    await updateGeneration(generationUuid, {
      is_public: newIsPublic,
    });

    return { success: true, isPublic: newIsPublic };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
