"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface PremiumInputProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  maxLength?: number;
  showCounter?: boolean;
  autoResize?: boolean;
  variant?: "default" | "glass";
}

const PremiumInput = React.forwardRef<HTMLTextAreaElement, PremiumInputProps>(
  (
    {
      className,
      value = "",
      onChange,
      maxLength,
      showCounter = false,
      autoResize = true,
      variant = "glass",
      ...props
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const [internalValue, setInternalValue] = React.useState(value);

    // Combine refs
    React.useImperativeHandle(ref, () => textareaRef.current!);

    // Auto-resize functionality
    React.useEffect(() => {
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [internalValue, autoResize]);

    // Sync with external value
    React.useEffect(() => {
      setInternalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      onChange?.(newValue);
    };

    // Calculate counter color based on usage
    const getCounterColor = () => {
      if (!maxLength) return "text-muted-foreground";
      const percentage = (internalValue.length / maxLength) * 100;
      if (percentage >= 90) return "text-destructive";
      if (percentage >= 70) return "text-accent";
      return "text-muted-foreground";
    };

    const baseClasses =
      "w-full p-4 text-sm text-foreground placeholder-muted-foreground/50 resize-none leading-relaxed transition-all duration-300 outline-none";

    const variantClasses = {
      default: "bg-input border border-border rounded-lg focus:border-ring",
      glass:
        "bg-black/30 border border-white/10 rounded-xl focus:border-white/20 focus:bg-black/50 backdrop-blur-sm",
    };

    return (
      <div className="relative group/input w-full">
        {/* Glow effect on focus */}
        {variant === "glass" && (
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500 blur" />
        )}

        <textarea
          ref={textareaRef}
          value={internalValue}
          onChange={handleChange}
          maxLength={maxLength}
          className={cn(
            baseClasses,
            variantClasses[variant],
            showCounter && "pb-10",
            className
          )}
          {...props}
        />

        {/* Character counter */}
        {showCounter && maxLength && (
          <div
            className={cn(
              "absolute bottom-3 right-3 text-[10px] font-mono px-2 py-1 rounded border transition-colors",
              variant === "glass"
                ? "bg-black/50 border-white/5"
                : "bg-background border-border",
              getCounterColor()
            )}
          >
            {internalValue.length} / {maxLength}
          </div>
        )}

        {/* Model badge (optional, like in MVP) */}
        {props.placeholder && variant === "glass" && (
          <div className="absolute bottom-3 left-3 text-[10px] text-muted-foreground bg-black/50 px-2 py-1 rounded border border-white/5 pointer-events-none opacity-50">
            AIVIVE
          </div>
        )}
      </div>
    );
  }
);

PremiumInput.displayName = "PremiumInput";

export { PremiumInput };
