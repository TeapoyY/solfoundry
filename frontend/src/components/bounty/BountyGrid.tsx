import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, Loader2, Plus, Search, X } from 'lucide-react';
import { BountyCard } from './BountyCard';
import { useInfiniteBounties } from '../../hooks/useBounties';
import { staggerContainer, staggerItem } from '../../lib/animations';

const FILTER_SKILLS = ['All', 'TypeScript', 'Rust', 'Solidity', 'Python', 'Go', 'JavaScript'];
const FILTER_TIERS = ['All Tiers', 'T1', 'T2', 'T3'];

/** Debounce hook — returns debounced value after `delay` ms */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function BountyGrid() {
  const [activeSkill, setActiveSkill] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [tierFilter, setTierFilter] = useState<string>('All Tiers');

  // Search state
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  // Reward range state
  const [rewardMin, setRewardMin] = useState('');
  const [rewardMax, setRewardMax] = useState('');
  const [showRewardFilters, setShowRewardFilters] = useState(false);

  // Clear all filters
  const clearFilters = () => {
    setActiveSkill('All');
    setTierFilter('All Tiers');
    setSearchInput('');
    setRewardMin('');
    setRewardMax('');
    setShowRewardFilters(false);
  };

  const params = useMemo(() => ({
    status: statusFilter,
    skill: activeSkill !== 'All' ? activeSkill : undefined,
    tier: tierFilter !== 'All Tiers' ? tierFilter : undefined,
    q: debouncedSearch.trim() || undefined,
    reward_min: rewardMin ? Number(rewardMin) : undefined,
    reward_max: rewardMax ? Number(rewardMax) : undefined,
  }), [statusFilter, activeSkill, tierFilter, debouncedSearch, rewardMin, rewardMax]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteBounties(params);

  const allBounties = data?.pages.flatMap((p) => p.items) ?? [];

  const hasActiveFilters =
    activeSkill !== 'All' ||
    tierFilter !== 'All Tiers' ||
    searchInput.trim() !== '' ||
    rewardMin !== '' ||
    rewardMax !== '';

  return (
    <section id="bounties" className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="font-sans text-2xl font-semibold text-text-primary">Open Bounties</h2>
          <div className="flex items-center gap-2">
            <Link
              to="/bounties/create"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald text-forge-950 font-semibold text-sm hover:bg-emerald/90 transition-colors duration-150"
            >
              <Plus className="w-4 h-4" />
              Post a Bounty
            </Link>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search bounties by keyword..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-forge-800 border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-emerald focus:ring-1 focus:ring-emerald outline-none transition-colors duration-150"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Status select */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-forge-800 border border-border rounded-lg px-3 py-1.5 pr-7 text-sm text-text-secondary font-medium focus:border-emerald outline-none transition-colors duration-150 cursor-pointer"
            >
              <option value="open">Status: Open</option>
              <option value="funded">Status: Funded</option>
              <option value="in_review">Status: In Review</option>
              <option value="completed">Status: Completed</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          </div>

          {/* Tier select */}
          <div className="relative">
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="appearance-none bg-forge-800 border border-border rounded-lg px-3 py-1.5 pr-7 text-sm text-text-secondary font-medium focus:border-emerald outline-none transition-colors duration-150 cursor-pointer"
            >
              {FILTER_TIERS.map((t) => (
                <option key={t} value={t}>{t === 'All Tiers' ? 'Tier: All' : `Tier: ${t}`}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          </div>

          {/* Reward range toggle */}
          <button
            onClick={() => setShowRewardFilters((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors duration-150 ${
              showRewardFilters || rewardMin || rewardMax
                ? 'bg-forge-700 border-emerald text-text-primary'
                : 'bg-forge-800 border-border text-text-secondary hover:border-border-hover'
            }`}
          >
            Reward Range
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${showRewardFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Clear all */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-text-muted hover:text-text-secondary transition-colors duration-150"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Reward range inputs (collapsible) */}
        {showRewardFilters && (
          <div className="flex items-center gap-2 mb-6 p-3 bg-forge-800 border border-border rounded-lg">
            <span className="text-xs text-text-muted font-medium">$</span>
            <input
              type="number"
              placeholder="Min"
              value={rewardMin}
              onChange={(e) => setRewardMin(e.target.value)}
              className="w-24 bg-forge-700 border border-border rounded-md px-2.5 py-1.5 text-sm text-text-primary placeholder-text-muted focus:border-emerald outline-none transition-colors duration-150"
              min="0"
            />
            <span className="text-xs text-text-muted">to</span>
            <span className="text-xs text-text-muted font-medium">$</span>
            <input
              type="number"
              placeholder="Max"
              value={rewardMax}
              onChange={(e) => setRewardMax(e.target.value)}
              className="w-24 bg-forge-700 border border-border rounded-md px-2.5 py-1.5 text-sm text-text-primary placeholder-text-muted focus:border-emerald outline-none transition-colors duration-150"
              min="0"
            />
            {(rewardMin || rewardMax) && (
              <button
                onClick={() => { setRewardMin(''); setRewardMax(''); }}
                className="text-text-muted hover:text-text-secondary transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Filter pills — skills */}
        <div className="flex items-center gap-2 flex-wrap mb-8">
          {FILTER_SKILLS.map((skill) => (
            <button
              key={skill}
              onClick={() => setActiveSkill(skill)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                activeSkill === skill
                  ? 'bg-forge-700 text-text-primary'
                  : 'text-text-muted hover:text-text-secondary bg-forge-800'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>

        {/* Active filter summary */}
        {hasActiveFilters && (
          <div className="mb-4 text-xs text-text-muted">
            Showing results for{searchInput.trim() ? ` "${searchInput.trim()}"` : ''}
            {tierFilter !== 'All Tiers' ? ` · Tier: ${tierFilter}` : ''}
            {rewardMin || rewardMax ? ` · Reward: $${rewardMin || '0'}–$${rewardMax || '∞'}` : ''}
            {activeSkill !== 'All' ? ` · Skill: ${activeSkill}` : ''}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-52 rounded-xl border border-border bg-forge-900 overflow-hidden"
              >
                <div className="h-full bg-gradient-to-r from-forge-900 via-forge-800 to-forge-900 bg-[length:200%_100%] animate-shimmer" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <div className="text-center py-16">
            <p className="text-text-muted mb-4">Could not load bounties. Backend may be offline.</p>
            <p className="text-text-muted text-sm font-mono">Running in demo mode — no bounties to display.</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && allBounties.length === 0 && (
          <div className="text-center py-16">
            <p className="text-text-muted text-lg mb-2">No bounties found</p>
            <p className="text-text-muted text-sm">
              {hasActiveFilters ? 'Try adjusting your filters.' : 'Check back soon for new bounties.'}
            </p>
          </div>
        )}

        {/* Bounty grid */}
        {!isLoading && allBounties.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {allBounties.map((bounty) => (
              <motion.div key={bounty.id} variants={staggerItem}>
                <BountyCard bounty={bounty} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Load more */}
        {hasNextPage && (
          <div className="mt-10 text-center">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border text-text-secondary text-sm font-medium hover:border-border-hover hover:text-text-primary transition-all duration-200 disabled:opacity-50"
            >
              {isFetchingNextPage && <Loader2 className="w-4 h-4 animate-spin" />}
              Load More
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
