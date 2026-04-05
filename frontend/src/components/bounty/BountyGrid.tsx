import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Filter,
  Loader2,
  Plus,
  Bookmark,
  BookmarkCheck,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { BountyCard } from './BountyCard';
import { useInfiniteBounties } from '../../hooks/useBounties';
import { staggerContainer, staggerItem } from '../../lib/animations';
import type { BountyTier } from '../../types/bounty';

const FILTER_SKILLS = ['All', 'TypeScript', 'Rust', 'Solidity', 'Python', 'Go', 'JavaScript'];
const FILTER_TIERS: BountyTier[] = ['T1', 'T2', 'T3'];

const REWARD_PRESETS = [
  { label: 'Any', min: 0, max: Infinity },
  { label: '< 50K', min: 0, max: 50_000 },
  { label: '50K–100K', min: 50_000, max: 100_000 },
  { label: '100K–250K', min: 100_000, max: 250_000 },
  { label: '250K+', min: 250_000, max: Infinity },
];

const CATEGORY_OPTIONS = [
  'DeFi',
  'NFT',
  'Gaming',
  'Infrastructure',
  'Tooling',
  'Security',
  'DAO',
  'Cross-chain',
];

interface ActiveFilters {
  skills: string;
  tiers: BountyTier[];
  categories: string[];
  rewardMin: number;
  rewardMax: number;
  search: string;
  status: string;
}

const DEFAULT_FILTERS: ActiveFilters = {
  skills: 'All',
  tiers: [],
  categories: [],
  rewardMin: 0,
  rewardMax: Infinity,
  search: '',
  status: 'open',
};

interface SavedPreset {
  name: string;
  filters: ActiveFilters;
}

const PRESETS_KEY = 'solfoundry:bounty-filters';

function loadPresets(): SavedPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePresets(presets: SavedPreset[]) {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch {
    // ignore
  }
}

