import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`rounded-md bg-gradient-to-r from-forge-900 via-forge-800 to-forge-900 bg-[length:200%_100%] animate-shimmer ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-forge-900 p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

/** Skeleton matching the BountyCard layout */
export function SkeletonBountyCard() {
  return (
    <div className="rounded-xl border border-border bg-forge-900 p-5">
      {/* Row 1: repo + tier badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>

      {/* Row 2: title */}
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>

      {/* Row 3: language dots */}
      <div className="flex items-center gap-3 mt-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>

      {/* Separator */}
      <div className="mt-4 border-t border-border/50" />

      {/* Row 4: reward + meta */}
      <div className="flex items-center justify-between mt-3">
        <Skeleton className="h-6 w-24" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

/** Skeleton matching the LeaderboardTable row layout */
export function SkeletonLeaderboardRow() {
  return (
    <div className="flex items-center px-4 py-3 border-b border-border/30">
      <div className="w-[60px] flex justify-center">
        <Skeleton className="w-6 h-4" />
      </div>
      <div className="flex-1 flex items-center gap-3">
        <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-1">
            <Skeleton className="w-2.5 h-2.5 rounded-full" />
            <Skeleton className="w-2.5 h-2.5 rounded-full" />
            <Skeleton className="w-2.5 h-2.5 rounded-full" />
          </div>
        </div>
      </div>
      <div className="w-[100px] flex justify-center">
        <Skeleton className="h-4 w-8" />
      </div>
      <div className="w-[120px] flex justify-end">
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="w-[80px] flex justify-center hidden sm:block">
        <Skeleton className="h-4 w-10" />
      </div>
    </div>
  );
}

/** Skeleton matching the PodiumCard layout */
export function SkeletonPodiumCard({ rank }: { rank: 1 | 2 | 3 }) {
  const height = rank === 1 ? 'h-48' : 'h-40';
  const width = rank === 1 ? 'w-36' : 'w-32';
  return (
    <div className={`flex flex-col items-center rounded-xl border border-border bg-forge-900 ${height} ${width} p-4 justify-center`}>
      <Skeleton className="w-12 h-12 rounded-full mb-3" />
      <Skeleton className="h-4 w-20 mb-2" />
      <Skeleton className="h-3 w-16 mb-1" />
      <Skeleton className="h-5 w-20" />
    </div>
  );
}

/** Skeleton matching the ProfileDashboard MyBounties row */
export function SkeletonProfileRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-forge-900 border border-border">
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-4 w-12" />
    </div>
  );
}

/** Skounty detail page skeleton */
export function SkeletonBountyDetail() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Back link */}
      <Skeleton className="h-4 w-32" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title + meta */}
          <div className="rounded-xl border border-border bg-forge-900 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded-full" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-4/5" />
            <div className="flex items-center gap-3 pt-2">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
            <div className="space-y-2 pt-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>

          {/* Requirements */}
          <div className="rounded-xl border border-border bg-forge-900 p-6 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>

          {/* Submit form */}
          <div className="rounded-xl border border-border bg-forge-900 p-6 space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Reward card */}
          <div className="rounded-xl border border-emerald-border bg-emerald-bg/50 p-5">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-8 w-32" />
          </div>

          {/* Info card */}
          <div className="rounded-xl border border-border bg-forge-900 p-5 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
