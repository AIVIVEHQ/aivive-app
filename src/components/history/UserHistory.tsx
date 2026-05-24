"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import HistoryGrid from "./HistoryGrid";
import HistoryFilters from "./HistoryFilters";
import type { ClientGeneration, GenerationStatus } from "@/types/generation";

export default function UserHistory() {
  const [generations, setGenerations] = useState<ClientGeneration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<GenerationStatus | "all">(
    "all"
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchGenerations();
  }, [statusFilter, page]);

  const fetchGenerations = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        status: statusFilter,
      });

      const response = await fetch(`/api/generations/list?${params}`);
      const data = await response.json();

      if (response.ok) {
        setGenerations(data.generations);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch generations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchGenerations();
  };

  if (isLoading && page === 1) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <HistoryFilters
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Grid */}
      {generations.length > 0 ? (
        <HistoryGrid generations={generations} onRefresh={handleRefresh} />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No generations found</p>
          <a
            href="/generate"
            className="inline-block mt-4 text-primary hover:underline"
          >
            Create your first generation →
          </a>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-md border disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-md border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
