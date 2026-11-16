import type { FilterCondition, SortCondition } from "../types/table.types";

export interface TableCacheEntry<T = unknown> {
  items: T[];
  totalElements: number;
  hasMore: boolean;
  pageIndex: number;
  refreshKey: string;
}

export interface TableCacheQuery {
  endpoint: string;
  globalFilter?: string;
  filters?: FilterCondition[];
  sorting?: SortCondition[];
  pageSize: number;
}

const MAX_ENTRIES = 40;
const entries = new Map<string, TableCacheEntry>();

export function buildTableCacheKey({
  endpoint,
  globalFilter = "",
  filters = [],
  sorting = [],
  pageSize,
}: TableCacheQuery) {
  return [
    endpoint,
    globalFilter,
    JSON.stringify(filters),
    JSON.stringify(sorting),
    pageSize,
  ].join("|");
}

export function readTableCache<T>(key: string): TableCacheEntry<T> | undefined {
  // The cache lives in the browser only; never reuse it across SSR requests.
  if (typeof window === "undefined") return undefined;
  return entries.get(key) as TableCacheEntry<T> | undefined;
}

export function writeTableCache<T>(key: string, entry: TableCacheEntry<T>) {
  if (typeof window === "undefined") return;
  // Re-insert so the map keeps recently used entries last (simple LRU).
  entries.delete(key);
  entries.set(key, entry as TableCacheEntry);
  while (entries.size > MAX_ENTRIES) {
    const oldest = entries.keys().next().value;
    if (oldest === undefined) break;
    entries.delete(oldest);
  }
}

export function clearTableCache() {
  entries.clear();
}
