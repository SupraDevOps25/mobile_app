import { useMutation, useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { packageService, type ApiPackageType } from "@/services/package.service";

export function usePackages() {
  return useQuery({
    queryKey: qk.packages,
    queryFn: () => packageService.list(),
  });
}

export function usePackage(type: ApiPackageType | undefined) {
  return useQuery({
    queryKey: qk.package(type ?? ""),
    queryFn: () => packageService.get(type as ApiPackageType),
    enabled: !!type,
  });
}

// Family: submit a free-text "no package fits" request (emailed to admins).
export function useRequestCustomPackage() {
  return useMutation({
    mutationFn: (message: string) => packageService.requestCustom(message),
  });
}
