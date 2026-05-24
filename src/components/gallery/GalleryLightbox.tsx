"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  X,
  Download,
  Heart,
  Copy,
  Eye,
  Calendar,
  Maximize2,
} from "lucide-react";
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

interface GalleryLightboxProps {
  generation: PublicGeneration | null;
  open: boolean;
  onClose: () => void;
}

export default function GalleryLightbox({
  generation,
  open,
  onClose,
}: GalleryLightboxProps) {
  const t = useTranslations("gallery");
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(generation?.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    if (generation) {
      setLikeCount(generation.likeCount);
      // Check if user has liked this generation
      checkLikeStatus();
    }
  }, [generation]);

  const checkLikeStatus = async () => {
    if (!generation) return;

    try {
      const response = await fetch(`/api/generations/${generation.uuid}/like`);
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
      }
    } catch (error) {
      // Ignore errors
    }
  };

  const handleLike = async () => {
    if (!generation) return;

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

      toast.success(data.liked ? t("liked") : t("unliked"));
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized") {
        toast.error(t("login_to_like"));
      } else {
        toast.error(t("like_failed"));
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleCopyPrompt = () => {
    if (!generation) return;
    navigator.clipboard.writeText(generation.prompt);
    toast.success(t("prompt_copied"));
  };

  const handleDownload = () => {
    if (!generation) return;
    window.open(`/api/generations/${generation.uuid}/download`, "_blank");
    toast.success(t("download_started"));
  };

  if (!generation) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <div className="grid md:grid-cols-[1fr,400px] h-full">
          {/* Image Section */}
          <div className="relative bg-black flex items-center justify-center p-4">
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={generation.imageUrl}
                alt={generation.prompt}
                width={generation.imageWidth}
                height={generation.imageHeight}
                className="object-contain max-h-[80vh]"
                priority
              />
            </div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Details Section */}
          <div className="flex flex-col bg-background">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-lg">{t("image_details")}</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 space-y-6">
              {/* Prompt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {t("prompt")}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyPrompt}
                    className="gap-1 h-7"
                  >
                    <Copy className="w-3 h-3" />
                    <span className="text-xs">{t("copy")}</span>
                  </Button>
                </div>
                <p className="text-sm leading-relaxed">{generation.prompt}</p>
              </div>

              {/* Metadata */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t("metadata")}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Maximize2 className="w-4 h-4 text-muted-foreground" />
                    <span>{generation.aspectRatio}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {new Date(generation.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Heart className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {likeCount} {t("likes")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {generation.viewCount} {t("views")}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  {t("dimensions")}: {generation.imageWidth} × {generation.imageHeight}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 pt-4 border-t space-y-2">
              <Button
                onClick={handleLike}
                disabled={isLiking}
                variant={isLiked ? "default" : "outline"}
                className="w-full gap-2"
              >
                <Heart
                  className={cn(
                    "w-4 h-4",
                    isLiked && "fill-current"
                  )}
                />
                {isLiked ? t("liked_button") : t("like_button")}
              </Button>

              <Button
                onClick={handleDownload}
                variant="outline"
                className="w-full gap-2"
              >
                <Download className="w-4 h-4" />
                {t("download")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
