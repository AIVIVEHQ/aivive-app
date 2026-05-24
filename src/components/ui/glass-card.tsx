import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const glassCardVariants = cva(
  "relative rounded-2xl transition-all duration-500",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)]",
        elevated:
          "bg-[var(--glass-bg)] backdrop-blur-2xl border border-[var(--glass-border)] shadow-xl",
        interactive:
          "bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] cursor-pointer hover:scale-[1.02] hover:border-white/20 active:scale-[0.98]",
      },
      glowColor: {
        none: "",
        red: "shadow-[0_0_30px_rgba(239,68,68,0.2)] hover:shadow-[0_0_50px_rgba(239,68,68,0.4)]",
        gold: "shadow-[0_0_30px_rgba(251,191,36,0.2)] hover:shadow-[0_0_50px_rgba(251,191,36,0.4)]",
        purple:
          "shadow-[0_0_30px_rgba(139,92,246,0.2)] hover:shadow-[0_0_50px_rgba(139,92,246,0.4)]",
      },
    },
    defaultVariants: {
      variant: "default",
      glowColor: "none",
    },
  }
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  withAurora?: boolean;
  children?: React.ReactNode;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant,
      glowColor,
      withAurora = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(glassCardVariants({ variant, glowColor }), className)}
        {...props}
      >
        {/* Aurora Background Layer */}
        {withAurora && (
          <div className="absolute inset-0 -z-10 opacity-30 blur-3xl rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[var(--aurora-1)] via-[var(--aurora-2)] to-[var(--aurora-3)] animate-aurora-rotate" />
          </div>
        )}

        {/* Subtle Inner Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard, glassCardVariants };
