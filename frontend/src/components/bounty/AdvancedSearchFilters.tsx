import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Save, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AdvancedFilters {
  skills: string[];
  tiers: string[];
  domains: string[];
  rewardMin: number;
  rewardMax: number;
  search: string;
}

export interface SavedFilterSet {
  name: string;
  filters: AdvancedFilters;
}

const ALL_SKILLS = ['TypeScript', 'JavaScript', 'Rust', 'Solidity', 'Python', 'Go', 'Java', 'C++', 'C#', 'Ruby', 'Swift', 'Kotlin', 'PHP'];
const ALL_TIERS = ['T1', 'T2', 'T3'];
const ALL_DOMAINS = ['frontend', 'backend', 'agent', 'integration', 'creative', 'docs', 'security'];

const REWARD_PRESETS = [
  { label: 'Any', min: 0, max: Infinity },
  { label: '< 50K', min: 0, max: 50000 },
  { label: '50K–200K', min: 50000, max: 200000 },
  { label: '200K–500K', min: 200000, max: 500000 },
  { label: '500K+', min: 500000, max: Infinity },
];

const DEFAULT_FILTERS: AdvancedFilters = {
  skills: [],
  tiers: [],
  domains: [],
  rewardMin: 0,
  rewardMax: Infinity,
  search: '',
};

const STORAGE_KEY = 'solfoundry_advanced_filters';
const SAVED_SETS_KEY = 'solfoundry_saved_filter_sets';

function loadFilters(): AdvancedFilters {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_FILTERS,
        ...parsed,
        rewardMin: parsed.rewardMin ?? 0,
        rewardMax: parsed.rewardMax ?? Infinity,
      };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_FILTERS };
}

