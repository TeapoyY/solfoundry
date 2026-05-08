import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { listBounties, getBounty } from '../api/bounties';
import type { BountiesListParams } from '../api/bounties';

/**
 * Fetches a paginated list of bounties with optional filters.
 * @param params - Optional filter params (status, skill, tier, etc.)
 */
export function useBounties(params?: BountiesListParams) {
  return useQuery({
    queryKey: ['bounties', params],
    queryFn: () => listBounties(params),
    staleTime: 30_000,
  });
}

/**
 * Fetches an infinite-scrollable list of bounties with optional filters and search.
 * Pagination is disabled when a search query is active to avoid conflicting server-side results.
 * @param params - Filter params including optional `query` for server-side search
 */
export function useInfiniteBounties(params?: Omit<BountiesListParams, 'offset'> & { query?: string }) {
  return useInfiniteQuery({
    queryKey: ['bounties-infinite', params],
    queryFn: ({ pageParam = 0 }) =>
      listBounties({ ...params, offset: pageParam as number, limit: 12 }),
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((sum, p) => sum + p.items.length, 0);
      if (loaded >= (lastPage.total ?? 0)) return undefined;
      return loaded;
    },
    initialPageParam: 0,
    staleTime: 30_000,
  });
}

/**
 * Fetches a single bounty by its ID.
 * @param id - The bounty UUID; query is disabled when undefined
 */
export function useBounty(id: string | undefined) {
  return useQuery({
    queryKey: ['bounty', id],
    queryFn: () => getBounty(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}
