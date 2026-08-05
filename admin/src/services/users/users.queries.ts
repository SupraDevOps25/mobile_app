"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { usersService } from "./users.service";
import type { UserRole } from "./users.types";

export const userKeys = {
  all: ["users"] as const,
  list: (q?: string, role?: UserRole) =>
    [...userKeys.all, "list", q ?? "", role ?? "all"] as const,
};

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

// Full directory listing for the Users admin page (works with an empty term).
export function useUsers(q?: string, role?: UserRole) {
  const term = q?.trim() ?? "";
  return useQuery({
    queryKey: userKeys.list(term, role),
    queryFn: ({ signal }) => usersService.list(term || undefined, role, signal),
    placeholderData: keepPreviousData,
  });
}

export function useSetBanned() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; banned: boolean; reason?: string }) =>
      usersService.setBanned(vars.id, vars.banned, vars.reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}
