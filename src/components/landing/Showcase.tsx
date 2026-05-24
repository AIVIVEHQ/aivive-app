"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronRightIcon } from "lucide-react";
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

export default function Showcase() {
  const t = useTranslations("homepage.showcase");
  const [ref, isInView] = useInView();

  const images = [
    { src: "https://storage.googleapis.com/download/storage/v1/b/goog-cloud-ai-generative-ai/o/image-generation-examples%2Fprompt-1.jpg?generation=1708994511244199&alt=media", span: "md:col-span-2 md:row-span-2", title: t("images.alpine_cabin") },
    { src: "https://storage.googleapis.com/download/storage/v1/b/goog-cloud-ai-generative-ai/o/image-generation-examples%2Fprompt-2.jpg?generation=1708994511394199&alt=media", span: "md:col-span-1 md:row-span-1", title: t("images.cyber_santa") },
    { src: "https://storage.googleapis.com/download/storage/v1/b/goog-cloud-ai-generative-ai/o/image-generation-examples%2Fprompt-3.jpg?generation=1708994511244199&alt=media", span: "md:col-span-1 md:row-span-1", title: t("images.macro_ornament") },
    { src: "https://storage.googleapis.com/download/storage/v1/b/goog-cloud-ai-generative-ai/o/image-generation-examples%2Fprompt-4.jpg?generation=1708994511394199&alt=media", span: "md:col-span-2 md:row-span-1", title: t("images.nyc_reindeer") },
  ];

  return (
    <section id="showcase" className="py-32 px-6 relative z-10 border-t border-border">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
           <div className="max-w-2xl">
             <h2 className="text-4xl md:text-5xl font-display tracking-tight text-foreground mb-4">{t("title")}</h2>
             <p className="text-muted-foreground text-lg">{t("subtitle")}</p>
           </div>
           <button className="flex items-center gap-2 text-primary border-b border-primary/30 pb-1 hover:border-primary transition-colors">
             {t("view_gallery")} <ChevronRightIcon className="w-4 h-4" />
           </button>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[280px]">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`
                group relative rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/30 cursor-pointer
                ${img.span}
                ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
              `}
              style={{ transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 100}ms` }}
            >
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" style={{ backgroundImage: `url(${img.src})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-end">
                <p className="text-foreground font-display tracking-tight text-xl">{img.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 font-mono uppercase tracking-wider">
                   <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[8px] text-primary-foreground font-display">A</div>
                   <span>{t("prompt_enhanced")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}