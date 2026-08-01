"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usersService } from "./users.service";
import type { UserRole } from "./users.types";

// Searches once the term is at least 2 characters; keeps the previous results
// on screen while the next query resolves so the dropdown doesn't flicker.
export function useUserSearch(q: string, role?: UserRole) {
  const term = q.trim();
  return useQuery({
    queryKey: ["users", "search", term, role ?? "all"],
    queryFn: ({ signal }) => usersService.search(term, role, signal),
    enabled: term.length >= 2,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
