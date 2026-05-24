"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export default function PromptInput({
  value,
  onChange,
  maxLength = 2000,
}: PromptInputProps) {
  const remaining = maxLength - value.length;
  const isNearLimit = remaining < 100;

  return (
    <div className="space-y-2">
      <Label htmlFor="prompt">
        Describe the image you want to generate
      </Label>
      <Textarea
        id="prompt"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Example: A cute orange cat sitting on a windowsill, looking at the sunset, photorealistic, warm lighting"
        className="min-h-[120px] resize-none"
        maxLength={maxLength}
      />
      <div className="flex justify-between items-center text-xs">
        <p className="text-muted-foreground">
          Be specific and descriptive for best results
        </p>
        <p
          className={
            isNearLimit ? "text-destructive font-medium" : "text-muted-foreground"
          }
        >
          {value.length} / {maxLength}
        </p>
      </div>
    </div>
  );
}
