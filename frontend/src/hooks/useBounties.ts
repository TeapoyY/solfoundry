import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { listBounties, getBounty } from '../api/bounties';
import type { BountiesListParams } from '../api/bounties';

/**
 * Single-page bounty list query with 30s stale time.
 *
 * @param params - Filter options (status, skill, tier, reward_token, query, limit, offset).
 * @returns TanStack Query result containing paginated bounty list.
 */
export function useBounties(params?: BountiesListParams) {
  return useQuery({
    queryKey: ['bounties', params],
    queryFn: () => listBounties(params),
    staleTime: 30_000,
  });
}

/**
 * Infinite-scroll bounty list query. Fetches pages of 12 bounties at a time.
 *
 * @param params - Filter options (status, skill, tier, reward_token, query).
 *                 Offset is managed internally for pagination.
 * @returns TanStack infinite query result with pages of bounties and load-more state.
 */
export function useInfiniteBounties(params?: Omit<BountiesListParams, 'offset'>) {
  return useInfiniteQuery({
    queryKey: ['bounties-infinite', params],
    queryFn: ({ pageParam = 0 }) =>
      listBounties({ ...params, offset: pageParam as number, limit: 12 }),
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((sum, p) => sum + p.items.length, 0);
      if (loaded >= lastPage.total) return undefined;
      return loaded;
    },
    initialPageParam: 0,
    staleTime: 30_000,
  });
}

/**
 * Fetch a single bounty by ID.
 *
 * @param id - The bounty UUID. Query is disabled when id is undefined.
 * @returns TanStack Query result containing the bounty object.
 */
export function useBounty(id: string | undefined) {
  return useQuery({
    queryKey: ['bounty', id],
    queryFn: () => getBounty(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}
