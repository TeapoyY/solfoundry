import React from 'react';

/** Shimmer skeleton base */
function Skeleton({ className }: { className: string }) {
  return (
    <div
      className={`rounded-md bg-gradient-to-r from-forge-800 via-forge-700 to-forge-800 bg-[length:200%_100%] animate-shimmer ${className}`}
    />
  );
}

/** Matches BountyCard layout */
export function BountyCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-forge-900 p-5">
      {/* Repo + tier row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className="w-28 h-3" />
        </div>
        <Skeleton className="w-8 h-4 rounded-full" />
      </div>

      {/* Title — 2 lines */}
      <div className="mt-3 space-y-2">
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-3/4 h-4" />
      </div>

      {/* Language dots */}
      <div className="flex items-center gap-3 mt-3">
        <Skeleton className="w-16 h-3 rounded-full" />
        <Skeleton className="w-14 h-3 rounded-full" />
        <Skeleton className="w-12 h-3 rounded-full" />
      </div>

      {/* Separator */}
      <div className="mt-4 border-t border-border/50" />

      {/* Reward + meta */}
      <div className="flex items-center justify-between mt-3">
        <Skeleton className="w-24 h-6 rounded" />
        <div className="flex items-center gap-3">
          <Skeleton className="w-14 h-3 rounded" />
          <Skeleton className="w-12 h-3 rounded" />
        </div>
      </div>

      {/* Status badge */}
      <div className="absolute bottom-4 right-5">
        <div className="flex items-center gap-1">
          <Skeleton className="w-1.5 h-1.5 rounded-full" />
          <Skeleton className="w-12 h-3 rounded" />
        </div>
      </div>
    </div>
  );
}

/** Matches PodiumCards layout (gold/silver/bronze layout) */
export function PodiumCardsSkeleton() {
  return (
    <div className="flex items-end justify-center gap-4 md:gap-6 mb-12">
      {/* Silver */}
      <div className="hidden sm:flex flex-col items-center py-6 px-6 rounded-xl border border-border bg-forge-900 min-w-[140px] h-36" />
      {/* Gold */}
      <div className="flex flex-col items-center py-8 px-6 rounded-xl border border-yellow-500/30 bg-forge-900 min-w-[140px] h-44">
        <Skeleton className="w-3 h-3 rounded-full mb-1" />
        <Skeleton className="w-12 h-12 rounded-full mt-2" />
        <Skeleton className="w-24 h-3 mt-3 rounded" />
        <Skeleton className="w-16 h-2 mt-1 rounded" />
        <Skeleton className="w-20 h-5 mt-1 rounded" />
      </div>
      {/* Bronze */}
      <div className="hidden sm:flex flex-col items-center py-6 px-6 rounded-xl border border-orange-600/30 bg-forge-900 min-w-[140px] h-36" />
    </div>
  );
}

/** Matches LeaderboardTable row layout */
export function LeaderboardRowSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div className="flex items-center px-4 py-3 border-b border-border/30">
      <div className="w-[60px] flex justify-center">
        <Skeleton className="w-6 h-3 rounded" />
      </div>
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <Skeleton className="w-24 h-3 rounded" />
          <div className="flex items-center gap-1 mt-0.5">
            <Skeleton className="w-2.5 h-2.5 rounded-full" />
            <Skeleton className="w-2.5 h-2.5 rounded-full" />
          </div>
        </div>
      </div>
      <div className="w-[100px] flex justify-center">
        <Skeleton className="w-8 h-3 rounded" />
      </div>
      <div className="w-[120px] flex justify-end">
        <Skeleton className="w-16 h-3 rounded" />
      </div>
      <div className="w-[80px] hidden sm:flex justify-center">
        <Skeleton className="w-10 h-3 rounded" />
      </div>
    </div>
  );
}
