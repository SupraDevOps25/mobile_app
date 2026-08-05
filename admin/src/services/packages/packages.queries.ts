"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { packagesService } from "./packages.service";
import type {
  CreatePackageInput,
  PackageType,
  UpdatePackageInput,
} from "./packages.types";

export const packageKeys = {
  all: ["packages"] as const,
  list: () => [...packageKeys.all, "list"] as const,
};

export function usePackages() {
  return useQuery({
    queryKey: packageKeys.list(),
    queryFn: ({ signal }) => packagesService.list(signal),
  });
}

export function useCreatePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePackageInput) => packagesService.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: packageKeys.all }),
  });
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { type: PackageType; input: UpdatePackageInput }) =>
      packagesService.update(vars.type, vars.input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: packageKeys.all }),
  });
}

export function useDeletePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (type: PackageType) => packagesService.remove(type),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: packageKeys.all }),
  });
}
