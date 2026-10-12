import React, { useState, useRef, useEffect } from 'react';
import {
  Filter,
  X,
  ChevronDown,
  PlusCircle,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { FilterOptions, ActiveFilters } from '../types.ts';

interface FilterBarProps {
  filterOptions: FilterOptions;
  activeFilters: ActiveFilters;
  onFilterToggle: (key: keyof ActiveFilters, value: string) => void;
  onSelectAllCategory: (key: keyof ActiveFilters, options: string[]) => void;
  onClearCategory: (key: keyof ActiveFilters) => void;
  onClearFilters: () => void;
  onNavigateToAdd: () => void;
  totalResults: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterOptions,
  activeFilters,
  onFilterToggle,
  onSelectAllCategory,
  onClearCategory,
  onClearFilters,
  onNavigateToAdd,
  totalResults,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Total count of all selected tags across all categories
  const totalActiveTagsCount = Object.values(activeFilters).reduce(
    (acc, curr) => acc + curr.length,
    0
  );

  const toggleDropdown = (key: string) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };

  const renderDropdown = (
    label: string,
    key: keyof ActiveFilters,
    options: string[],
    placeholderAll: string = 'All'
  ) => {
    const currentValues = activeFilters[key] || [];
    const isOpen = openDropdown === key;
    const count = currentValues.length;
    const hasSelected = count > 0;

    let displayLabel = placeholderAll;
    if (count === 1) {
      displayLabel = currentValues[0];
    } else if (count > 1) {
      displayLabel = `${count} selected`;
    }

    return (
      <div className="relative inline-block text-left">
        <button
          type="button"
          onClick={() => toggleDropdown(key)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
            hasSelected
              ? 'bg-cyan-50 text-cyan-950 border-cyan-500/80 shadow-xs ring-1 ring-cyan-500/30 dark:bg-cyan-950/50 dark:border-cyan-400/70 dark:text-cyan-300 dark:shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-900 shadow-2xs dark:bg-[#0e0e1a] dark:hover:bg-[#151528] dark:border-purple-900/40 dark:text-zinc-300 dark:hover:text-white'
          }`}
        >
          <span className="capitalize opacity-80">{label}:</span>
          <span className="font-semibold truncate max-w-[110px] capitalize">
            {displayLabel}
          </span>
          {count > 1 && (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-bold text-[10px] leading-tight shadow-xs">
              {count}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${
              isOpen
                ? 'rotate-180 text-cyan-600 dark:text-cyan-400'
                : 'text-slate-400 dark:text-zinc-400'
            }`}
          />
        </button>

        {isOpen && (
          <div
            className="absolute left-0 mt-1.5 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 py-2.5 max-h-72 overflow-y-auto backdrop-blur-xl dark:bg-[#090914]/95 dark:border-purple-800/50 dark:shadow-2xl dark:shadow-cyan-950/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Quick Actions */}
            <div className="px-3.5 pb-2 flex items-center justify-between border-b border-slate-200 dark:border-purple-900/30 text-[11px]">
              <span className="font-semibold text-purple-900 dark:text-purple-300">
                {count > 0 ? `${count} of ${options.length} selected` : `Filter by ${label}`}
              </span>
              <div className="flex items-center gap-2">
                {count < options.length && options.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onSelectAllCategory(key, options)}
                    className="text-cyan-700 hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300 font-semibold hover:underline text-[11px] cursor-pointer"
                  >
                    Select all
                  </button>
                )}
                {count > 0 && (
                  <button
                    type="button"
                    onClick={() => onClearCategory(key)}
                    className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-semibold hover:underline text-[11px] cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Checkbox Options List */}
            <div className="pt-1.5">
              {options.length === 0 ? (
                <div className="px-3.5 py-2.5 text-xs text-slate-400 dark:text-zinc-500 italic">
                  No database records found
                </div>
              ) : (
                options.map((opt) => {
                  const isChecked = currentValues.some(
                    (v) => v.toLowerCase() === opt.toLowerCase()
                  );
                  return (
                    <label
                      key={opt}
                      onClick={() => onFilterToggle(key, opt)}
                      className={`w-full px-3.5 py-2 text-xs flex items-center gap-2.5 cursor-pointer transition-colors select-none ${
                        isChecked
                          ? 'text-cyan-950 bg-cyan-50 font-semibold dark:text-cyan-300 dark:bg-cyan-950/30'
                          : 'text-slate-700 hover:bg-purple-50/70 dark:text-zinc-300 dark:hover:bg-purple-950/40'
                      }`}
                    >
                      {/* Checkbox Box with Cyan / Purple Theme */}
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-all border ${
                          isChecked
                            ? 'bg-gradient-to-br from-cyan-500 to-purple-600 border-cyan-500 text-white shadow-xs dark:shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                            : 'border-slate-300 bg-slate-50 dark:border-purple-800/60 dark:bg-[#121222]'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <span className="truncate capitalize flex-1">{opt}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="bg-slate-100/90 dark:bg-[#07070e]/85 border-b border-slate-200 dark:border-cyan-950/60 py-4 px-4 sm:px-8 transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        {/* Filter buttons group */}
        <div className="flex items-center flex-wrap gap-2 flex-1">
          <div className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-400 text-xs font-semibold mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="text-slate-600 dark:text-zinc-400">Filters:</span>
          </div>

          {/* 1. Subject */}
          {renderDropdown('Subject', 'subject', filterOptions.subjects)}

          {/* 2. Style */}
          {renderDropdown('Style', 'style', filterOptions.styles)}

          {/* 3. Modern / Traditional */}
          {renderDropdown(
            'Era',
            'modern_traditional',
            filterOptions.modern_traditional.length > 0
              ? filterOptions.modern_traditional
              : ['modern', 'traditional'],
            'All Modern/Trad'
          )}

          {/* 4. Placement */}
          {renderDropdown('Placement', 'placement', filterOptions.placements)}

          {/* 5. How */}
          {renderDropdown(
            'How',
            'how',
            filterOptions.how.length > 0
              ? filterOptions.how
              : ['full', 'flash', 'free'],
            'All Coverage'
          )}

          {/* 6. Color */}
          {renderDropdown(
            'Color',
            'color',
            filterOptions.colors.length > 0
              ? filterOptions.colors
              : ['black and gray', 'colored'],
            'All Palette'
          )}

          {/* 7. Author Name */}
          {renderDropdown(
            'Author',
            'author_name',
            filterOptions.authors,
            'All Artists'
          )}

          {/* Clear Filters Button */}
          {totalActiveTagsCount > 0 && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs dark:text-rose-400 dark:hover:text-rose-300 dark:bg-rose-950/40 dark:border-rose-900/40 cursor-pointer"
              title="Clear all active filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ({totalActiveTagsCount})</span>
            </button>
          )}
        </div>

        {/* Next to filter buttons: "Add Button" redirecting to Add photo page */}
        <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-purple-900/30">
          <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
            <strong className="text-cyan-700 dark:text-cyan-400 font-bold">{totalResults}</strong>{' '}
            {totalResults === 1 ? 'photo' : 'photos'}
          </span>
          <button
            onClick={onNavigateToAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-md shadow-cyan-500/20 hover:shadow-purple-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>Add Photo</span>
          </button>
        </div>
      </div>

      {/* Active tags ribbon */}
      {totalActiveTagsCount > 0 && (
        <div className="max-w-7xl mx-auto flex items-center flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-200 dark:border-purple-900/30 text-xs">
          <span className="text-purple-800 dark:text-purple-400 text-[11px] uppercase tracking-wider font-semibold mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            <span>Active Filters ({totalActiveTagsCount}):</span>
          </span>
          {(
            Object.entries(activeFilters) as [keyof ActiveFilters, string[]][]
          ).flatMap(([key, values]) =>
            values.map((val: string) => (
              <span
                key={`${key}-${val}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-950 border border-purple-200 text-[11px] shadow-2xs animate-fadeIn dark:bg-purple-950/60 dark:text-cyan-300 dark:border-cyan-500/30"
              >
                <span className="text-purple-700 dark:text-purple-400 capitalize font-medium">
                  {key.replace('_', '/')}:
                </span>
                <span className="font-semibold capitalize">{val}</span>
                <button
                  type="button"
                  onClick={() => onFilterToggle(key as keyof ActiveFilters, val)}
                  className="hover:text-purple-950 hover:bg-purple-200 rounded p-0.5 ml-0.5 transition-colors cursor-pointer dark:hover:text-white dark:hover:bg-purple-800/80"
                  title={`Remove ${val}`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))
          )}
        </div>
      )}
    </div>
  );
};
