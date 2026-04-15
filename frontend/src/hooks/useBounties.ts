import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { listBounties, getBounty } from '../api/bounties';
import type { BountiesListParams } from '../api/bounties';

/**
 * React Query hook for fetching a paginated list of bounties.
 *
 * @param params - Optional filter/sort parameters (status, skill, search, etc.)
 * @returns TanStack Query result containing the bounty list and metadata.
 */
export function useBounties(params?: BountiesListParams) {
  return useQuery({
    queryKey: ['bounties', params],
    queryFn: () => listBounties(params),
    staleTime: 30_000,
  });
}

/**
 * React Query hook for infinite-scroll pagination of bounties.
 * Loads pages of 12 bounties at a time as the user scrolls.
 *
 * @param params - Optional filter/sort parameters (status, skill, search, etc.).
 *                 Offset is managed internally by the hook.
 * @returns Infinite query result with fetchNextPage and hasNextPage.
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
 * React Query hook for fetching a single bounty by ID.
 *
 * @param id - The bounty UUID. Query is disabled if undefined.
 * @returns TanStack Query result for the single bounty.
 */
export function useBounty(id: string | undefined) {
  return useQuery({
    queryKey: ['bounty', id],
    queryFn: () => getBounty(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}
