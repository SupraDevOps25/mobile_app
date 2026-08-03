"use client";

import { useQuery } from "@tanstack/react-query";
import { statsService } from "./stats.service";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["stats", "overview"],
    queryFn: ({ signal }) => statsService.overview(signal),
    staleTime: 60_000,
  });
}
