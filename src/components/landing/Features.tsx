"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronRightIcon, ZapIcon, LayersIcon, GridIcon, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";

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

// Feature Card Component
const FeatureCard = ({ icon: Icon, title, desc, learnMore, className, delay = 0 }: any) => {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`
        relative p-8 rounded-3xl glass-card overflow-hidden group transition-all duration-500
        ${className}
        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl group-hover:opacity-100 opacity-60 transition-opacity duration-700"
        style={{ background: 'radial-gradient(circle, oklch(0.902 0.152 174.5 / 0.12), transparent 70%)' }}
      />

      <div className="relative z-10 h-full flex flex-col">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary border border-primary/20 group-hover:scale-110 group-hover:shadow-[0_0_20px_oklch(0.902_0.152_174.5/0.25)] transition-all duration-300">
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-display tracking-tight text-foreground mb-3">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">{desc}</p>

        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-wider">
          {learnMore} <ChevronRightIcon className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};

export default function Features() {
  const t = useTranslations("homepage.features");
  return (
    <section id="features" className="py-32 px-6 relative z-10">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-24">
          <span className="inline-flex items-center gap-3 text-sm font-mono uppercase tracking-wider text-primary mb-6">
            <span className="w-8 h-px bg-primary/30" />
            The recursive loop
            <span className="w-8 h-px bg-primary/30" />
          </span>
          <h2 className="text-4xl md:text-5xl font-display tracking-tight text-foreground mb-6">{t("title")}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
          <FeatureCard
            icon={Wand2}
            title={t("natural_language.title")}
            desc={t("natural_language.desc")}
            learnMore={t("learn_more")}
            className="md:col-span-2"
            delay={0}
          />
          <FeatureCard
            icon={ZapIcon}
            title={t("real_time_latency.title")}
            desc={t("real_time_latency.desc")}
            learnMore={t("learn_more")}
            className="md:col-span-1"
            delay={100}
          />
          <FeatureCard
            icon={LayersIcon}
            title={t("character_consistency.title")}
            desc={t("character_consistency.desc")}
            learnMore={t("learn_more")}
            className="md:col-span-1"
            delay={200}
          />
          <FeatureCard
            icon={GridIcon}
            title={t("infinite_canvas.title")}
            desc={t("infinite_canvas.desc")}
            learnMore={t("learn_more")}
            className="md:col-span-2 bg-gradient-to-br from-primary/8 to-primary/15"
            delay={300}
          />
        </div>
      </div>
    </section>
  );
}