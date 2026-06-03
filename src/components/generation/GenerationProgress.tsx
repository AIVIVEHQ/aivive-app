"use client";

import { Sparkles } from "lucide-react";

interface GenerationProgressProps {
  generationUuid: string;
}

export default function GenerationProgress({
  generationUuid,
}: GenerationProgressProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8">
      {/* Premium animated loader with glow */}
      <div className="relative">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-glow-pulse" />

        {/* Spinning gradient ring */}
        <div className="relative w-24 h-24 rounded-full border-4 border-transparent bg-gradient-to-r from-primary via-accent to-primary bg-clip-border animate-spin" style={{ animationDuration: "2s" }}>
          <div className="absolute inset-1 bg-background rounded-full" />
        </div>

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary animate-glow-pulse" />
        </div>
      </div>

      {/* Premium progress text */}
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-serif font-semibold text-glow">Generating image...</h3>
        <p className="text-white/60 font-light">
          Usually takes 30-60 seconds
        </p>
      </div>

      {/* Premium progress stages */}
      <div className="w-full max-w-md space-y-3 px-6 py-5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
        <ProgressStage label="Understanding prompt" isActive />
        <ProgressStage label="Creating image" isPending />
        <ProgressStage label="Refining details" isPending />
      </div>

      {/* Generation UUID with premium styling */}
      <div className="px-4 py-2 bg-black/40 border border-white/5 rounded-lg">
        <p className="text-xs text-white/40 font-mono">
          ID: {generationUuid.slice(0, 8)}...
        </p>
      </div>
    </div>
  );
}

function ProgressStage({
  label,
  isActive = false,
  isPending = false,
}: {
  label: string;
  isActive?: boolean;
  isPending?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={`w-3 h-3 rounded-full transition-all duration-500 ${
          isActive
            ? "bg-primary shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-glow-pulse scale-125"
            : isPending
              ? "bg-white/20 scale-100"
              : "bg-primary shadow-[0_0_8px_rgba(239,68,68,0.4)]"
        }`}
      />
      <span
        className={`text-sm transition-all duration-300 ${
          isActive ? "text-white font-semibold" : "text-white/50 font-light"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