function loadSavedSets(): SavedFilterSet[] {
  try {
    const stored = localStorage.getItem(SAVED_SETS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  colorClass?: string;
}

function MultiSelect({ label, options, selected, onChange, colorClass = 'bg-forge-700 text-text-primary' }: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-border transition-colors duration-150 hover:border-border-hover ${selected.length > 0 ? colorClass : 'text-text-secondary bg-forge-800'}`}
      >
        {label}
        {selected.length > 0 && <span className="ml-0.5 text-xs opacity-75">({selected.length})</span>}
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1.5 z-20 bg-forge-800 border border-border-hover rounded-xl shadow-xl p-2 min-w-[160px]"
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors duration-100 ${selected.includes(opt) ? 'bg-emerald/15 text-emerald font-medium' : 'text-text-secondary hover:bg-forge-700 hover:text-text-primary'}`}
              >
                {selected.includes(opt) && <span className="mr-1.5">✓</span>}{opt}
              </button>
            ))}
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-secondary mt-1 border-t border-border/50 pt-2"
              >
                Clear {label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface Props {
  filters: AdvancedFilters;
  onChange: (filters: AdvancedFilters) => void;
  onSearch: (searchText: string) => void;
}

export function AdvancedSearchFilters({ filters, onChange, onSearch }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [savedSets, setSavedSets] = useState<SavedFilterSet[]>(() => loadSavedSets);
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  // Persist filters to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch { /* ignore */ }
  }, [filters]);

  const update = useCallback(
    (patch: Partial<AdvancedFilters>) => onChange({ ...filters, ...patch }),
    [filters, onChange]
  );

  const reset = useCallback(() => {
    onChange({ ...DEFAULT_FILTERS });
    onSearch('');
  }, [onChange, onSearch]);

  const saveFilterSet = () => {
    if (!saveName.trim()) return;
    const newSet: SavedFilterSet = { name: saveName.trim(), filters: { ...filters } };
    const updated = [...savedSets.filter((s) => s.name !== saveName.trim()), newSet];
    setSavedSets(updated);
    try { localStorage.setItem(SAVED_SETS_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
    setSaveName('');
    setShowSaveInput(false);
  };

  const loadFilterSet = (set: SavedFilterSet) => {
    onChange({ ...set.filters });
    if (set.filters.search) onSearch(set.filters.search);
  };

  const deleteFilterSet = (name: string) => {
    const updated = savedSets.filter((s) => s.name !== name);
    setSavedSets(updated);
    try { localStorage.setItem(SAVED_SETS_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  };

  const activePreset = REWARD_PRESETS.find(
    (p) => filters.rewardMin === p.min && filters.rewardMax === p.max
  );

  const hasActiveFilters =
    filters.skills.length > 0 ||
    filters.tiers.length > 0 ||
    filters.domains.length > 0 ||
    filters.rewardMin > 0 ||
    filters.rewardMax < Infinity ||
    filters.search !== '';

  return (
    <div className="mb-6">
      {/* Collapsed bar — always visible */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Text search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => { update({ search: e.target.value }); onSearch(e.target.value); }}
            placeholder="Search bounties..."
            className="w-full bg-forge-800 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-emerald outline-none transition-colors"
          />
        </div>

        {/* Quick filter pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <MultiSelect label="Language" options={ALL_SKILLS} selected={filters.skills} onChange={(skills) => update({ skills })} />
          <MultiSelect label="Tier" options={ALL_TIERS} selected={filters.tiers} onChange={(tiers) => update({ tiers })} />
          <MultiSelect label="Domain" options={ALL_DOMAINS} selected={filters.domains} onChange={(domains) => update({ domains })} />
        </div>

        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors duration-150 ${expanded ? 'border-emerald text-emerald bg-emerald/10' : 'border-border text-text-secondary hover:border-border-hover bg-forge-800'}`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Reward Range
          {activePreset && <span className="text-xs opacity-75">({activePreset.label})</span>}
        </button>

        {/* Saved filter sets */}
        {savedSets.length > 0 && (
          <div className="relative group">
            <button
              type="button"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-purple text-purple-light bg-purple/10 hover:bg-purple/20 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Saved ({savedSets.length})
            </button>
            <div className="absolute top-full right-0 mt-1.5 z-20 bg-forge-800 border border-border-hover rounded-xl shadow-xl p-2 min-w-[200px] hidden group-hover:block">
              {savedSets.map((s) => (
                <div key={s.name} className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg hover:bg-forge-700 group/save">
                  <button
                    type="button"
                    onClick={() => loadFilterSet(s)}
                    className="text-sm text-text-secondary hover:text-text-primary flex-1 text-left"
                  >
                    {s.name}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); deleteFilterSet(s.name); }}
                    className="text-xs text-text-muted hover:text-red-400 opacity-0 group-hover/save:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save current filters */}
        {showSaveInput ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Filter set name"
              className="bg-forge-800 border border-border rounded-lg px-2.5 py-1.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-emerald w-36"
              onKeyDown={(e) => { if (e.key === 'Enter') saveFilterSet(); if (e.key === 'Escape') setShowSaveInput(false); }}
              autoFocus
            />
            <button onClick={saveFilterSet} className="px-2.5 py-1.5 rounded-lg bg-emerald text-forge-950 text-sm font-semibold hover:bg-emerald/90 transition-colors">Save</button>
            <button onClick={() => setShowSaveInput(false)} className="px-2.5 py-1.5 rounded-lg border border-border text-text-muted text-sm hover:text-text-secondary transition-colors">Cancel</button>
          </div>
        ) : (
          hasActiveFilters && (
            <button
              type="button"
              onClick={() => setShowSaveInput(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-border text-text-secondary hover:border-border-hover hover:text-text-primary transition-colors bg-forge-800"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          )
        )}

        {/* Reset */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-border text-text-muted hover:text-text-secondary hover:border-border-hover transition-colors bg-forge-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Expanded reward range section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4 pb-2 border-t border-border/50 mt-4">
              {/* Preset buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-sm text-text-muted py-1.5 pr-2">Reward range:</span>
                {REWARD_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => update({ rewardMin: preset.min, rewardMax: preset.max })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors duration-150 ${activePreset?.label === preset.label ? 'border-emerald text-emerald bg-emerald/10' : 'border-border text-text-secondary hover:border-border-hover bg-forge-800'}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom range inputs */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-text-muted">Min (USDC):</label>
                  <input
                    type="number"
                    value={filters.rewardMin === Infinity ? '' : filters.rewardMin}
                    onChange={(e) => update({ rewardMin: e.target.value ? Number(e.target.value) : 0 })}
                    placeholder="0"
                    className="w-28 bg-forge-800 border border-border rounded-lg px-2.5 py-1.5 text-sm text-text-primary placeholder-text-muted focus:border-emerald outline-none"
                    min={0}
                  />
                </div>
                <span className="text-text-muted">—</span>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-text-muted">Max (USDC):</label>
                  <input
                    type="number"
                    value={filters.rewardMax === Infinity ? '' : filters.rewardMax}
                    onChange={(e) => update({ rewardMax: e.target.value ? Number(e.target.value) : Infinity })}
                    placeholder="No limit"
                    className="w-28 bg-forge-800 border border-border rounded-lg px-2.5 py-1.5 text-sm text-text-primary placeholder-text-muted focus:border-emerald outline-none"
                    min={0}
                  />
                </div>
              </div>

              {/* Active filter summary */}
              {(filters.rewardMin > 0 || filters.rewardMax < Infinity) && (
                <div className="mt-3">
                  <span className="text-xs text-text-muted">
                    Showing bounties with rewards between{' '}
                    <span className="text-emerald font-medium">
                      {filters.rewardMin.toLocaleString()} – {filters.rewardMax === Infinity ? 'unlimited' : filters.rewardMax.toLocaleString()} USDC
                    </span>
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
