"use client";

import { useEffect, useRef } from "react";

type Ratio =
  | "square"
  | "portrait"
  | "portrait-tall"
  | "landscape"
  | "landscape-wide";

type MediaItem =
  | { id: number; kind: "image"; src: string; ratio: Ratio }
  | { id: number; kind: "video"; src: string; ratio: Ratio };

const RATIO_PAD: Record<Ratio, string> = {
  square: "100%",
  portrait: "125%", // 4:5
  "portrait-tall": "177.78%", // 9:16
  landscape: "75%", // 4:3
  "landscape-wide": "56.25%", // 16:9
};

// Helper to build Picsum URLs at exact dimensions (stable per seed)
function picsum(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const ITEMS: MediaItem[] = [
  // — Row of openers: user's real work + 1 video
  { id: 1, kind: "image", src: "/imgs/cover/1.png", ratio: "portrait-tall" },
  { id: 2, kind: "video", src: "/videos/2.mp4", ratio: "landscape-wide" },
  { id: 3, kind: "image", src: "/imgs/cover/2.png", ratio: "portrait-tall" },
  { id: 4, kind: "image", src: "/imgs/cover/3.png", ratio: "portrait-tall" },

  // — Variety layer 1 (placeholder editorial photography to fill the wall)
  { id: 5, kind: "image", src: picsum("aiv-velvet-aurora", 800, 1000), ratio: "portrait" },
  { id: 6, kind: "image", src: "/imgs/cover/6.png", ratio: "portrait" },
  { id: 7, kind: "image", src: picsum("aiv-iron-garden", 800, 800), ratio: "square" },
  { id: 8, kind: "image", src: "/imgs/cover/4.png", ratio: "portrait-tall" },

  // — Long video as a landscape break
  { id: 9, kind: "video", src: "/videos/1.mp4", ratio: "landscape-wide" },

  // — Variety layer 2
  { id: 10, kind: "image", src: picsum("aiv-salt-cathedral", 800, 1200), ratio: "portrait-tall" },
  { id: 11, kind: "image", src: "/imgs/cover/5.png", ratio: "portrait-tall" },
  { id: 12, kind: "image", src: picsum("aiv-slow-hours", 1000, 720), ratio: "landscape" },
  { id: 13, kind: "image", src: "/imgs/cover/10.png", ratio: "portrait" },

  // — More user work + placeholders intermixed
  { id: 14, kind: "image", src: picsum("aiv-marble-smoke", 800, 800), ratio: "square" },
  { id: 15, kind: "image", src: "/imgs/cover/7.png", ratio: "portrait-tall" },
  { id: 16, kind: "image", src: picsum("aiv-linen-sea", 1200, 700), ratio: "landscape-wide" },
  { id: 17, kind: "image", src: "/imgs/cover/8.png", ratio: "portrait-tall" },
  { id: 18, kind: "image", src: picsum("aiv-verde-sotto", 800, 1200), ratio: "portrait-tall" },
  { id: 19, kind: "image", src: "/imgs/cover/9.png", ratio: "portrait-tall" },
  { id: 20, kind: "image", src: picsum("aiv-tin-sky", 1000, 720), ratio: "landscape" },

  // — Final closing variants
  { id: 21, kind: "image", src: picsum("aiv-citrus-hour", 800, 800), ratio: "square" },
  { id: 22, kind: "image", src: picsum("aiv-northbound", 800, 1200), ratio: "portrait-tall" },
  { id: 23, kind: "image", src: picsum("aiv-marquee-light", 1000, 720), ratio: "landscape" },
  { id: 24, kind: "image", src: picsum("aiv-honey-plant", 800, 1000), ratio: "portrait" },
];

function GalleryItem({ item, index }: { item: MediaItem; index: number }) {
  const wrapRef = useRef<HTMLAnchorElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fade-in on first viewport intersection
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

  // Pause/resume video when off/on screen to save bandwidth and CPU
  useEffect(() => {
    if (item.kind !== "video") return;
    const node = videoRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void node.play().catch(() => {
              /* autoplay may be blocked — ignore */
            });
          } else {
            node.pause();
          }
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [item.kind]);

  const pad = RATIO_PAD[item.ratio];

  return (
    <a
      ref={wrapRef}
      href="#"
      className="group/item mb-4 block break-inside-avoid opacity-0 translate-y-3 transition-[opacity,transform] duration-700 ease-out data-[in-view=true]:opacity-100 data-[in-view=true]:translate-y-0 md:mb-6"
      style={{ transitionDelay: `${(index % 6) * 60}ms` }}
      aria-label={`Edition ${item.id.toString().padStart(3, "0")}`}
    >
      <div className="relative overflow-hidden bg-card">
        <div style={{ paddingTop: pad }} />

        {item.kind === "image" ? (
          <img
            src={item.src}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover/item:scale-[1.035]"
          />
        ) : (
          <video
            ref={videoRef}
            src={item.src}
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover/item:scale-[1.025]"
          />
        )}

        {/* Edition number — top-left, blend-mode for legibility on any image */}
        <span className="absolute left-3 top-3 z-10 font-mono text-[10px] uppercase tracking-[0.28em] text-white/90 mix-blend-difference">
          ED. {item.id.toString().padStart(3, "0")}
        </span>

        {/* Video marker — top-right */}
        {item.kind === "video" && (
          <span className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-white backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Video
          </span>
        )}

        {/* Bottom mask + hover hint */}
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

export default function MasonryGallery() {
  return (
    <section id="gallery" className="relative pb-32 md:pb-44">
      <div className="mx-auto max-w-[1480px] px-5 md:px-10">
        {/* Section heading */}
        <header className="mb-10 grid grid-cols-12 items-end gap-x-6 border-t border-border pt-8 md:mb-14 md:pt-12">
          <div className="col-span-12 md:col-span-8">
            <h2 className="font-display text-[clamp(1.875rem,4.5vw,3.75rem)] font-medium leading-[1.02] tracking-[-0.02em] text-foreground">
              Gallery
            </h2>
          </div>
          <div className="col-span-12 mt-4 md:col-span-4 md:mt-0 md:text-right">
            <p className="text-[14px] leading-relaxed text-muted-foreground">
              A curated stream of work made with AIVIVE.
            </p>
          </div>
        </header>

        {/* Masonry — CSS columns, reliable across browsers */}
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 md:gap-6">
          {ITEMS.map((item, i) => (
            <GalleryItem key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
