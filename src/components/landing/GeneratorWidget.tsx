"use client";

import { useState, useRef } from "react";
import {
  ChevronRightIcon,
  CheckIcon,
  Wand2,
  UploadIcon,
  TrashIcon,
  Image as ImageIcon,
  DownloadIcon,
  CopyIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/types";
import { useTranslations } from "next-intl";
import { useAppContext } from "@/contexts/app";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function GeneratorWidget() {
  const t = useTranslations("homepage.generator");
  const { user, setShowSignModal } = useAppContext();
  const router = useRouter();
  const [prompt, setPrompt] = useState('A cinematic wide shot of a futuristic Santa sleigh in Neo-Tokyo, cyberpunk style, neon lights, 8k resolution');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generationUuid, setGenerationUuid] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('text-to-image');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    // Check if user is logged in
    if (!user) {
      toast.error("Please sign in to generate images");
      setShowSignModal(true);
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setGenerationUuid(null);

    try {
      // Call API to create generation
      const response = await fetch("/api/generations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          // Insufficient credits
          toast.error(data.error || "Insufficient credits");
          // Redirect to pricing page after 2 seconds
          setTimeout(() => {
            router.push("/pricing");
          }, 2000);
          return;
        }
        throw new Error(data.error || "Generation failed");
      }

      // Start polling for status
      const uuid = data.generationUuid;
      setGenerationUuid(uuid);
      await pollGenerationStatus(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(errorMessage);
      setIsGenerating(false);
    }
  };

  const pollGenerationStatus = async (uuid: string) => {
    const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/generations/status/${uuid}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch status");
        }

        if (data.status === "success") {
          setGeneratedImage(data.imageUrl);
          setIsGenerating(false);
          toast.success("Image generated successfully!");
          return;
        }

        if (data.status === "failed") {
          throw new Error(data.errorMessage || "Generation failed");
        }

        // Continue polling if still processing
        if (
          (data.status === "pending" || data.status === "processing") &&
          attempts < maxAttempts
        ) {
          attempts++;
          setTimeout(poll, 2000); // Poll every 2 seconds
        } else if (attempts >= maxAttempts) {
          throw new Error("Generation timeout - please check status later");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast.error(errorMessage);
        setIsGenerating(false);
      }
    };

    poll();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage || !generationUuid) return;

    try {
      // Use the download API endpoint
      const response = await fetch(`/api/generations/${generationUuid}/download`);

      if (!response.ok) {
        throw new Error("Failed to download image");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aivive-${generationUuid}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Image downloaded successfully!");
    } catch (error) {
      console.error('Download failed:', error);
      toast.error("Failed to download image");
    }
  };

  const handleCopy = async () => {
    if (!generatedImage) return;
    try {
      setIsCopying(true);
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setTimeout(() => setIsCopying(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
      setIsCopying(false);
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto relative z-20 mt-16 group perspective-1000">
      {/* Ambient Glow behind widget — AIVIVE aurora */}
      <div
        className="absolute -inset-1 rounded-[2rem] opacity-25 blur-xl group-hover:opacity-40 transition-opacity duration-700"
        style={{ background: 'linear-gradient(120deg, oklch(0.902 0.152 174.5 / 0.6), oklch(0.87 0.13 85 / 0.4), oklch(0.753 0.155 41.6 / 0.6))' }}
      />

      <div className="relative bg-card border border-primary/15 rounded-[1.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[650px] backdrop-blur-xl">

        {/* Left Panel: Controls */}
        <div className="lg:w-[400px] border-r border-border flex flex-col bg-background/40">
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_oklch(0.902_0.152_174.5/0.6)]" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">AIVIVE v1.0</span>
            </div>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-white/20" />
              <div className="w-2 h-2 rounded-full bg-white/20" />
            </div>
          </div>

          {/* Controls Body */}
          <div className="p-6 flex-1 flex flex-col gap-6">

            {/* Mode Switcher with Smooth Sliding Background */}
            <div className="relative p-1 bg-black/40 rounded-lg flex select-none ring-1 ring-white/5">
              {/* Sliding Active Indicator */}
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-white/10 rounded-md shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  activeTab === 'text-to-image' ? 'left-1' : 'left-[calc(50%)]'
                }`}
              />

              <button
                onClick={() => setActiveTab('text-to-image')}
                className={`flex-1 relative z-10 py-2.5 text-xs font-medium transition-colors duration-500 flex items-center justify-center gap-2 ${
                  activeTab === 'text-to-image' ? 'text-white' : 'text-white/60 hover:text-white/90'
                }`}
              >
                <Wand2 className="w-3 h-3" />
                Text to Image
              </button>
              <button
                onClick={() => setActiveTab('img-to-img')}
                className={`flex-1 relative z-10 py-2.5 text-xs font-medium transition-colors duration-500 flex items-center justify-center gap-2 ${
                  activeTab === 'img-to-img' ? 'text-white' : 'text-white/60 hover:text-white/90'
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                Image to Image
              </button>
            </div>

            {/* Image Upload Area with Smooth Collapse Animation */}
            <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              activeTab === 'img-to-img'
                ? 'grid-rows-[1fr] opacity-100 mb-2'
                : 'grid-rows-[0fr] opacity-0 mb-0'
            }`}>
              <div className="overflow-hidden min-h-0 space-y-3">
                <div className="flex justify-between items-center pt-1">
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">{t("reference_image")}</label>
                </div>

                {!uploadedImage ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-white/10 hover:border-white/30 hover:bg-white/5 rounded-xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group/upload"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover/upload:scale-110 transition-transform duration-300">
                      <UploadIcon className="w-5 h-5 text-white/60 group-hover/upload:text-white transition-colors" />
                    </div>
                    <p className="text-xs text-white/60 text-center group-hover/upload:text-white/80 transition-colors">
                      <span className="text-white font-medium">{t("click_upload")}</span> {t("or_drag_file")}<br/>
                      <span className="opacity-50">{t("file_size_limit")}</span>
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-white/10 group/preview h-32 bg-black/50">
                    <img src={uploadedImage} alt="Reference" className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                      <button
                        onClick={() => setUploadedImage(null)}
                        className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-all hover:scale-110 shadow-lg"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Prompt Input */}
            <div className="space-y-3 group/input relative z-10">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">{t("prompt")}</label>
                <button
                  onClick={() => setPrompt('')}
                  className="text-[10px] text-white/60 hover:text-white transition-colors"
                >
                  {t("clear")}
                </button>
              </div>
              <div className="relative group/textarea">
                {/* Subtle Glow on Focus */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl opacity-0 group-focus-within/textarea:opacity-100 transition-opacity duration-500 blur" />

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="relative w-full h-32 bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 focus:bg-black/50 resize-none leading-relaxed transition-all duration-300"
                  placeholder={activeTab === 'img-to-img' ? t("placeholder_img2img") : t("placeholder_text2img")}
                />
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">{t("aspect_ratio")}</label>
              <div className="grid grid-cols-3 gap-2">
                {(['16:9', '1:1', '9:16'] as AspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all duration-300 flex items-center justify-center gap-2 ${
                      aspectRatio === ratio
                      ? 'bg-white/10 border-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.05)]'
                      : 'bg-transparent border-white/5 text-white/60 hover:border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <span className={`w-3 h-3 border border-current rounded-[1px] transition-all duration-300 ${
                      ratio === '1:1' ? 'aspect-square' : ratio === '16:9' ? 'aspect-video w-4' : 'aspect-[9/16] h-3.5'
                    }`} />
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1" />

            {/* Action Button */}
            <div className="pt-6 border-t border-white/5">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt}
                className={`
                  w-full py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-3 group/btn relative overflow-hidden
                  ${isGenerating || !prompt
                    ? 'bg-white/5 cursor-not-allowed text-white/40 border border-white/10'
                    : 'bg-white text-black hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'}
                `}
              >
                {isGenerating ? (
                   <span className="flex items-center gap-2">
                     <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                     {t("generating")}
                   </span>
                ) : (
                  <>
                    <span className="relative z-10 flex items-center gap-2">
                      {t("generate")} <Wand2 className="w-4 h-4" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                  </>
                )}
              </button>
              <div className="mt-3 flex justify-between items-center text-[10px] text-white/60 uppercase tracking-wider">
                <span>{t("estimated_time")}: 2.4s</span>
                <span>{t("cost")}: {activeTab === 'img-to-img' ? '5' : '4'} {t("credits")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Viewport */}
        <div className="lg:w-2/3 bg-black/60 relative flex items-center justify-center p-8 overflow-hidden">
          {/* Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />

          {!generatedImage && !isGenerating && (
            <div className="text-center space-y-6 max-w-sm relative z-10 animate-fade-up">
              <div className="w-24 h-24 bg-gradient-to-tr from-white/5 to-transparent rounded-2xl mx-auto flex items-center justify-center border border-white/10 backdrop-blur-sm">
                <span className="w-10 h-10 text-white/20 font-bold text-2xl">L</span>
              </div>
              <div>
                <h3 className="text-white font-serif text-2xl mb-2">{t("canvas_empty")}</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {t("canvas_description")}
                </p>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center">
                  <div className="w-16 h-16 border-t-2 border-white rounded-full animate-spin" />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-mono text-white animate-pulse">
                  AI
                </div>
              </div>
            </div>
          )}

          {generatedImage && (
             <div className="relative z-10 w-full h-full flex items-center justify-center group/image">
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-500 group-hover/image:scale-[1.01]"
                />

                {/* Floating Actions */}
                <div className="absolute bottom-8 flex gap-2 opacity-0 group-hover/image:opacity-100 transition-all duration-300 translate-y-4 group-hover/image:translate-y-0">
                  <button
                    onClick={handleDownload}
                    className="h-10 px-4 bg-black/80 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-medium hover:bg-white hover:text-black transition-colors flex items-center gap-2"
                  >
                    <DownloadIcon className="w-4 h-4" /> {t("download")}
                  </button>
                  <button
                    onClick={handleCopy}
                    className="h-10 w-10 bg-black/80 backdrop-blur-md border border-white/20 rounded-full text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors"
                  >
                     {isCopying ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => router.push('/my-history')}
                    className="h-10 px-4 bg-black/80 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-medium hover:bg-white hover:text-black transition-colors flex items-center gap-2"
                  >
                    {t("view_history") || "History"}
                  </button>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}