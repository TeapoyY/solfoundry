import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { listActivity } from '../api/activity';
import type { ActivityEvent } from '../api/activity';

export function useActivity(autoRefresh = true) {
  const query = useQuery({
    queryKey: ['activity'],
    queryFn: listActivity,
    staleTime: 20_000,
    refetchInterval: autoRefresh ? 30_000 : false,
  });

  return query;
}

export function useActivityEvents(autoRefresh = true): ActivityEvent[] {
  const { data } = useActivity(autoRefresh);
  return data ?? [];
}
