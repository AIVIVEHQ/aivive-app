"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import GalleryCard from "./GalleryCard";
import GalleryFilters from "./GalleryFilters";
import GalleryLightbox from "./GalleryLightbox";
import GalleryEmpty from "./GalleryEmpty";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PublicGeneration {
  uuid: string;
  prompt: string;
  aspectRatio: string;
  thumbnailUrl: string;
  imageUrl: string;
  likeCount: number;
  viewCount: number;
  createdAt: string;
  imageWidth: number;
  imageHeight: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function PublicGallery() {
  const t = useTranslations("gallery");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [generations, setGenerations] = useState<PublicGeneration[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedGeneration, setSelectedGeneration] =
    useState<PublicGeneration | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Filters
  const [aspectRatio, setAspectRatio] = useState(
    searchParams.get("aspectRatio") || "all"
  );
  const [sort, setSort] = useState(searchParams.get("sort") || "recent");

  useEffect(() => {
    fetchGenerations();
  }, [aspectRatio, sort, pagination.page]);

  const fetchGenerations = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort,
      });

      if (aspectRatio !== "all") {
        params.append("aspectRatio", aspectRatio);
      }

      const response = await fetch(`/api/generations/public-gallery?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch gallery");
      }

      const data = await response.json();
      setGenerations(data.generations);
      setPagination(data.pagination);
    } catch (error) {
      toast.error(t("fetch_error"));
      console.error("Error fetching gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAspectRatioChange = (value: string) => {
    setAspectRatio(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
    updateURL({ aspectRatio: value });
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
    updateURL({ sort: value });
  };

  const handleResetFilters = () => {
    setAspectRatio("all");
    setSort("recent");
    setPagination((prev) => ({ ...prev, page: 1 }));
    updateURL({ aspectRatio: "all", sort: "recent" });
  };

  const updateURL = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value === "all" || value === "recent") {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    router.push(`?${newParams.toString()}`, { scroll: false });
  };

  const handleImageClick = (generation: PublicGeneration) => {
    setSelectedGeneration(generation);
    setLightboxOpen(true);
  };

  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-8">
      {/* Filters */}
      <GalleryFilters
        aspectRatio={aspectRatio}
        sort={sort}
        onAspectRatioChange={handleAspectRatioChange}
        onSortChange={handleSortChange}
        onReset={handleResetFilters}
      />

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!loading && generations.length === 0 && <GalleryEmpty />}

      {/* Gallery Grid */}
      {!loading && generations.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {generations.map((generation) => (
              <GalleryCard
                key={generation.uuid}
                generation={generation}
                onImageClick={() => handleImageClick(generation)}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-8 border-t">
              <div className="text-sm text-muted-foreground">
                {t("page_of", {
                  page: pagination.page,
                  total: pagination.totalPages,
                })}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handlePreviousPage}
                  disabled={pagination.page === 1}
                >
                  {t("previous_page")}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={pagination.page === pagination.totalPages}
                >
                  {t("next_page")}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      <GalleryLightbox
        generation={selectedGeneration}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
