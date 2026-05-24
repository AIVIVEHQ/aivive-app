"use client";

import { useState, useEffect, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedBg } from "@/components/ui/animated-bg";
import { Sparkles, Coins, Copy, Wallet } from "lucide-react";
import { toast } from "sonner";
import SignToggle from "@/components/sign/toggle";

// Dynamically import GenerationForm for code splitting
const GenerationForm = dynamic(
  () => import("@/components/generation/GenerationForm"),
  {
    loading: () => <GenerationFormSkeleton />,
    ssr: false
  }
);

// Skeleton component for loading state
function GenerationFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4"></div>
      <div className="h-20 bg-muted rounded"></div>
      <div className="h-4 bg-muted rounded w-1/2"></div>
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-muted rounded"></div>
        ))}
      </div>
      <div className="h-12 bg-muted rounded"></div>
    </div>
  );
}

interface HomepageGenerationClientProps {
  isAuthenticated: boolean;
  creditBalance: number;
  hasCreditError?: boolean;
}

export default function HomepageGenerationClient({
  isAuthenticated,
  creditBalance,
  hasCreditError = false,
}: HomepageGenerationClientProps) {
  const t = useTranslations("homepage.generation");
  const router = useRouter();
  const [showSignIn, setShowSignIn] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");

  // Load saved prompt from localStorage on component mount
  useEffect(() => {
    const savedPrompt = localStorage.getItem("homepage-generation-prompt");
    if (savedPrompt) {
      setSelectedPrompt(savedPrompt);
    }
  }, []);

  // Save prompt to localStorage when changed
  useEffect(() => {
    if (selectedPrompt) {
      localStorage.setItem("homepage-generation-prompt", selectedPrompt);
    }
  }, [selectedPrompt]);

  const handleExampleClick = (prompt: string) => {
    setSelectedPrompt(prompt);
    toast.success("提示词已选择，登录后即可开始生成");

    // Analytics tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'homepage_example_click', {
        prompt_length: prompt.length,
        user_authenticated: isAuthenticated
      });
    }
  };

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast.success("提示词已复制到剪贴板");

    // Analytics tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'homepage_prompt_copy', {
        prompt_length: prompt.length,
        user_authenticated: isAuthenticated
      });
    }
  };

  // 未登录用户界面
  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen -mx-4 md:-mx-8 px-4 md:px-8 py-24 overflow-hidden">
        {/* Premium Animated Background */}
        <AnimatedBg variant="combined" intensity="normal" />

        {/* Content Container */}
        <div className="relative z-10 max-w-5xl mx-auto space-y-12">
          {/* Premium Header with Gradient Text */}
          <div className="text-center space-y-6">
            <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-glow">
              <span className="bg-gradient-to-r from-white via-primary/80 to-white bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                AIVIVE
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground/80 max-w-2xl mx-auto font-light leading-relaxed">
              {t("subtitle")}
            </p>
          </div>

          {/* Premium Example Prompts Card */}
          <GlassCard
            variant="elevated"
            glowColor="red"
            withAurora={true}
            className="p-8 md:p-12 space-y-6 group"
          >
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Sparkles className="w-32 h-32 text-primary" />
          </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-white/70 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>{t("try_these")}</span>
            </div>

            <div className="grid gap-3">
              {[
                { key: "example_1", text: t("example_1") },
                { key: "example_2", text: t("example_2") },
                { key: "example_3", text: t("example_3") },
              ].map((example) => (
                <GlassCard
                  key={example.key}
                  variant="interactive"
                  glowColor={selectedPrompt === example.text ? "gold" : "none"}
                  className={`p-5 transition-all ${
                    selectedPrompt === example.text
                      ? "border-accent/40 bg-accent/5"
                      : ""
                  }`}
                  onClick={() => handleExampleClick(example.text)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm flex-1 leading-relaxed text-white/90">
                      {example.text}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-auto p-2 opacity-60 hover:opacity-100 hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyPrompt(example.text);
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </GlassCard>
              ))}
            </div>

            {/* Selected Prompt Display */}
            {selectedPrompt && (
              <div className="p-5 bg-accent/10 border border-accent/30 rounded-xl backdrop-blur-sm">
                <p className="text-sm font-semibold text-accent mb-2">已选择的提示词：</p>
                <p className="text-sm text-white/90 leading-relaxed">{selectedPrompt}</p>
              </div>
            )}

            {/* Premium CTA */}
            <div className="pt-6 space-y-5">
              <div onClick={() => {
                // Analytics tracking for sign-in CTA
                if (typeof window !== 'undefined' && (window as any).gtag) {
                  (window as any).gtag('event', 'homepage_signin_cta_click', {
                    has_selected_prompt: !!selectedPrompt,
                    prompt_length: selectedPrompt.length
                  });
                }
              }}>
                <SignToggle />
              </div>
              <p className="text-sm text-center text-accent font-medium">
                {t("cta_bonus")}
              </p>
            </div>
          </GlassCard>

          {/* Premium Example Gallery */}
          <div className="space-y-6">
            <p className="text-center text-base text-white/60 font-light">
              探索无限创意可能
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 1, title: "动物萌宠", description: "可爱的动物朋友们" },
                { id: 2, title: "风景艺术", description: "绝美的自然风光" },
                { id: 3, title: "科幻未来", description: "充满想象力的世界" },
                { id: 4, title: "人物肖像", description: "生动的人物刻画" },
              ].map((item, idx) => (
                <GlassCard
                  key={item.id}
                  variant="interactive"
                  className="aspect-square p-6 flex flex-col items-center justify-center text-center space-y-3 group"
                  style={{
                    animationDelay: `${idx * 100}ms`,
                  }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 已登录用户界面
  return (
    <div className="relative min-h-screen -mx-4 md:-mx-8 px-4 md:px-8 py-24 overflow-hidden">
      {/* Premium Animated Background */}
      <AnimatedBg variant="combined" intensity="subtle" />

      {/* Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto space-y-12">
        {/* Premium Header */}
        <div className="text-center space-y-6">
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-glow">
            <span className="bg-gradient-to-r from-white via-accent/80 to-white bg-clip-text text-transparent">
              {t("title")}
            </span>
          </h1>

        </div>

        {/* Premium Generation Form */}
        <GlassCard
          variant="elevated"
          glowColor="purple"
          withAurora={true}
          className="p-6 md:p-10"
        >
          <Suspense fallback={<GenerationFormSkeleton />}>
            <GenerationForm initialPrompt={selectedPrompt} />
          </Suspense>
        </GlassCard>

        {/* Premium Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            variant="premium-outline"
            size="lg"
            onClick={() => {
              // Analytics tracking
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'homepage_view_history_click', {
                  credit_balance: creditBalance,
                  has_selected_prompt: !!selectedPrompt
                });
              }
              router.push("/my-history");
            }}
          >
            {t("view_history")}
          </Button>
          <Button
            variant="premium-outline"
            size="lg"
            onClick={() => {
              // Analytics tracking
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'homepage_view_gallery_click', {
                  credit_balance: creditBalance,
                  has_selected_prompt: !!selectedPrompt
                });
              }
              router.push("/gallery");
            }}
          >
            {t("view_gallery")}
          </Button>
        </div>
      </div>
    </div>
  );
}
