"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

interface GenerationResultProps {
  generationUuid: string;
  imageUrl: string;
  thumbnailUrl: string;
  prompt: string;
  onReset: () => void;
}

export default function GenerationResult({
  generationUuid,
  imageUrl,
  thumbnailUrl,
  prompt,
  onReset,
}: GenerationResultProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDownload = async () => {
    try {
      // Open download link in new tab
      window.open(`/api/generations/${generationUuid}/download`, "_blank");
      toast.success("Download started");
    } catch (error) {
      toast.error("Download failed");
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/generations/${generationUuid}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      toast.success("Image deleted");
      onReset();
    } catch (error) {
      toast.error("Delete failed");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Premium success header with glow */}
      <div className="flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-xl backdrop-blur-sm">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center animate-glow-pulse">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <span className="text-lg font-semibold text-white">Image generated successfully!</span>
      </div>

      {/* Premium image preview with glass border and glow */}
      <div className="relative group">
        {/* Glow effect on hover */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Image container */}
        <div className="relative aspect-square w-full max-w-2xl mx-auto rounded-xl overflow-hidden border-2 border-white/20 bg-black/40 backdrop-blur-sm shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          <Image
            src={imageUrl}
            alt={prompt}
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Premium prompt display */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm space-y-2">
        <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">Prompt</p>
        <p className="text-sm text-white/90 leading-relaxed">{prompt}</p>
      </div>

      {/* Premium action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleDownload}
          variant="premium"
          className="flex-1"
          size="lg"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Image
        </Button>

        <Button
          onClick={onReset}
          variant="premium-outline"
          className="flex-1"
          size="lg"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Another
        </Button>

        <Button
          onClick={handleDelete}
          variant="destructive"
          size="lg"
          disabled={isDeleting}
          className="backdrop-blur-sm"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </div>

      {/* Premium view history link */}
      <div className="text-center pt-4 border-t border-white/5">
        <a
          href="/my-history"
          className="inline-flex items-center gap-2 text-sm text-primary hover:text-accent transition-colors font-medium group"
        >
          <span>View all generations</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </a>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Image"
        description="Are you sure you want to delete this image? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
