import { toPageResult } from "../components/InfiniteScroll";
import {
  buildTableCacheKey,
  readTableCache,
  writeTableCache,
  type TableCacheQuery,
} from "../hooks/tableQueryCache";
import { searchTable } from "./adminTableService";

const pending = new Set<string>();

/**
 * Loads the first page of a table in the background and stores it in the
 * shared table cache. Opening the related popup afterwards renders from the
 * cache immediately instead of showing the skeleton from scratch.
 */
export async function prefetchTablePage({
  refreshKey,
  ...query
}: TableCacheQuery & { refreshKey?: unknown }) {
  if (typeof window === "undefined") return;

  const cacheKey = buildTableCacheKey(query);
  const cached = readTableCache(cacheKey);
  const version = String(refreshKey ?? "");

  // A prefetched entry is still valid until a mutation bumps refreshKey.
  if (cached && cached.refreshKey === version) return;
  if (pending.has(cacheKey)) return;

  pending.add(cacheKey);
  try {
    const payload = await searchTable(query.endpoint, {
      page: 0,
      size: query.pageSize,
      globalSearch: query.globalFilter ?? "",
      filters: query.filters ?? [],
      sorting: query.sorting ?? [],
    });
    const result = toPageResult(payload, 0, query.pageSize);
    writeTableCache(cacheKey, {
      items: result.items,
      totalElements: result.totalElements,
      hasMore: result.hasMore,
      pageIndex: 0,
      refreshKey: version,
    });
  } catch {
    // Prefetching is only an optimisation; the table still loads on demand.
  } finally {
    pending.delete(cacheKey);
  }
}
