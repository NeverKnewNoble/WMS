"use client";

import { useCallback, useMemo, useState } from "react";

export type FilterPredicate<T> = (row: T, value: string) => boolean;

export type FilterDef<T> = {
  /** Initial value (defaults to `allValue`). */
  initial?: string;
  /** Value that disables the filter — typically "all". */
  allValue?: string;
  /** Returns true if `row` should be kept for this filter `value`. */
  predicate: FilterPredicate<T>;
};

export type TableFiltersConfig<T, K extends string = string> = {
  /**
   * Field accessors to match the search query against. A row matches
   * if **any** field includes the query (case-insensitive, trimmed).
   */
  searchFields?: Array<(row: T) => string | null | undefined>;
  /** Named filter definitions — keys become filter slots. */
  filters?: Record<K, FilterDef<T>>;
};

export type TableFiltersResult<T, K extends string = string> = {
  query:    string;
  setQuery: (next: string) => void;

  filters:        Record<K, string>;
  setFilter:      (key: K, value: string) => void;
  resetFilters:   () => void;

  /** Filtered rows after search + every filter is applied. */
  filtered: T[];
};

/**
 * Central search + filter hook for portal table pages.
 *
 * Search matches any of the configured `searchFields` (case-insensitive,
 * substring). Each filter is a named slot with its own predicate; an
 * `allValue` (default `"all"`) makes that slot a no-op so the dropdown's
 * "All …" option falls through.
 */
export function useTableFilters<T, K extends string = string>(
  rows: T[],
  config: TableFiltersConfig<T, K>,
): TableFiltersResult<T, K> {
  const initialFilters = useMemo(() => {
    const out = {} as Record<K, string>;
    for (const k in config.filters) {
      const def = config.filters[k];
      out[k] = def.initial ?? def.allValue ?? "all";
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [query, setQuery]     = useState("");
  const [filters, setFilters] = useState<Record<K, string>>(initialFilters);

  const setFilter = useCallback((key: K, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setQuery("");
    setFilters(initialFilters);
  }, [initialFilters]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const searchFields = config.searchFields ?? [];
    const filterDefs = config.filters ?? ({} as Record<K, FilterDef<T>>);

    return rows.filter((row) => {
      if (q && searchFields.length) {
        const hit = searchFields.some((get) => {
          const v = get(row);
          return typeof v === "string" && v.toLowerCase().includes(q);
        });
        if (!hit) return false;
      }

      for (const k in filterDefs) {
        const def = filterDefs[k];
        const value = filters[k];
        const all = def.allValue ?? "all";
        if (value === all || value == null || value === "") continue;
        if (!def.predicate(row, value)) return false;
      }

      return true;
    });
  }, [rows, query, filters, config.searchFields, config.filters]);

  return { query, setQuery, filters, setFilter, resetFilters, filtered };
}

/**
 * Build a stable, alpha-sorted list of distinct option values for a
 * dropdown by reading a string off each row. `null`/empty values are
 * skipped. Use this to populate select options from the data already
 * loaded for the table.
 */
export function distinctOptions<T>(
  rows: T[],
  getter: (row: T) => string | null | undefined,
): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    const v = getter(row);
    if (v) seen.add(v);
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}
