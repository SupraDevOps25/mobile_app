"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "./analytics.service";

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: ({ signal }) => analyticsService.overview(signal),
    staleTime: 60_000,
  });
}
