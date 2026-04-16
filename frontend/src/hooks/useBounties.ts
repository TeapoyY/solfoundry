import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { listBounties, getBounty } from '../api/bounties';
import type { BountiesListParams } from '../api/bounties';

/**
 * Fetch a single page of bounties with the given filter parameters.
 * Results are cached for 30 seconds.
 */
export function useBounties(params?: BountiesListParams) {
  return useQuery({
    queryKey: ['bounties', params],
    queryFn: () => listBounties(params),
    staleTime: 30_000,
  });
}

/**
 * Infinite-scroll variant of useBounties.
 * Loads pages of 12 bounties at a time and exposes fetchNextPage for manual pagination.
 * Accepts the same filter params as useBounties (offset is managed internally).
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
 * Fetch a single bounty by its ID.
 * Query is disabled when id is undefined (avoids spurious requests).
 */
export function useBounty(id: string | undefined) {
  return useQuery({
    queryKey: ['bounty', id],
    queryFn: () => getBounty(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}
