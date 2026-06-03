"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PremiumPromptInput } from "./PremiumPromptInput";
import { ImageUpload } from "./ImageUpload";
import AspectRatioSelector from "./AspectRatioSelector";
import CreditBalance from "./CreditBalance";
import GenerationProgress from "./GenerationProgress";
import GenerationResult from "./GenerationResult";
import { Button } from "@/components/ui/button";
import { Wand2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { AspectRatio } from "@/types/generation";

interface GenerationFormProps {
  initialCredits?: number;
  initialPrompt?: string;
}

interface GenerationState {
  status: "idle" | "submitting" | "processing" | "success" | "error";
  generationUuid?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

export default function GenerationForm({
  initialPrompt = "",
}: GenerationFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"text-to-image" | "image-to-image">("text-to-image");
  const [prompt, setPrompt] = useState(initialPrompt);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [generation, setGeneration] = useState<GenerationState>({
    status: "idle",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    try {
      setGeneration({ status: "submitting" });

      // Call API to create generation
      const response = await fetch("/api/generations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          referenceImage:
            mode === "image-to-image" ? referenceImage || undefined : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      // Start polling for status
      setGeneration({
        status: "processing",
        generationUuid: data.generationUuid,
      });

      pollGenerationStatus(data.generationUuid);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setGeneration({ status: "error", error: errorMessage });
      toast.error(errorMessage);
    }
  };

  const pollGenerationStatus = async (uuid: string) => {
    const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/generations/status/${uuid}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch status");
        }

        if (data.status === "success") {
          setGeneration({
            status: "success",
            generationUuid: uuid,
            imageUrl: data.imageUrl,
            thumbnailUrl: data.thumbnailUrl,
          });
          toast.success("Image generated successfully!");
          return;
        }

        if (data.status === "failed") {
          throw new Error(data.errorMessage || "Generation failed");
        }

        // Continue polling if still processing
        if (
          (data.status === "pending" || data.status === "processing") &&
          attempts < maxAttempts
        ) {
          attempts++;
          setTimeout(poll, 2000); // Poll every 2 seconds
        } else if (attempts >= maxAttempts) {
          throw new Error("Generation timeout - please check status later");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setGeneration({ status: "error", error: errorMessage });
        toast.error(errorMessage);
      }
    };

    poll();
  };

  const handleReset = () => {
    setGeneration({ status: "idle" });
    setPrompt("");
    router.refresh(); // Refresh to update credits
  };

  const isProcessing =
    generation.status === "submitting" || generation.status === "processing";

  return (
    <div className="space-y-8">
      {/* Show form when idle or submitting */}
      {(generation.status === "idle" || generation.status === "submitting") && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Premium Mode Switcher (Segmented Control) */}
          <div className="relative p-1 bg-black/40 rounded-lg flex select-none ring-1 ring-white/5">
            {/* Sliding Active Indicator */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-white/10 rounded-md shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                mode === "text-to-image" ? "left-1" : "left-[calc(50%)]"
              }`}
            />

            <button
              type="button"
              onClick={() => setMode("text-to-image")}
              className={`flex-1 relative z-10 py-3 text-sm font-medium transition-colors duration-500 flex items-center justify-center gap-2 ${
                mode === "text-to-image" ? "text-white" : "text-white/50 hover:text-white/70"
              }`}
            >
              <Wand2 className="w-4 h-4" />
              Text to Image
            </button>
            <button
              type="button"
              onClick={() => setMode("image-to-image")}
              className={`flex-1 relative z-10 py-3 text-sm font-medium transition-colors duration-500 flex items-center justify-center gap-2 ${
                mode === "image-to-image" ? "text-white" : "text-white/50 hover:text-white/70"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Image to Image
            </button>
          </div>

          {/* Image Upload (only show in image-to-image mode) */}
          <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            mode === "image-to-image"
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}>
            <div className="overflow-hidden min-h-0">
              <ImageUpload value={referenceImage || undefined} onChange={setReferenceImage} />
            </div>
          </div>

          {/* Premium Prompt Input */}
          <PremiumPromptInput
            value={prompt}
            onChange={setPrompt}
            placeholder={
              mode === "image-to-image"
                ? "Describe the changes you want to make to the reference image..."
                : "Describe the image you want to generate..."
            }
            maxLength={1000}
          />

          {/* Aspect Ratio Selector */}
          <AspectRatioSelector
            value={aspectRatio}
            onChange={setAspectRatio}
          />

          {/* Premium Submit Button */}
          <div className="pt-4 border-t border-white/5">
            <Button
              type="submit"
              variant="premium"
              size="lg"
              className="w-full font-bold text-base tracking-wide shadow-lg"
              disabled={!prompt.trim() || generation.status === "submitting" || (mode === "image-to-image" && !referenceImage)}
            >
              {generation.status === "submitting" ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Generating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Generate Image <Wand2 className="w-4 h-4" />
                </span>
              )}
            </Button>
            <div className="mt-3 flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-wider px-1">
              <span>Estimated time: ~30s</span>
            </div>
          </div>
        </form>
      )}

      {/* Processing State */}
      {generation.status === "processing" && (
        <GenerationProgress generationUuid={generation.generationUuid!} />
      )}

      {/* Success State */}
      {generation.status === "success" && (
        <GenerationResult
          generationUuid={generation.generationUuid!}
          imageUrl={generation.imageUrl!}
          thumbnailUrl={generation.thumbnailUrl!}
          prompt={prompt}
          onReset={handleReset}
        />
      )}

      {/* Premium Error State */}
      {generation.status === "error" && (
        <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 backdrop-blur-sm p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
              <span className="text-destructive text-lg">⚠</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive mb-1">Generation Failed</p>
              <p className="text-sm text-destructive/80">{generation.error}</p>
            </div>
          </div>
          <Button
            onClick={handleReset}
            variant="premium-outline"
            size="lg"
            className="w-full"
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
