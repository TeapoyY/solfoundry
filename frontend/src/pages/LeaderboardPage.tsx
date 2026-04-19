import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '../components/layout/PageLayout';
import { PodiumCards } from '../components/leaderboard/PodiumCards';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import { SkeletonPodiumCard, SkeletonLeaderboardRow, Skeleton } from '../components/Skeleton';
import { useLeaderboard } from '../hooks/useLeaderboard';
import type { TimePeriod } from '../types/leaderboard';
import { fadeIn } from '../lib/animations';

const PERIODS: { label: string; value: TimePeriod }[] = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: 'All', value: 'all' },
];

export function LeaderboardPage() {
  const [period, setPeriod] = useState<TimePeriod>('all');
  const { data: entries = [], isLoading, isError } = useLeaderboard(period);

  return (
    <PageLayout>
      <motion.div variants={fadeIn} initial="initial" animate="animate" className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold text-text-primary mb-3">Leaderboard</h1>
          <p className="text-text-secondary">Top contributors ranked by bounties completed</p>
        </div>

        {/* Time filter */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-forge-800">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                  period === p.value
                    ? 'bg-forge-700 text-text-primary'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <>
            {/* Skeleton podium */}
            <div className="flex items-end justify-center gap-4 md:gap-6 mb-12">
              <SkeletonPodiumCard rank={2} />
              <SkeletonPodiumCard rank={1} />
              <SkeletonPodiumCard rank={3} />
            </div>
            {/* Skeleton table */}
            <div className="max-w-4xl mx-auto mt-6 rounded-xl border border-border bg-forge-900 overflow-hidden">
              <div className="flex items-center px-4 py-3 border-b border-border/50">
                <div className="w-[60px] text-center"><Skeleton className="h-3 w-6 mx-auto" /></div>
                <div className="flex-1"><Skeleton className="h-3 w-20" /></div>
                <div className="w-[100px] text-center"><Skeleton className="h-3 w-12 mx-auto" /></div>
                <div className="w-[120px] text-right"><Skeleton className="h-3 w-16 mx-auto" /></div>
                <div className="w-[80px] text-center hidden sm:block"><Skeleton className="h-3 w-10 mx-auto" /></div>
              </div>
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonLeaderboardRow key={i} />
              ))}
            </div>
          </>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="text-center py-12">
            <p className="text-text-muted">Could not load leaderboard data.</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && entries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-text-muted">No contributors ranked yet for this period.</p>
          </div>
        )}

        {/* Podium + table */}
        {!isLoading && entries.length > 0 && (
          <>
            <PodiumCards entries={entries} />
            {entries.length > 3 && <LeaderboardTable entries={entries} />}
          </>
        )}
      </motion.div>
    </PageLayout>
  );
}
