"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AnimatedBgProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "aurora" | "blob" | "particles" | "combined";
  intensity?: "subtle" | "normal" | "intense";
}

const AnimatedBg = React.forwardRef<HTMLDivElement, AnimatedBgProps>(
  ({ className, variant = "combined", intensity = "normal", ...props }, ref) => {
    const showAurora = variant === "aurora" || variant === "combined";
    const showBlobs = variant === "blob" || variant === "combined";
    const showParticles = variant === "particles" || variant === "combined";

    // Adjust opacity based on intensity
    const intensityOpacity = {
      subtle: "opacity-20",
      normal: "opacity-30",
      intense: "opacity-50",
    };

    // Particle count based on intensity
    const particleCount = {
      subtle: 15,
      normal: 30,
      intense: 50,
    };

    return (
      <div
        ref={ref}
        className={cn(
          "fixed inset-0 pointer-events-none z-0 overflow-hidden",
          className
        )}
        {...props}
      >
        {/* Aurora Effect - Rotating gradients */}
        {showAurora && (
          <>
            <div
              className={cn(
                "absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[120px] animate-blob mix-blend-screen",
                intensityOpacity[intensity]
              )}
            />
            <div
              className={cn(
                "absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-screen",
                intensityOpacity[intensity]
              )}
            />
            <div
              className={cn(
                "absolute bottom-[-10%] left-[20%] w-[60%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px] animate-blob animation-delay-4000 mix-blend-screen",
                intensityOpacity[intensity]
              )}
            />
          </>
        )}

        {/* Floating Blobs */}
        {showBlobs && (
          <>
            {/* Large Blob */}
            <div
              className={cn(
                "absolute top-[10%] right-[15%] w-96 h-96 rounded-full blur-[100px] animate-blob",
                "bg-gradient-to-br from-[var(--aurora-1)]/10 to-[var(--aurora-2)]/10",
                intensityOpacity[intensity]
              )}
              style={{ animationDuration: "12s" }}
            />

            {/* Medium Blob */}
            <div
              className={cn(
                "absolute bottom-[20%] left-[10%] w-72 h-72 rounded-full blur-[80px] animate-blob animation-delay-3000",
                "bg-gradient-to-tr from-[var(--aurora-2)]/10 to-[var(--aurora-3)]/10",
                intensityOpacity[intensity]
              )}
              style={{ animationDuration: "15s" }}
            />

            {/* Small Blob */}
            <div
              className={cn(
                "absolute top-[50%] left-[40%] w-48 h-48 rounded-full blur-[60px] animate-blob animation-delay-1000",
                "bg-gradient-to-bl from-[var(--aurora-3)]/10 to-[var(--aurora-1)]/10",
                intensityOpacity[intensity]
              )}
              style={{ animationDuration: "18s" }}
            />
          </>
        )}

        {/* Snow Particles */}
        {showParticles && (
          <div className="absolute inset-0" aria-hidden="true">
            {Array.from({ length: particleCount[intensity] }).map((_, i) => (
              <div
                key={i}
                className="absolute bg-white/20 rounded-full animate-snow"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-20px`,
                  width: `${Math.random() * 2 + 1}px`,
                  height: `${Math.random() * 2 + 1}px`,
                  animationDuration: `${Math.random() * 20 + 15}s`,
                  animationDelay: `${Math.random() * 10}s`,
                  opacity: Math.random() * 0.5 + 0.2,
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

AnimatedBg.displayName = "AnimatedBg";

export { AnimatedBg };
