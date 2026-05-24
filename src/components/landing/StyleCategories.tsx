"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Category = {
  slug: string;
  label: string;
  blurb: string;
  image: string;
};

// Curated Unsplash photo URLs — stable CDN, free, no API key required.
// Each category gets one strong cover photo that hints at the style.
const CATEGORIES: Category[] = [
  {
    slug: "portrait",
    label: "Portraits",
    blurb: "Faces, headshots, character studies.",
    image:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=900&q=80&auto=format&fit=crop",
  },
  {
    slug: "landscape",
    label: "Landscapes",
    blurb: "Mountains, seas, golden hours.",
    image:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900&q=80&auto=format&fit=crop",
  },
  {
    slug: "cinematic",
    label: "Cinematic",
    blurb: "Film stills, anamorphic light, drama.",
    image:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=900&q=80&auto=format&fit=crop",
  },
  {
    slug: "architecture",
    label: "Architecture",
    blurb: "Interiors, facades, brutalist forms.",
    image:
      "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=900&q=80&auto=format&fit=crop",
  },
  {
    slug: "abstract",
    label: "Abstract Art",
    blurb: "Pattern, surface, material studies.",
    image:
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=900&q=80&auto=format&fit=crop",
  },
  {
    slug: "anime",
    label: "Illustration",
    blurb: "Stylized characters, manga panels.",
    image:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=900&q=80&auto=format&fit=crop",
  },
];

function CategoryCard({
  category,
  index,
  onClick,
}: {
  category: Category;
  index: number;
  onClick: (slug: string) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.inView = "true";
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onClick(category.slug)}
      className="group/cat relative block w-full overflow-hidden rounded-lg bg-card text-left opacity-0 translate-y-3 transition-[opacity,transform] duration-700 ease-out data-[in-view=true]:opacity-100 data-[in-view=true]:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{ transitionDelay: `${(index % 3) * 80}ms` }}
      aria-label={`Generate ${category.label}`}
    >
      {/* Aspect 3:4 spacer */}
      <div style={{ paddingTop: "133.33%" }} />

      <img
        src={category.image}
        alt={category.label}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition-[transform,filter] duration-[1200ms] ease-out group-hover/cat:scale-[1.05]"
      />

      {/* Gradient mask */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/0" />

      {/* Caption */}
      <div className="absolute inset-x-5 bottom-5 z-10">
        <h3 className="font-display text-[clamp(1.3rem,2.2vw,1.85rem)] font-medium leading-[1.05] tracking-[-0.01em] text-white">
          {category.label}
        </h3>
        <p className="mt-1.5 text-[13px] leading-snug text-white/70">
          {category.blurb}
        </p>

        {/* CTA — slides in on hover */}
        <div className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/55 transition-colors group-hover/cat:text-white">
          <span aria-hidden className="h-[1px] w-6 bg-white/40 transition-[width,background-color] duration-500 group-hover/cat:w-12 group-hover/cat:bg-white" />
          <span>Try this style</span>
        </div>
      </div>
    </button>
  );
}

export default function StyleCategories() {
  const router = useRouter();

  const handleClick = (slug: string) => {
    router.push(`/generate?style=${slug}`);
  };

  return (
    <section id="styles" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-[1480px] px-5 md:px-10">
        {/* Section heading */}
        <header className="mb-10 grid grid-cols-12 items-end gap-x-6 border-t border-border pt-8 md:mb-14 md:pt-12">
          <div className="col-span-12 md:col-span-8">
            <h2 className="font-display text-[clamp(1.875rem,4.5vw,3.75rem)] font-medium leading-[1.02] tracking-[-0.02em] text-foreground">
              Pick a <span className="italic text-primary">style</span>,
              <br />
              and start there.
            </h2>
          </div>
          <div className="col-span-12 mt-4 md:col-span-4 md:mt-0 md:text-right">
            <p className="text-[14px] leading-relaxed text-muted-foreground">
              Six families to make the blank page less blank.
              <br />
              <span className="text-muted-foreground/60">
                Tap any card to open the studio.
              </span>
            </p>
          </div>
        </header>

        {/* Grid: 1 / 2 / 3 cols */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {CATEGORIES.map((category, i) => (
            <CategoryCard
              key={category.slug}
              category={category}
              index={i}
              onClick={handleClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
