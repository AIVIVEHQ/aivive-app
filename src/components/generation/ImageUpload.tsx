"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export interface ImageUploadProps {
  value?: string; // Base64 encoded image
  onChange?: (value: string | null) => void;
  maxSize?: number; // in MB
  maxDimension?: number; // max width/height in pixels
}

const ImageUpload = React.forwardRef<HTMLDivElement, ImageUploadProps>(
  (
    {
      value,
      onChange,
      maxSize = 5, // 5MB default
      maxDimension = 2048, // 2048px default
      ...props
    },
    ref
  ) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [isProcessing, setIsProcessing] = React.useState(false);

    const processImage = async (file: File) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("请上传图片文件");
        return;
      }

      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`图片大小不能超过 ${maxSize}MB`);
        return;
      }

      setIsProcessing(true);

      try {
        // Load image
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
          img.onload = () => {
            // Create canvas for compression
            const canvas = document.createElement("canvas");
            let { width, height } = img;

            // Resize if necessary
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = (height * maxDimension) / width;
                width = maxDimension;
              } else {
                width = (width * maxDimension) / height;
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;

            // Draw and compress
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);

            // Convert to base64
            const base64 = canvas.toDataURL("image/jpeg", 0.9);
            onChange?.(base64);
            setIsProcessing(false);
            toast.success("图片上传成功");
          };

          img.onerror = () => {
            toast.error("图片加载失败");
            setIsProcessing(false);
          };

          img.src = e.target?.result as string;
        };

        reader.onerror = () => {
          toast.error("文件读取失败");
          setIsProcessing(false);
        };

        reader.readAsDataURL(file);
      } catch (error) {
        toast.error("图片处理失败");
        setIsProcessing(false);
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processImage(file);
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        processImage(file);
      }
    };

    const handleRemove = () => {
      onChange?.(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const handleClick = () => {
      fileInputRef.current?.click();
    };

    return (
      <div ref={ref} className="space-y-3" {...props}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
            参考图片
          </label>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-white"
            >
              移除
            </Button>
          )}
        </div>

        {!value ? (
          /* Upload Zone */
          <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer group",
              isDragging
                ? "border-primary/50 bg-primary/5 scale-[1.02]"
                : "border-white/20 bg-black/20 hover:bg-black/30 hover:border-white/30",
              isProcessing && "pointer-events-none opacity-60"
            )}
          >
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
                  "bg-white/5 group-hover:bg-white/10 group-hover:scale-110",
                  isDragging && "bg-primary/20 scale-110"
                )}
              >
                {isProcessing ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Upload
                    className={cn(
                      "w-8 h-8 transition-colors",
                      isDragging ? "text-primary" : "text-white/60"
                    )}
                  />
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-white/90 mb-1">
                  {isProcessing ? (
                    "处理中..."
                  ) : (
                    <>
                      <span className="text-white">点击上传</span> 或拖拽图片到此处
                    </>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  支持 JPG, PNG 格式，最大 {maxSize}MB
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          /* Preview */
          <div className="relative rounded-xl overflow-hidden border border-white/20 bg-black/40 group">
            <img
              src={value}
              alt="上传的图片"
              className="w-full h-48 object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />

            {/* Overlay with remove button */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
              <Button
                type="button"
                onClick={handleRemove}
                variant="destructive"
                size="icon"
                className="rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Image info badge */}
            <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg border border-white/20">
              <div className="flex items-center gap-1.5 text-xs text-white/90">
                <ImageIcon className="w-3 h-3" />
                <span>参考图片</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ImageUpload.displayName = "ImageUpload";

export { ImageUpload };