function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  colorFn,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  colorFn?: (opt: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  };

  const display =
    selected.length === 0
      ? label
      : selected.length === 1
        ? selected[0]
        : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 border ${
          selected.length > 0
            ? 'bg-emerald/10 border-emerald/30 text-emerald'
            : 'bg-forge-800 border-border text-text-secondary hover:text-text-primary hover:border-border-hover'
        }`}
      >
        {display}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 mt-1.5 z-50 bg-forge-800 border border-border rounded-xl shadow-xl shadow-black/40 py-1.5 w-48"
          >
            {options.map((opt) => {
              const checked = selected.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => toggle(opt)}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left hover:bg-forge-700 transition-colors"
                >
                  <span
                    className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border ${
                      checked
                        ? 'bg-emerald border-emerald'
                        : 'border-border'
                    }`}
                  >
                    {checked && (
                      <svg className="w-2.5 h-2.5 text-forge-950" fill="none" viewBox="0 0 12 12">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  {colorFn && (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: colorFn(opt) }}
                    />
                  )}
                  <span className="text-text-primary">{opt}</span>
                </button>
              );
            })}
            {selected.length > 0 && (
              <button
                onClick={() => onChange([])}
                className="w-full flex items-center gap-2 px-3 py-1.5 mt-1 border-t border-border text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                Clear all
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function BountyGrid() {
  const [filters, setFilters] = useState<ActiveFilters>(DEFAULT_FILTERS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>(loadPresets);
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);
  const [savePresetName, setSavePresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const presetMenuRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Close preset menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (presetMenuRef.current && !presetMenuRef.current.contains(e.target as Node)) {
        setPresetMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const params = {
    status: filters.status,
    skill: filters.skills !== 'All' ? filters.skills : undefined,
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteBounties(params);

  const allBounties = data?.pages.flatMap((p) => p.items) ?? [];

  // All unique categories seen in current bounty data
  const seenCategories = useMemo(() => {
    const cats = new Set<string>();
    allBounties.forEach((b) => {
      if (b.category) cats.add(b.category);
    });
    return cats.size > 0 ? Array.from(cats).sort() : CATEGORY_OPTIONS;
  }, [allBounties]);

  // Combined client-side filter
  const filteredBounties = useMemo(() => {
    return allBounties.filter((bounty) => {
      // Search
      if (
        debouncedSearch &&
        !bounty.title.toLowerCase().includes(debouncedSearch) &&
        !(bounty.description ?? '').toLowerCase().includes(debouncedSearch) &&
        !bounty.skills.some((s) => s.toLowerCase().includes(debouncedSearch))
      ) {
        return false;
      }

      // Tier
      if (filters.tiers.length > 0 && !filters.tiers.includes(bounty.tier)) {
        return false;
      }

      // Category / domain
      if (filters.categories.length > 0) {
        const cat = bounty.category ?? '';
        if (!filters.categories.includes(cat)) return false;
      }

      // Reward range
      if (filters.rewardMin > 0 && bounty.reward_amount < filters.rewardMin) return false;
      if (filters.rewardMax < Infinity && bounty.reward_amount > filters.rewardMax) return false;

      return true;
    });
  }, [allBounties, debouncedSearch, filters.tiers, filters.categories, filters.rewardMin, filters.rewardMax]);

  const hasActiveAdvanced =
    filters.tiers.length > 0 ||
    filters.categories.length > 0 ||
    filters.rewardMin > 0 ||
    filters.rewardMax < Infinity;

  const activeFilterCount = [
    filters.skills !== 'All',
    filters.tiers.length > 0,
    filters.categories.length > 0,
    hasActiveAdvanced,
  ].filter(Boolean).length;

  function applyPreset(preset: SavedPreset) {
    setFilters(preset.filters);
    setPresetMenuOpen(false);
  }

  function saveCurrentAsPreset() {
    if (!savePresetName.trim()) return;
    const newPreset: SavedPreset = { name: savePresetName.trim(), filters: { ...filters } };
    const updated = [...savedPresets.filter((p) => p.name !== newPreset.name), newPreset];
    setSavedPresets(updated);
    savePresets(updated);
    setSavePresetName('');
    setShowSavePreset(false);
    setPresetMenuOpen(false);
  }

  function deletePreset(name: string) {
    const updated = savedPresets.filter((p) => p.name !== name);
    setSavedPresets(updated);
    savePresets(updated);
  }

  function clearAllFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  const tierColor: Record<BountyTier, string> = { T1: '#00E676', T2: '#40C4FF', T3: '#7C3AED' };

  return (
    <section id="bounties" className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="font-sans text-2xl font-semibold text-text-primary">Open Bounties</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search bounties..."
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                className="pl-9 pr-8 py-1.5 bg-forge-800 border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-emerald outline-none transition-all duration-150 w-48 focus:w-64"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters((f) => ({ ...f, search: '' }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Advanced filters toggle */}
            <button
              onClick={() => setShowAdvanced((s) => !s)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors duration-150 ${
                showAdvanced || hasActiveAdvanced
                  ? 'bg-purple/10 border-purple/30 text-purple'
                  : 'bg-forge-800 border-border text-text-secondary hover:text-text-primary hover:border-border-hover'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {hasActiveAdvanced && (
                <span className="w-4 h-4 rounded-full bg-purple text-forge-950 text-[10px] font-bold flex items-center justify-center">
                  {[
                    filters.tiers.length > 0 ? 1 : 0,
                    filters.categories.length > 0 ? 1 : 0,
                    filters.rewardMin > 0 || filters.rewardMax < Infinity ? 1 : 0,
                  ].reduce((a, b) => a + b, 0)}
                </span>
              )}
            </button>

            {/* Status filter */}
            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                className="appearance-none bg-forge-800 border border-border rounded-lg px-3 py-1.5 pr-8 text-sm text-text-secondary font-medium focus:border-emerald outline-none transition-colors duration-150 cursor-pointer"
              >
                <option value="open">Open</option>
                <option value="funded">Funded</option>
                <option value="in_review">In Review</option>
                <option value="completed">Completed</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            </div>

            <Link
              to="/bounties/create"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald text-forge-950 font-semibold text-sm hover:bg-emerald/90 transition-colors duration-150"
            >
              <Plus className="w-4 h-4" />
              Post a Bounty
            </Link>
          </div>
        </div>

        {/* Advanced filters panel */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-forge-850 border border-border rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Tier multi-select */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Tier</span>
                    <MultiSelectDropdown
                      label="Any tier"
                      options={FILTER_TIERS}
                      selected={filters.tiers}
                      onChange={(tiers) => setFilters((f) => ({ ...f, tiers: tiers as BountyTier[] }))}
                      colorFn={(t) => tierColor[t as BountyTier]}
                    />
                  </div>

                  {/* Category multi-select */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Domain</span>
                    <MultiSelectDropdown
                      label="Any domain"
                      options={seenCategories}
                      selected={filters.categories}
                      onChange={(cats) => setFilters((f) => ({ ...f, categories: cats }))}
                    />
                  </div>

                  {/* Reward range */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Reward</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {REWARD_PRESETS.map((preset) => {
                        const active =
                          filters.rewardMin === preset.min && filters.rewardMax === preset.max;
                        return (
                          <button
                            key={preset.label}
                            onClick={() =>
                              setFilters((f) => ({
                                ...f,
                                rewardMin: preset.min,
                                rewardMax: preset.max,
                              }))
                            }
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                              active
                                ? 'bg-emerald/15 text-emerald border border-emerald/30'
                                : 'bg-forge-800 text-text-muted border border-border hover:text-text-primary hover:border-border-hover'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Clear all */}
                  {hasActiveAdvanced && (
                    <button
                      onClick={clearAllFilters}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-text-muted hover:text-status-error transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Clear
                    </button>
                  )}
                </div>

                {/* Saved filter presets row */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <Filter className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                  <span className="text-xs text-text-muted font-medium">Presets</span>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {savedPresets.map((preset) => (
                      <div key={preset.name} className="relative group">
                        <button
                          onClick={() => applyPreset(preset)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-forge-700 text-text-secondary hover:text-emerald border border-border hover:border-emerald/30 transition-colors"
                        >
                          <Bookmark className="w-3 h-3" />
                          {preset.name}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePreset(preset.name);
                          }}
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-status-error rounded-full text-forge-950 text-[8px] font-bold items-center justify-center hidden group-hover:flex"
                          aria-label={`Delete preset ${preset.name}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}

                    {showSavePreset ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Preset name"
                          value={savePresetName}
                          onChange={(e) => setSavePresetName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveCurrentAsPreset();
                            if (e.key === 'Escape') setShowSavePreset(false);
                          }}
                          className="px-2 py-1 bg-forge-800 border border-border rounded-md text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-emerald w-28"
                          autoFocus
                        />
                        <button
                          onClick={saveCurrentAsPreset}
                          className="px-2 py-1 bg-emerald text-forge-950 rounded-md text-xs font-semibold hover:bg-emerald/90 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setShowSavePreset(false)}
                          className="p-1 text-text-muted hover:text-text-primary transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowSavePreset(true)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-text-muted hover:text-emerald border border-dashed border-border hover:border-emerald/40 transition-colors"
                      >
                        <BookmarkCheck className="w-3 h-3" />
                        Save current
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter pills — skill/language */}
        <div className="flex items-center gap-2 flex-wrap mb-8">
          {FILTER_SKILLS.map((skill) => (
            <button
              key={skill}
              onClick={() => setFilters((f) => ({ ...f, skills: skill }))}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                filters.skills === skill
                  ? 'bg-forge-700 text-text-primary'
                  : 'text-text-muted hover:text-text-secondary bg-forge-800'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>

        {/* Active filter summary */}
        {hasActiveAdvanced && (
          <div className="flex items-center gap-2 flex-wrap mb-4 text-xs text-text-muted">
            <span>Showing</span>
            <span className="text-text-primary font-medium">{filteredBounties.length}</span>
            <span>of {allBounties.length} bounties</span>
            {filters.tiers.length > 0 && (
              <>
                <span>·</span>
                <span>Tier: {filters.tiers.join(', ')}</span>
              </>
            )}
            {filters.categories.length > 0 && (
              <>
                <span>·</span>
                <span>Domain: {filters.categories.join(', ')}</span>
              </>
            )}
            {filters.rewardMin > 0 || filters.rewardMax < Infinity ? (
              <>
                <span>·</span>
                <span>
                  Reward: {filters.rewardMin === 0 ? '<' : `${(filters.rewardMin / 1000).toFixed(0)}K–`}
                  {filters.rewardMax === Infinity ? '250K+' : `${(filters.rewardMax / 1000).toFixed(0)}K`}
                </span>
              </>
            ) : null}
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
        {!isLoading && !isError && filteredBounties.length === 0 && (
          <div className="text-center py-16">
            <p className="text-text-muted text-lg mb-2">
              {debouncedSearch || hasActiveAdvanced
                ? 'No bounties match your filters'
                : 'No bounties found'}
            </p>
            <p className="text-text-muted text-sm">
              {debouncedSearch || hasActiveAdvanced
                ? 'Try adjusting your search or clearing some filters.'
                : filters.skills !== 'All'
                  ? 'Try a different language filter.'
                  : 'Check back soon for new bounties.'}
            </p>
            {(debouncedSearch || hasActiveAdvanced) && (
              <button
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 rounded-lg border border-border text-text-secondary text-sm hover:text-text-primary hover:border-border-hover transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Bounty grid */}
        {!isLoading && filteredBounties.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filteredBounties.map((bounty) => (
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
