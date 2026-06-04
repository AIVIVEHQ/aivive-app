"use client";

import { useRouter } from "next/navigation";
import { useAppContext } from "@/contexts/app";

export default function HeroSection() {
  const { user, gotoSignIn } = useAppContext();
  const router = useRouter();

  const handlePrimary = () => {
    if (!user) {
      gotoSignIn("/generate");
      return;
    }
    router.push("/generate");
  };

  return (
    <section className="relative pt-24 pb-24 md:pt-32 md:pb-32">
      <div className="mx-auto grid max-w-[1480px] grid-cols-12 gap-x-6 px-5 md:px-10">
        {/* Asymmetric headline */}
        <h1 className="col-span-12 font-display font-medium leading-[0.92] tracking-[-0.035em] text-foreground md:col-span-11">
          <span className="block text-[clamp(2.75rem,9.5vw,9rem)]">
            Worlds you can
          </span>
          <span className="block translate-x-[6%] text-[clamp(2.75rem,9.5vw,9rem)] italic text-primary md:translate-x-[14%]">
            imagine,
          </span>
          <span className="block text-[clamp(2.75rem,9.5vw,9rem)]">
            rendered overnight.
          </span>
        </h1>

        {/* Subhead + CTAs */}
        <div className="col-span-12 mt-14 grid grid-cols-12 items-end gap-x-6 md:mt-20">
          <p className="col-span-12 max-w-[60ch] text-[17px] leading-relaxed text-muted-foreground md:col-span-7 md:col-start-1 md:text-[19px]">
            AIVIVE turns a sentence into an image. Text-to-image,
            image-to-image, and a one-click way to draft a tweet with a
            matching picture from a single thought.
          </p>

          <div className="col-span-12 mt-8 flex flex-wrap items-center gap-4 md:col-span-5 md:mt-0 md:justify-end">
            <button
              type="button"
              onClick={handlePrimary}
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_oklch(0.902_0.152_174.5/0.35)]"
            >
              <span>Begin a piece</span>
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </button>
            <a
              href="#gallery"
              className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
            >
              <span>Browse the shelf</span>
              <span aria-hidden className="transition-transform group-hover:translate-y-0.5">↓</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
