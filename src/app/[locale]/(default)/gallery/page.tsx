import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import GalleryShowcase from "@/components/gallery/GalleryShowcase";
import { Loader2 } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gallery.meta" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

function LoadingGallery() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function GalleryPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">
          <GalleryTitle />
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          <GallerySubtitle />
        </p>
      </div>

      {/* Gallery Content */}
      <Suspense fallback={<LoadingGallery />}>
        <GalleryShowcase />
      </Suspense>
    </div>
  );
}

function GalleryTitle() {
  const t = useTranslations("gallery");
  return t("title");
}

function GallerySubtitle() {
  const t = useTranslations("gallery");
  return t("subtitle");
}
