"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronRightIcon, GlobeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/contexts/app";
import GeneratorWidget from "./GeneratorWidget";

// Hook for scroll-triggered animations
const useInView = (options: IntersectionObserverInit = { threshold: 0.1, rootMargin: '0px' }) => {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        if (ref.current) observer.unobserve(ref.current);
      }
    }, options);

    const currentRef = ref.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return [ref, isInView] as const;
};

export default function HeroSection() {
  const [heroRef, heroInView] = useInView();
  const t = useTranslations("homepage.hero");
  const { user, setShowSignModal } = useAppContext();
  const router = useRouter();

  const handlePrimary = () => {
    if (!user) {
      setShowSignModal(true);
      return;
    }
    router.push("/generate");
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 md:pt-48 px-6 overflow-hidden">
      <div
        ref={heroRef}
        className={`max-w-5xl mx-auto text-center relative z-10 transition-all duration-1000 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/20 backdrop-blur-md text-xs font-mono uppercase tracking-wider text-primary mb-8 hover:bg-primary/10 transition-colors cursor-pointer animate-fade-up">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          {t("badge")}
          <ChevronRightIcon className="w-3 h-3" />
        </div>

        <h1
          className="text-6xl md:text-7xl lg:text-8xl font-display tracking-wider uppercase text-foreground mb-8 leading-[0.95] bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #FFFFFF 0%, #A8FFEB 25%, #4FFFD8 50%, #FFA682 75%, #FF8A5C 100%)",
            filter:
              "drop-shadow(0 0 50px oklch(0.902 0.152 174.5 / 0.35))",
          }}
        >
          {t("title")} <br />
          {t("title_highlight")}
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
          {t("subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
           <button
             onClick={handlePrimary}
             className="h-12 px-8 rounded-full bg-primary text-primary-foreground font-semibold hover:scale-[1.03] transition-all flex items-center gap-2 shadow-[0_0_30px_oklch(0.902_0.152_174.5/0.3)]"
           >
             {t("cta_primary")} <ChevronRightIcon className="w-4 h-4" />
           </button>
           <button className="h-12 px-8 rounded-full bg-primary/5 border border-primary/20 text-foreground font-semibold hover:bg-primary/10 hover:border-primary/40 backdrop-blur-md transition-all flex items-center gap-2">
             <GlobeIcon className="w-4 h-4" /> {t("cta_secondary")}
           </button>
        </div>
      </div>

      {/* Widget floats up into view */}
      <GeneratorWidget />
    </section>
  );
}