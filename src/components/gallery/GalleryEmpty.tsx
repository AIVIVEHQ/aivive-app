"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ImageOff, Sparkles } from "lucide-react";

export default function GalleryEmpty() {
  const t = useTranslations("gallery");

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
        <ImageOff className="w-10 h-10 text-muted-foreground" />
      </div>

      <h3 className="text-2xl font-semibold mb-2">{t("no_images_title")}</h3>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        {t("no_images_description")}
      </p>

      <Link href="/generate">
        <Button size="lg" className="gap-2">
          <Sparkles className="w-5 h-5" />
          {t("start_creating")}
        </Button>
      </Link>
    </div>
  );
}
