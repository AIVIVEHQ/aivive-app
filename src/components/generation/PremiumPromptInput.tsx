"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export interface PremiumPromptInputProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  maxLength?: number;
  minHeight?: number;
  showExamples?: boolean;
  examplePrompts?: string[];
  onExampleClick?: (prompt: string) => void;
}

const PremiumPromptInput = React.forwardRef<
  HTMLTextAreaElement,
  PremiumPromptInputProps
>(
  (
    {
      className,
      value = "",
      onChange,
      maxLength = 1000,
      minHeight = 120,
      showExamples = false,
      examplePrompts = [],
      onExampleClick,
      placeholder = "Describe the image you want to generate...",
      ...props
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const [internalValue, setInternalValue] = React.useState(value);
    const [isFocused, setIsFocused] = React.useState(false);

    // Combine refs
    React.useImperativeHandle(ref, () => textareaRef.current!);

    // Auto-resize functionality
    React.useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        const newHeight = Math.max(
          minHeight,
          textareaRef.current.scrollHeight
        );
        textareaRef.current.style.height = `${newHeight}px`;
      }
    }, [internalValue, minHeight]);

    // Sync with external value
    React.useEffect(() => {
      setInternalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      onChange?.(newValue);
    };

    const handleExampleClick = (prompt: string) => {
      setInternalValue(prompt);
      onChange?.(prompt);
      onExampleClick?.(prompt);
    };

    const handleClear = () => {
      setInternalValue("");
      onChange?.("");
      textareaRef.current?.focus();
    };

    // Calculate counter color based on usage
    const getCounterColor = () => {
      const percentage = (internalValue.length / maxLength) * 100;
      if (percentage >= 90) return "text-destructive";
      if (percentage >= 70) return "text-accent";
      return "text-muted-foreground";
    };

    return (
      <div className="space-y-4">
        {/* Label and Clear Button */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
            Prompt
          </label>
          {internalValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-white"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Input Container */}
        <div className="relative group/textarea">
          {/* Glow effect on focus */}
          <div
            className={cn(
              "absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl opacity-0 transition-opacity duration-500 blur",
              isFocused && "opacity-100"
            )}
          />

          <textarea
            ref={textareaRef}
            value={internalValue}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={maxLength}
            placeholder={placeholder}
            className={cn(
              "relative w-full p-4 text-sm text-white placeholder-white/30 bg-black/30 border border-white/10 rounded-xl resize-none leading-relaxed transition-all duration-300 outline-none",
              "focus:border-white/20 focus:bg-black/50",
              className
            )}
            style={{ minHeight: `${minHeight}px` }}
            {...props}
          />

          {/* Character Counter */}
          <div
            className={cn(
              "absolute bottom-3 right-3 text-[10px] font-mono px-2 py-1 rounded border bg-black/50 border-white/5 transition-colors",
              getCounterColor()
            )}
          >
            {internalValue.length} / {maxLength}
          </div>
        </div>

        {/* Example Prompts */}
        {showExamples && examplePrompts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/60 uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Example Prompts</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleExampleClick(prompt)}
                  className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 text-white/80 hover:text-white"
                >
                  {prompt.substring(0, 30)}
                  {prompt.length > 30 ? "..." : ""}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

PremiumPromptInput.displayName = "PremiumPromptInput";

export { PremiumPromptInput };
