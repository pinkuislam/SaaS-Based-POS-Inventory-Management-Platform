"use client";

import { useCallback, useMemo, useState } from "react";

export function textIncludes(
  value: string | null | undefined,
  query: string
): boolean {
  if (!query.trim()) return true;
  if (!value) return false;
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

export type AdminListFilterConfig<T> = {
  id: string;
  defaultValue?: string;
  match: (item: T, value: string) => boolean;
};

export function useAdminListFilter<T>({
  items,
  searchPredicate,
  filters = [],
}: {
  items: T[];
  searchPredicate: (item: T, query: string) => boolean;
  filters?: AdminListFilterConfig<T>[];
}) {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      filters.map((f) => [f.id, f.defaultValue ?? "all"])
    )
  );

  const setFilter = useCallback((id: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim();
    return items.filter((item) => {
      if (q && !searchPredicate(item, q)) return false;
      for (const f of filters) {
        const v = filterValues[f.id] ?? f.defaultValue ?? "all";
        if (!f.match(item, v)) return false;
      }
      return true;
    });
  }, [items, search, filterValues, searchPredicate, filters]);

  const hasActiveFilters =
    !!search.trim() ||
    filters.some(
      (f) => (filterValues[f.id] ?? "all") !== (f.defaultValue ?? "all")
    );

  const clearFilters = useCallback(() => {
    setSearch("");
    setFilterValues(
      Object.fromEntries(
        filters.map((f) => [f.id, f.defaultValue ?? "all"])
      )
    );
  }, [filters]);

  return {
    search,
    setSearch,
    filterValues,
    setFilter,
    filtered,
    hasActiveFilters,
    clearFilters,
    totalCount: items.length,
    filteredCount: filtered.length,
  };
}
