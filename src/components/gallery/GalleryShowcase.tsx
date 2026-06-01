"use client";

import { useEffect, useRef } from "react";

type GalleryEntry = {
  id: number;
  w: number;
  h: number;
};

const ENTRIES: GalleryEntry[] = [
  { id: 1, w: 1024, h: 1024 },
  { id: 2, w: 1536, h: 2048 },
  { id: 3, w: 1024, h: 1024 },
  { id: 4, w: 832, h: 1216 },
  { id: 5, w: 1024, h: 1536 },
  { id: 6, w: 768, h: 1344 },
  { id: 7, w: 928, h: 1664 },
  { id: 8, w: 832, h: 1216 },
  { id: 9, w: 1984, h: 2944 },
  { id: 10, w: 885, h: 1573 },
  { id: 11, w: 768, h: 1344 },
  { id: 12, w: 1984, h: 2944 },
  { id: 13, w: 832, h: 1216 },
  { id: 14, w: 1728, h: 2112 },
  { id: 15, w: 1024, h: 1536 },
  { id: 16, w: 1024, h: 1536 },
  { id: 17, w: 832, h: 1216 },
  { id: 18, w: 832, h: 1280 },
  { id: 19, w: 832, h: 1216 },
  { id: 20, w: 832, h: 1216 },
  { id: 21, w: 1039, h: 1513 },
  { id: 22, w: 832, h: 1216 },
  { id: 23, w: 896, h: 1248 },
  { id: 24, w: 896, h: 1152 },
  { id: 25, w: 832, h: 1216 },
  { id: 26, w: 1024, h: 1536 },
  { id: 27, w: 832, h: 1216 },
  { id: 28, w: 1072, h: 1920 },
  { id: 29, w: 832, h: 1216 },
  { id: 30, w: 832, h: 1216 },
  { id: 31, w: 1328, h: 1944 },
  { id: 32, w: 1296, h: 1728 },
  { id: 33, w: 3168, h: 4608 },
  { id: 34, w: 768, h: 1344 },
  { id: 35, w: 2304, h: 4096 },
  { id: 36, w: 1536, h: 2048 },
  { id: 37, w: 1792, h: 2304 },
  { id: 38, w: 832, h: 1216 },
  { id: 39, w: 1296, h: 1728 },
  { id: 40, w: 1664, h: 2432 },
  { id: 41, w: 2688, h: 3840 },
  { id: 42, w: 1086, h: 1448 },
  { id: 43, w: 832, h: 1216 },
  { id: 44, w: 1072, h: 1920 },
  { id: 45, w: 2800, h: 4096 },
  { id: 46, w: 768, h: 1376 },
  { id: 47, w: 832, h: 1280 },
  { id: 48, w: 1040, h: 1600 },
  { id: 49, w: 2688, h: 3840 },
  { id: 50, w: 832, h: 1216 },
];

function GalleryItem({ entry, index }: { entry: GalleryEntry; index: number }) {
  const wrapRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const node = wrapRef.current;
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
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const pad = `${(entry.h / entry.w) * 100}%`;
  const padded = entry.id.toString().padStart(3, "0");
  const src = `/imgs/gallery/${padded}.jpg`;

  return (
    <a
      ref={wrapRef}
      href="#"
      className="group/item mb-4 block break-inside-avoid opacity-0 translate-y-3 transition-[opacity,transform] duration-700 ease-out data-[in-view=true]:opacity-100 data-[in-view=true]:translate-y-0 md:mb-6"
      style={{ transitionDelay: `${(index % 6) * 60}ms` }}
      aria-label={`Edition ${padded}`}
    >
      <div className="relative overflow-hidden bg-card">
        <div style={{ paddingTop: pad }} />
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover/item:scale-[1.035]"
        />

        <span className="absolute left-3 top-3 z-10 font-mono text-[10px] uppercase tracking-[0.28em] text-white/90 mix-blend-difference">
          ED. {padded}
        </span>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black/55 to-transparent opacity-0 transition-opacity duration-500 group-hover/item:opacity-100" />
        <span
          aria-hidden
          className="absolute bottom-3 right-3 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/35 text-[11px] text-white opacity-0 transition-opacity duration-500 group-hover/item:opacity-100"
        >
          →
        </span>
      </div>
    </a>
  );
}

export default function GalleryShowcase() {
  return (
    <section className="relative">
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 md:gap-6">
        {ENTRIES.map((entry, i) => (
          <GalleryItem key={entry.id} entry={entry} index={i} />
        ))}
      </div>
    </section>
  );
}
