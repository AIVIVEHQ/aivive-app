"use client";

import HistoryCard from "./HistoryCard";
import type { ClientGeneration } from "@/types/generation";

interface HistoryGridProps {
  generations: ClientGeneration[];
  onRefresh: () => void;
}

export default function HistoryGrid({
  generations,
  onRefresh,
}: HistoryGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {generations.map((generation) => (
        <HistoryCard
          key={generation.uuid}
          generation={generation}
          onDelete={onRefresh}
        />
      ))}
    </div>
  );
}
