import { useCallback, useState } from "react";

/**
 * Pull-to-refresh helper for React Query screens. Pass the query `refetch`
 * function(s); returns `refreshing` + `onRefresh` for a <RefreshControl>.
 *
 *   const { refreshing, onRefresh } = useRefresh(refetch);
 *   const { refreshing, onRefresh } = useRefresh([refetchA, refetchB]);
 */
export function useRefresh(
  refetch: (() => Promise<unknown>) | (() => Promise<unknown>)[],
) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    const fns = Array.isArray(refetch) ? refetch : [refetch];
    setRefreshing(true);
    try {
      await Promise.all(fns.map((fn) => fn()));
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return { refreshing, onRefresh };
}
