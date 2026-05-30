import type { LandingPage, PricingPage, ShowcasePage } from "@/types/pages/landing";

import landingEn from "@/i18n/pages/landing/en.json";
import landingZh from "@/i18n/pages/landing/zh.json";
import pricingEn from "@/i18n/pages/pricing/en.json";
import pricingZh from "@/i18n/pages/pricing/zh.json";
import showcaseEn from "@/i18n/pages/showcase/en.json";
import showcaseZh from "@/i18n/pages/showcase/zh.json";

type PageName = "landing" | "pricing" | "showcase";
type PageData = LandingPage | PricingPage | ShowcasePage;

const PAGES: Record<PageName, Record<string, PageData>> = {
  landing: { en: landingEn as LandingPage, zh: landingZh as LandingPage },
  pricing: { en: pricingEn as PricingPage, zh: pricingZh as PricingPage },
  showcase: { en: showcaseEn as ShowcasePage, zh: showcaseZh as ShowcasePage },
};

export async function getLandingPage(locale: string): Promise<LandingPage> {
  return getPage("landing", locale) as LandingPage;
}

export async function getPricingPage(locale: string): Promise<PricingPage> {
  return getPage("pricing", locale) as PricingPage;
}

export async function getShowcasePage(locale: string): Promise<ShowcasePage> {
  return getPage("showcase", locale) as ShowcasePage;
}

export function getPage(name: PageName, locale: string): PageData {
  const key = locale === "zh-CN" ? "zh" : locale.toLowerCase();
  return PAGES[name][key] ?? PAGES[name].en;
}
