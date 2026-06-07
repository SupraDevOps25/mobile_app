import { useQuery } from "@tanstack/react-query";
import { CAREGIVER_DETAILS, type CaregiverDetail } from "@/constants/mock-data";
import { caregiverService } from "@/services/caregiver.service";
import { apiToCaregiverDetail } from "@/utils/caregiver-mapper";

/**
 * Resolves a caregiver by id — works for both mock IDs ("1", "2") and
 * real database profileIds (UUIDs).
 *
 * - Mock ID  → returns immediately from local mock data, no API call.
 * - Real UUID → fetches from GET /caregivers/:profileId and maps to
 *               CaregiverDetail format with safe defaults for schema fields
 *               not yet stored in the DB.
 */
export function useCaregiver(id: string | undefined) {
  const mock = id ? CAREGIVER_DETAILS[id] : undefined;

  return useQuery<CaregiverDetail>({
    queryKey: ["caregiver", id],
    queryFn: async () => {
      // Fast path: mock data available (e.g. testing with ids "1"–"4")
      if (mock) return mock;
      const api = await caregiverService.getOne(id!);
      return apiToCaregiverDetail(api);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
