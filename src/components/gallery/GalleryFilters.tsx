"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";

interface GalleryFiltersProps {
  aspectRatio: string;
  sort: string;
  onAspectRatioChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onReset: () => void;
}

export default function GalleryFilters({
  aspectRatio,
  sort,
  onAspectRatioChange,
  onSortChange,
  onReset,
}: GalleryFiltersProps) {
  const t = useTranslations("gallery");

  const hasFilters = aspectRatio !== "all" || sort !== "recent";

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Filter className="w-4 h-4" />
        <span>{t("filters")}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 flex-1">
        {/* Aspect Ratio Filter */}
        <div className="min-w-[140px]">
          <Select value={aspectRatio} onValueChange={onAspectRatioChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("aspect_ratio")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all_ratios")}</SelectItem>
              <SelectItem value="1:1">1:1 (方形)</SelectItem>
              <SelectItem value="16:9">16:9 (横向)</SelectItem>
              <SelectItem value="9:16">9:16 (竖向)</SelectItem>
              <SelectItem value="3:4">3:4 (竖向)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Filter */}
        <div className="min-w-[140px]">
          <Select value={sort} onValueChange={onSortChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("sort_by")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">{t("most_recent")}</SelectItem>
              <SelectItem value="popular">{t("most_popular")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset Button */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="gap-1"
          >
            <X className="w-4 h-4" />
            <span>{t("clear_filters")}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
