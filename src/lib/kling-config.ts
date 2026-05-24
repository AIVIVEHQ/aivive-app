import type { AspectRatio, AspectRatioConfig } from "@/types/generation";

/**
 * Kling AI Image Generation Configuration
 */
export const KLING_IMAGE_CONFIG = {
  model: "kling-v1" as const,
  maxPollingAttempts: 20,
  pollingIntervalMs: 3000,
  timeoutMs: 90000, // 90 seconds total timeout

  maxPromptLength: 2000,
  supportedFormats: ["png", "jpg", "webp"] as const,
  defaultFormat: "png" as const,
} as const;

/**
 * Aspect ratio configurations with pricing
 */
export const ASPECT_RATIO_CONFIGS: Record<AspectRatio, AspectRatioConfig> = {
  "1:1": {
    width: 1024,
    height: 1024,
    credits: 10,
    label: "正方形 (Square)",
  },
  "16:9": {
    width: 1920,
    height: 1080,
    credits: 15,
    label: "横版 (Landscape)",
  },
  "9:16": {
    width: 1080,
    height: 1920,
    credits: 15,
    label: "竖版 (Portrait)",
  },
  "3:4": {
    width: 1536,
    height: 2048,
    credits: 12,
    label: "竖版肖像 (Portrait)",
  },
} as const;

/**
 * Get aspect ratio config by ratio string
 */
export function getAspectRatioConfig(
  ratio: AspectRatio
): AspectRatioConfig | undefined {
  return ASPECT_RATIO_CONFIGS[ratio];
}

/**
 * Calculate aspect ratio string from width and height
 */
export function calculateAspectRatio(
  width: number,
  height: number
): AspectRatio {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const ratio = `${width / divisor}:${height / divisor}`;

  // Map to closest supported ratio
  if (ratio === "1:1") return "1:1";
  if (ratio === "16:9") return "16:9";
  if (ratio === "9:16") return "9:16";
  if (ratio === "3:4") return "3:4";

  // Default to 1:1
  return "1:1";
}

/**
 * Validate prompt
 */
export function validatePrompt(prompt: string): {
  valid: boolean;
  error?: string;
} {
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, error: "Prompt cannot be empty" };
  }

  if (prompt.length > KLING_IMAGE_CONFIG.maxPromptLength) {
    return {
      valid: false,
      error: `Prompt exceeds maximum length of ${KLING_IMAGE_CONFIG.maxPromptLength} characters`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize prompt (remove potential XSS, SQL injection attempts)
 */
export function sanitizePrompt(prompt: string): string {
  return prompt
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/<[^>]+>/g, "") // Remove HTML tags
    .substring(0, KLING_IMAGE_CONFIG.maxPromptLength);
}
