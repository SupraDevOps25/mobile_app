"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { familiesService } from "./families.service";

export const familyKeys = {
  all: ["families"] as const,
  list: (q?: string) => [...familyKeys.all, "list", q ?? ""] as const,
  detail: (id: string) => [...familyKeys.all, "detail", id] as const,
};

export function useFamilies(q?: string) {
  const term = q?.trim() ?? "";
  return useQuery({
    queryKey: familyKeys.list(term),
    queryFn: ({ signal }) => familiesService.list(term || undefined, signal),
    placeholderData: keepPreviousData,
  });
}

export function useFamily(id: string) {
  return useQuery({
    queryKey: familyKeys.detail(id),
    queryFn: ({ signal }) => familiesService.getOne(id, signal),
    enabled: Boolean(id),
  });
}
