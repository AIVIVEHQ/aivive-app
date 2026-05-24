"use client";

import type { GenerationStatus } from "@/types/generation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HistoryFiltersProps {
  statusFilter: GenerationStatus | "all";
  onStatusFilterChange: (status: GenerationStatus | "all") => void;
}

export default function HistoryFilters({
  statusFilter,
  onStatusFilterChange,
}: HistoryFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium">Filter by status:</label>
      <Select
        value={statusFilter}
        onValueChange={(value) =>
          onStatusFilterChange(value as GenerationStatus | "all")
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="success">Success</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
