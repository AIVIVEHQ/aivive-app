"use client";

import BackgroundEffects from "@/components/landing/BackgroundEffects";
import HeroSection from "@/components/landing/HeroSection";
import Showcase from "@/components/landing/Showcase";
import Features from "@/components/landing/Features";
import FAQ from "@/components/landing/FAQ";
import { useTranslations } from "next-intl";
import { useAppContext } from "@/contexts/app";
import { useRouter } from "next/navigation";

export default function LandingPageClient() {
  const t = useTranslations("homepage");
  const { user, setShowSignModal } = useAppContext();
  const router = useRouter();

  const handleCta = () => {
    if (!user) {
      setShowSignModal(true);
      return;
    }
    router.push("/generate");
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground relative noise-overlay">
      <BackgroundEffects />

      {/* Hero Section */}
      <HeroSection />

      <Showcase />

      {/* Bento Grid Features */}
      <Features />

      {/* Simple FAQ */}
      <section className="py-32 px-6 relative z-10 border-t border-border">
        <div className="max-w-[1000px] mx-auto grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-4xl font-display tracking-tight text-foreground mb-6">{t("faq.title")}</h2>
            <p className="text-muted-foreground text-lg mb-8">
              {t("faq.subtitle")}
            </p>
            <a href="#" className="text-primary hover:text-primary/80 border-b border-primary/40 pb-1">{t("faq.contact_support")}</a>
          </div>
          <FAQ />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
           <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl mx-auto flex items-center justify-center mb-8 shadow-2xl border border-primary/20 rotate-12 hover:rotate-0 transition-transform duration-500">
              <span className="font-display text-primary text-2xl tracking-wider">A</span>
           </div>
           <h2 className="text-5xl md:text-7xl font-display tracking-tight text-foreground mb-8">{t("cta.title")}</h2>
           <button
             onClick={handleCta}
             className="px-12 py-5 bg-primary text-primary-foreground rounded-full font-semibold text-xl hover:scale-105 transition-transform shadow-[0_0_40px_oklch(0.902_0.152_174.5/0.3)]"
           >
            {t("cta.button")}
           </button>
        </div>
      </section>
    </div>
  );
}
