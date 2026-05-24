import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HappyUsers from "./happy-users";
import HeroBg from "./bg";
import { Hero as HeroType } from "@/types/blocks/hero";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";

export default function Hero({ hero }: { hero: HeroType }) {
  if (hero.disabled) {
    return null;
  }

  const highlightText = hero.highlight_text;
  let texts = null;
  if (highlightText) {
    texts = hero.title?.split(highlightText, 2);
  }

  return (
    <>
      <HeroBg />
      <section className="py-24 relative">
        <div className="container">
          <div className="text-center">
            {hero.announcement && (
              <Link
                href={hero.announcement.url as any}
                className="mx-auto mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-2 text-sm hover:bg-white/10 transition-all duration-300"
              >
                {hero.announcement.label && (
                  <Badge className="bg-primary/20 text-primary border-primary/30">{hero.announcement.label}</Badge>
                )}
                <span className="text-white/90">{hero.announcement.title}</span>
              </Link>
            )}

            {texts && texts.length > 1 ? (
              <h1 className="font-serif mx-auto mb-3 mt-4 max-w-6xl text-balance text-4xl font-bold lg:mb-7 lg:text-7xl text-glow">
                {texts[0]}
                <span className="bg-gradient-to-r from-white via-primary/80 to-white bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                  {highlightText}
                </span>
                {texts[1]}
              </h1>
            ) : (
              <h1 className="font-serif mx-auto mb-3 mt-4 max-w-6xl text-balance text-4xl font-bold lg:mb-7 lg:text-7xl text-glow">
                {hero.title}
              </h1>
            )}

            <p
              className="mx-auto max-w-3xl text-white/70 lg:text-xl font-light leading-relaxed"
              dangerouslySetInnerHTML={{ __html: hero.description || "" }}
            />
            {hero.buttons && (
              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                {hero.buttons.map((item, i) => {
                  // Use premium variant for primary button, premium-outline for secondary
                  const premiumVariant = i === 0 ? "premium" : "premium-outline";
                  return (
                    <Link
                      key={i}
                      href={item.url as any}
                      target={item.target || ""}
                      className="flex items-center"
                    >
                      <Button
                        className="w-full"
                        size="lg"
                        variant={premiumVariant}
                      >
                        {item.icon && <Icon name={item.icon} className="" />}
                        {item.title}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            )}
            {hero.tip && (
              <p className="mt-8 text-sm text-white/60 font-light">{hero.tip}</p>
            )}
            {hero.show_happy_users && <HappyUsers />}
          </div>
        </div>
      </section>
    </>
  );
}
