"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, Eye, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PublicGeneration {
  uuid: string;
  prompt: string;
  aspectRatio: string;
  thumbnailUrl: string;
  imageUrl: string;
  likeCount: number;
  viewCount: number;
  createdAt: string;
  imageWidth: number;
  imageHeight: number;
}

interface GalleryCardProps {
  generation: PublicGeneration;
  onImageClick: () => void;
  onPromptCopy?: () => void;
}

export default function GalleryCard({
  generation,
  onImageClick,
  onPromptCopy,
}: GalleryCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(generation.likeCount);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening lightbox

    try {
      setIsLiking(true);
      const response = await fetch(`/api/generations/${generation.uuid}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to like");
      }

      const data = await response.json();
      setIsLiked(data.liked);
      setLikeCount(data.likeCount);

      toast.success(data.liked ? "已点赞" : "已取消点赞");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "操作失败");
    } finally {
      setIsLiking(false);
    }
  };

  const handleCopyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(generation.prompt);
    toast.success("提示词已复制");
    onPromptCopy?.();
  };

  return (
    <div
      className="group relative rounded-lg border bg-card overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
      onClick={onImageClick}
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted">
        <Image
          src={generation.thumbnailUrl}
          alt={generation.prompt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
            {/* Prompt */}
            <p className="text-white text-sm line-clamp-2 font-medium">
              {generation.prompt}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Like Button */}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleLike}
                  disabled={isLiking}
                  className="gap-1 h-8"
                >
                  <Heart
                    className={cn(
                      "w-4 h-4",
                      isLiked && "fill-red-500 text-red-500"
                    )}
                  />
                  <span className="text-xs">{likeCount}</span>
                </Button>

                {/* View Count */}
                <div className="flex items-center gap-1 text-white/80 text-xs bg-black/40 px-2 py-1 rounded">
                  <Eye className="w-3 h-3" />
                  <span>{generation.viewCount}</span>
                </div>
              </div>

              {/* Copy Prompt */}
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCopyPrompt}
                className="gap-1 h-8"
              >
                <Copy className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">复制提示词</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{generation.aspectRatio}</span>
          <span>{new Date(generation.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
