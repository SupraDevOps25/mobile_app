import { http } from "@/services/api";
import type {
  CreatePackageInput,
  Package,
  PackageType,
  UpdatePackageInput,
} from "./packages.types";

export const packagesService = {
  list: (signal?: AbortSignal) =>
    http.get<Package[]>("/admin/packages", signal),

  create: (input: CreatePackageInput) =>
    http.post<Package>("/admin/packages", input),

  update: (type: PackageType, input: UpdatePackageInput) =>
    http.patch<Package>(`/admin/packages/${type}`, input),

  remove: (type: PackageType) =>
    http.del<{ deleted: boolean; type: PackageType }>(
      `/admin/packages/${type}`,
    ),
};
