"use client";

import { useRouter } from "next/navigation";
import { useAppContext } from "@/contexts/app";
import HeroSection from "@/components/landing/HeroSection";
import StyleCategories from "@/components/landing/StyleCategories";
import MasonryGallery from "@/components/landing/MasonryGallery";

export default function LandingPageClient() {
  const { user, gotoSignIn } = useAppContext();
  const router = useRouter();

  const handleCta = () => {
    if (!user) {
      gotoSignIn("/generate");
      return;
    }
    router.push("/generate");
  };

  return (
    <div className="bg-background text-foreground font-sans">
      <HeroSection />
      <StyleCategories />
      <MasonryGallery />

      {/* Closing CTA */}
      <section className="relative border-t border-border pb-32 pt-24 md:pb-48 md:pt-36">
        <div className="mx-auto max-w-[1480px] px-5 md:px-10">
          <div className="max-w-4xl">
            <p className="font-display text-[clamp(2rem,6vw,5.5rem)] font-medium leading-[1.02] tracking-[-0.025em] text-foreground">
              Bring a sentence.
              <br />
              <span className="italic text-primary">Leave with an image</span>{" "}
              worth pressing.
            </p>

            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 md:mt-16">
              <button
                type="button"
                onClick={handleCta}
                className="group inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 font-mono text-[12px] uppercase tracking-[0.24em] text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_40px_oklch(0.902_0.152_174.5/0.35)]"
              >
                <span>Compose your first edition</span>
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </button>
              <a
                href="#gallery"
                className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
              >
                ← Back to gallery
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
