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
      toast.success("下载已开始");
    } catch (error) {
      toast.error("下载失败");
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

      toast.success("图片已删除");
      onReset();
    } catch (error) {
      toast.error("删除失败");
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
        <span className="text-lg font-semibold text-white">图片生成成功！</span>
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
        <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">提示词</p>
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
          下载图片
        </Button>

        <Button
          onClick={onReset}
          variant="premium-outline"
          className="flex-1"
          size="lg"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          再生成一张
        </Button>

        <Button
          onClick={handleDelete}
          variant="destructive"
          size="lg"
          disabled={isDeleting}
          className="backdrop-blur-sm"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {isDeleting ? "删除中..." : "删除"}
        </Button>
      </div>

      {/* Premium view history link */}
      <div className="text-center pt-4 border-t border-white/5">
        <a
          href="/my-history"
          className="inline-flex items-center gap-2 text-sm text-primary hover:text-accent transition-colors font-medium group"
        >
          <span>查看所有生成记录</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </a>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="删除图片"
        description="确定要删除这张图片吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
      />
    </div>
  );
}
