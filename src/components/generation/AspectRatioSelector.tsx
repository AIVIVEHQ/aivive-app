"use client";

import { ASPECT_RATIO_CONFIGS } from "@/lib/kling-config";
import type { AspectRatio } from "@/types/generation";
import { cn } from "@/lib/utils";

interface AspectRatioSelectorProps {
  value: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
  credits?: number;
}

export default function AspectRatioSelector({
  value,
  onChange,
}: AspectRatioSelectorProps) {
  const ratios: AspectRatio[] = ["1:1", "16:9", "9:16", "3:4"];

  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
        纵横比
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {ratios.map((ratio) => {
          const config = ASPECT_RATIO_CONFIGS[ratio];
          const isSelected = value === ratio;

          return (
            <button
              key={ratio}
              type="button"
              onClick={() => onChange(ratio)}
              className={cn(
                "relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 cursor-pointer",
                isSelected
                  ? "bg-white/10 border-white/20 shadow-[0_0_15px_rgba(239,68,68,0.3)] scale-105"
                  : "bg-black/20 border-white/10 hover:bg-black/30 hover:border-white/15 hover:scale-102"
              )}
            >
              <div className="mb-3 transition-transform duration-300 group-hover:scale-110">
                <div
                  className={cn(
                    "border-2 rounded transition-all duration-300",
                    isSelected
                      ? "border-primary shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                      : "border-white/40",
                    ratio === "1:1" && "w-12 h-12",
                    ratio === "16:9" && "w-16 h-9",
                    ratio === "9:16" && "w-9 h-16",
                    ratio === "3:4" && "w-12 h-16"
                  )}
                />
              </div>

              <div
                className={cn(
                  "text-sm font-semibold transition-colors",
                  isSelected ? "text-white" : "text-white/70"
                )}
              >
                {ratio}
              </div>

              <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                {config.width}×{config.height}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
