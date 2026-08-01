"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { visitsService } from "./visits.service";
import type { VisitStatus } from "./visits.types";

export const visitKeys = {
  all: ["visits"] as const,
  list: (status?: VisitStatus, q?: string) =>
    [...visitKeys.all, "list", status ?? "all", q ?? ""] as const,
};

export function useAdminVisits(status?: VisitStatus, q?: string) {
  const term = q?.trim() ?? "";
  return useQuery({
    queryKey: visitKeys.list(status, term),
    queryFn: ({ signal }) =>
      visitsService.list(status, term || undefined, signal),
    placeholderData: keepPreviousData,
  });
}

export function useSetVisitStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; status: VisitStatus }) =>
      visitsService.setStatus(vars.id, vars.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: visitKeys.all });
    },
  });
}
