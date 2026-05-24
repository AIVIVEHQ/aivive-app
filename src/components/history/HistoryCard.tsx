"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, Trash2, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import type { ClientGeneration } from "@/types/generation";
import { cn, downloadImageFromUrl } from "@/lib/utils"; // Import downloadImageFromUrl

interface HistoryCardProps {
  generation: ClientGeneration;
  onDelete: () => void;
}

export default function HistoryCard({ generation, onDelete }: HistoryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDownload = async () => {
    try {
      await downloadImageFromUrl(`/api/generations/${generation.uuid}/download`, `aivive-${generation.uuid}.png`);
      toast.success("Download started");
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/generations/${generation.uuid}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      toast.success("Generation deleted");
      onDelete();
    } catch (error) {
      toast.error("Failed to delete generation");
      setIsDeleting(false);
    }
  };

  const StatusIcon = {
    success: CheckCircle2,
    failed: XCircle,
    processing: Loader2,
    pending: Clock,
  }[generation.status] || Clock;

  const statusColor = {
    success: "text-blue-500",
    failed: "text-red-600",
    processing: "text-blue-600",
    pending: "text-yellow-600",
  }[generation.status] || "text-gray-600";

  return (
    <>
      <div className="group relative rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow">
        {/* Image preview */}
        <div className="relative aspect-square bg-muted">
          {generation.thumbnailUrl && generation.status === "success" ? (
            <Image
              src={generation.thumbnailUrl}
              alt={generation.prompt || "Generated image"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <StatusIcon
                className={cn(
                  "w-12 h-12",
                  statusColor,
                  generation.status === "processing" && "animate-spin"
                )}
              />
            </div>
          )}

          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {generation.status === "success" && (
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full w-8 h-8"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="destructive"
              className="rounded-full w-8 h-8"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          {/* Status badge */}
          <div className="flex items-center justify-between">
            <div className={cn("flex items-center gap-1 text-xs font-medium", statusColor)}>
              <StatusIcon className="w-3 h-3" />
              <span className="capitalize">{generation.status}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {generation.aspectRatio}
            </span>
          </div>

          {/* Prompt */}
          <p className="text-sm line-clamp-2 min-h-[2.5rem]">
            {generation.prompt}
          </p>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{generation.creditsUsed} credits</span>
            <span>
              {new Date(generation.createdAt!).toLocaleDateString()}
            </span>
          </div>

          {/* Error message */}
          {generation.status === "failed" && generation.errorMessage && (
            <p className="text-xs text-destructive line-clamp-1">
              {generation.errorMessage}
            </p>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Generation"
        description="Are you sure you want to delete this generation? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </>
  );
}
