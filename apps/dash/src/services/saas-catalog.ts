import { useQuery } from "@tanstack/react-query";

import { useClient } from "@/lib/client";

/** Matches API `SAAS_CATALOG_SEARCH_MIN_LEN` — dropdown/search only after this many letters. */
export const SAAS_NAME_SEARCH_MIN_CHARS = 2;

export type SaasCatalogHit = { id: string; name: string };

export const saasCatalogKeys = {
  all: ["saas-catalog"] as const,
  names: (query: string) => [...saasCatalogKeys.all, "names", query] as const,
};

/**
 * Debounced `query` should be passed from the caller (e.g. `useDebouncedValue`).
 * Query is disabled until trimmed length is at least `SAAS_NAME_SEARCH_MIN_CHARS`.
 */
export function useSaasCatalogNameSearch(debouncedQuery: string) {
  const client = useClient();
  const q = debouncedQuery.trim();
  const enabled = q.length >= SAAS_NAME_SEARCH_MIN_CHARS;

  return useQuery({
    queryKey: saasCatalogKeys.names(q),
    queryFn: async () => {
      const res = await client
        .get("saas/all", {
          searchParams: { query: q },
        })
        .json<{ saas: SaasCatalogHit[] }>();
      return res.saas;
    },
    enabled,
    staleTime: 60_000,
  });
}
