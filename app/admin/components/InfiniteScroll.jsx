"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../../context/LanguageContext.js";

const DEFAULT_ID_KEYS = [
  "id",
  "userId",
  "itemId",
  "orderId",
  "returnOrderId",
  "itemCategoryId",
  "shippingRateId",
];

const defaultGetKey = (item) => {
  if (!item || typeof item !== "object") return undefined;
  for (const key of DEFAULT_ID_KEYS) {
    if (item[key] !== undefined && item[key] !== null) return item[key];
  }
  return undefined;
};

// Append incoming rows while skipping rows that are already present based on
// their unique key. This guards against duplicated pages from the backend.
const mergeUnique = (base, incoming, getKey) => {
  if (!incoming || incoming.length === 0) return base;
  const keyOf = typeof getKey === "function" ? getKey : defaultGetKey;
  const seen = new Set();
  const result = [];
  const push = (item) => {
    const key = keyOf(item);
    if (key === undefined || key === null) {
      result.push(item);
      return;
    }
    if (seen.has(key)) return;
    seen.add(key);
    result.push(item);
  };
  base.forEach(push);
  incoming.forEach(push);
  return result;
};

// Normalizes the many paginated payload shapes used across the app
// (Spring `Page` wrapped in a `{ data }` envelope, plain arrays, `items`, ...).
export function normalizePage(payload, fallbackSize = 15) {
  const data = payload?.data ?? payload ?? {};
  const page = data?.page ?? data ?? {};
  const content = Array.isArray(data)
    ? data
    : Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data?.items)
        ? data.items
        : [];
  const size = Number(page?.size ?? data?.size ?? fallbackSize) || fallbackSize;
  const totalElements =
    Number(
      page?.totalElements ??
        page?.totalItems ??
        page?.totalCount ??
        page?.total ??
        data?.totalElements ??
        data?.totalItems ??
        data?.totalCount ??
        data?.total ??
        0,
    ) || 0;
  const totalPages =
    Number(
      page?.totalPages ??
        page?.totalPage ??
        data?.totalPages ??
        data?.totalPage ??
        0,
    ) ||
    (content.length > 0 && totalElements > 0
      ? Math.max(1, Math.ceil(totalElements / size))
      : 0);
  const last =
    typeof page?.last === "boolean"
      ? page.last
      : typeof data?.last === "boolean"
        ? data.last
        : undefined;
  const number =
    Number(
      page?.number ??
        page?.pageNumber ??
        page?.currentPage ??
        data?.number ??
        data?.pageNumber ??
        data?.currentPage ??
        0,
    ) || 0;
  return { content, size, totalElements, totalPages, last, number };
}

// Convenience wrapper for `useInfiniteScroll`'s `load` option. It receives the
// raw API payload and returns `{ items, hasMore }`.
export function toPageResult(payload, page, pageSize = 15) {
  const normalized = normalizePage(payload, pageSize);
  let hasMore;
  if (typeof normalized.last === "boolean") {
    hasMore = !normalized.last;
  } else if (normalized.totalPages > 0) {
    hasMore = page + 1 < normalized.totalPages;
  } else {
    hasMore = normalized.content.length >= pageSize;
  }
  return {
    items: normalized.content,
    hasMore,
    totalElements: normalized.totalElements,
    totalPages: normalized.totalPages,
    pageNumber: normalized.number,
  };
}

const SCROLL_OVERFLOW = new Set(["auto", "scroll", "overlay"]);

// Walk up from a sentinel and return the nearest element that actually
// scrolls. Admin tables live inside an `overflow-y-auto` wrapper (with a
// constrained height), so the observer must use that wrapper as its `root`;
// otherwise the sentinel is clipped by the wrapper and never intersects the
// viewport. Returns null when nothing scrolls, which means the page/viewport
// is the scroll container.
function getScrollParent(node) {
  if (typeof window === "undefined" || !node) return null;
  let el = node.parentElement;
  while (el && el !== document.documentElement && el !== document.body) {
    const { overflowX, overflowY } = window.getComputedStyle(el);
    if (SCROLL_OVERFLOW.has(overflowY) || SCROLL_OVERFLOW.has(overflowX)) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}

// Shared IntersectionObserver plumbing. Each sentinel node (desktop table
// footer + mobile list footer) is watched with an observer whose `root` is its
// own scroll container, so infinite scroll fires when the user scrolls inside
// the table wrapper as well as when the whole page scrolls.
function useSentinel(onIntersect, active) {
  const observersRef = useRef(new Map());
  const nodesRef = useRef(new Map());
  const visibilityRef = useRef(new Map());
  const cbRef = useRef(onIntersect);
  const activeRef = useRef(active);
  cbRef.current = onIntersect;
  activeRef.current = active;

  const observerFor = useCallback((root) => {
    const key = root ?? null;
    if (!observersRef.current.has(key)) {
      observersRef.current.set(
        key,
        new IntersectionObserver(
          (entries) => {
            const visible = entries.some((entry) => entry.isIntersecting);
            // Remember the latest state even while inactive. A short list can
            // sit entirely inside `rootMargin` and only ever emit a single
            // "intersecting" event, which happens while the first page is still
            // loading; reacting to `active` below then needs this cached state.
            visibilityRef.current.set(key, visible);
            if (visible && activeRef.current) cbRef.current?.();
          },
          { root: key, rootMargin: "200px 0px", threshold: 0 },
        ),
      );
    }
    return observersRef.current.get(key);
  }, []);

  // Attach (or re-attach) a node to the observer for its current scroll
  // container. Re-observing emits the node's current intersection state, which
  // covers the case where the table is still shorter than its scroll container.
  const observe = useCallback(
    (node) => {
      const currentRoot = getScrollParent(node);
      const observer = observerFor(currentRoot);
      nodesRef.current.set(node, { observer, root: currentRoot });
      observer.observe(node);
    },
    [observerFor],
  );

  const sentinelRef = useCallback(
    (node) => {
      if (typeof IntersectionObserver === "undefined") return;
      // `node` is null when the element detaches; a bare null does not say
      // which node it was, so stale entries are pruned inside `rearm` instead.
      if (node && !nodesRef.current.has(node)) observe(node);
    },
    [observe],
  );

  const rearm = useCallback(() => {
    nodesRef.current.forEach((registration, node) => {
      if (!node.isConnected) {
        registration.observer.unobserve(node);
        nodesRef.current.delete(node);
      }
    });
    nodesRef.current.forEach((_registration, node) => observe(node));
  }, [observe]);

  // Observations are established here (refs are attached before effects run)
  // and re-established on every mount. That is what keeps them alive across
  // React 18 StrictMode's simulated unmount/remount, where the cleanup below
  // disconnects the observers but `sentinelRef` (stable identity, same node)
  // never re-runs. `nodesRef` is deliberately NOT cleared by the cleanup so
  // this effect has something to re-observe.
  useEffect(() => {
    rearm();
    const observers = observersRef.current;
    const visibility = visibilityRef.current;
    return () => {
      observers.forEach((observer) => observer.disconnect());
      observers.clear();
      visibility.clear();
    };
  }, [rearm]);

  // When the list becomes idle again (a page finished, an error cleared, ...),
  // fire once if a sentinel is already visible. Without this, a table shorter
  // than its scroll container would never load past its first page: its only
  // "intersecting" event fires while `active` is false, and no further event is
  // emitted because the intersection state never changes.
  useEffect(() => {
    if (!active) return;
    const visible = [...visibilityRef.current.values()].some(Boolean);
    if (visible) cbRef.current?.();
  }, [active]);

  return { sentinelRef, rearm };
}

/**
 * Server-side infinite scroll. `load(page)` must return `{ items, hasMore }`
 * (see `toPageResult`). Changing `queryKey` resets and reloads page 0.
 */
export function useInfiniteScroll({
  load,
  queryKey,
  pageSize = 15,
  enabled = true,
  getKey,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [totalElements, setTotalElements] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);

  const pageRef = useRef(0);
  const busyRef = useRef(false);
  const seqRef = useRef(0);
  const hasMoreRef = useRef(true);
  const aliveRef = useRef(true);
  const abortRef = useRef(null);
  const itemsRef = useRef(items);
  const loadRef = useRef(load);
  const getKeyRef = useRef(getKey);
  const enabledRef = useRef(enabled);
  itemsRef.current = items;
  loadRef.current = load;
  getKeyRef.current = getKey;
  enabledRef.current = enabled;

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const queryKeyStr = Array.isArray(queryKey)
    ? queryKey.map((value) => String(value)).join("|")
    : String(queryKey ?? "");

  const run = useCallback(
    async (page, mode) => {
      if (!enabledRef.current) return;
      // A "more" request must never overlap another request, while a "reset"
      // is allowed to supersede an in-flight request (search/filter changed).
      if (mode === "more" && (busyRef.current || !hasMoreRef.current)) return;

      if (mode === "reset") {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
      }

      busyRef.current = true;
      const seq = ++seqRef.current;

      if (mode === "reset") {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const result = await loadRef.current(page, {
          signal: abortRef.current?.signal,
        });
        if (seq !== seqRef.current || !aliveRef.current) return; // stale response
        const content = Array.isArray(result?.items) ? result.items : [];
        const base = mode === "reset" ? [] : itemsRef.current;
        const merged = mergeUnique(base, content, getKeyRef.current);
        const added = merged.length - base.length;
        setItems(merged);
        pageRef.current = mode === "reset" ? 0 : page;
        setPageIndex(mode === "reset" ? 0 : page);
        const total = Number(result?.totalElements);
        if (Number.isFinite(total)) {
          setTotalElements(total);
        } else if (mode === "reset") {
          setTotalElements(merged.length);
        }
        // Stop when the page is empty or (for a "more" request) when it added
        // no new unique rows, which protects against an un-paginated backend.
        const more =
          content.length === 0 || (mode === "more" && added === 0)
            ? false
            : (result?.hasMore ?? content.length >= pageSize);
        hasMoreRef.current = more;
        setHasMore(more);
        setError(null);
      } catch (err) {
        if (seq !== seqRef.current || !aliveRef.current) return;
        // Aborted requests are not user-facing errors.
        if (
          err?.name === "CanceledError" ||
          err?.name === "AbortError" ||
          err?.code === "ERR_CANCELED"
        ) {
          return;
        }
        setError(err);
        // Keep loading available so the user can retry.
        hasMoreRef.current = true;
        setHasMore(true);
      } finally {
        if (seq === seqRef.current) {
          busyRef.current = false;
          if (aliveRef.current) {
            setLoading(false);
            setLoadingMore(false);
          }
        }
      }
    },
    [pageSize],
  );

  const runRef = useRef(run);
  runRef.current = run;

  const idle = hasMore && !loading && !loadingMore && !error;
  const { sentinelRef, rearm } = useSentinel(
    () => runRef.current(pageRef.current + 1, "more"),
    idle,
  );

  // Reset when the query (search text, filters, sort or refresh) changes.
  useEffect(() => {
    pageRef.current = 0;
    hasMoreRef.current = true;
    setHasMore(true);
    setError(null);
    setTotalElements(0);
    setPageIndex(0);
    runRef.current(0, "reset");
  }, [queryKeyStr, enabled]);

  // Re-check the sentinel whenever a page finishes loading. Re-observing the
  // nodes emits their current intersection state, which covers the case where
  // the table is still shorter than its scroll container.
  useEffect(() => {
    if (!idle) return;
    rearm();
  }, [items, idle, rearm]);

  const loadMore = useCallback(() => {
    runRef.current(pageRef.current + 1, "more");
  }, []);

  const reload = useCallback(() => {
    runRef.current(0, "reset");
  }, []);

  return {
    items,
    setItems,
    loading,
    loadingMore,
    hasMore,
    error,
    sentinelRef,
    loadMore,
    reload,
    totalElements,
    pageIndex,
  };
}

/**
 * Client-side fallback for endpoints that return the whole list at once.
 * Reveals `pageSize` more rows every time the sentinel becomes visible.
 */
export function useClientInfiniteScroll(allItems = [], pageSize = 15) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const total = allItems?.length || 0;

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [allItems, pageSize]);

  const hasMore = visibleCount < total;
  const loadMore = useCallback(() => {
    setVisibleCount((count) => Math.min(count + pageSize, total));
  }, [pageSize, total]);

  const { sentinelRef, rearm } = useSentinel(loadMore, hasMore);

  useEffect(() => {
    if (!hasMore) return;
    rearm();
  }, [allItems, visibleCount, hasMore, rearm]);

  const items = useMemo(
    () => (allItems || []).slice(0, visibleCount),
    [allItems, visibleCount],
  );

  return {
    items,
    loading: false,
    loadingMore: false,
    hasMore,
    error: null,
    sentinelRef,
    loadMore,
    reload: () => setVisibleCount(pageSize),
  };
}

const Spinner = () => (
  <span className="inline-block w-5 h-5 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
);

const FooterContent = ({ loadingMore, hasMore, hasItems, error, onRetry, t }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-3">
    {loadingMore ? <Spinner /> : null}
    {!loadingMore && !hasMore && hasItems ? (
      <span className="text-xs text-gray-400">{t("no_more_records")}</span>
    ) : null}
    {error && hasMore && !loadingMore ? (
      <button
        type="button"
        onClick={onRetry}
        className="text-xs font-semibold text-red-600 hover:underline"
      >
        {t("retry")}
      </button>
    ) : null}
  </div>
);

/** Bottom-of-table sentinel + indicator for a `<tbody>` (desktop layout). */
export function InfiniteTableFooter({
  sentinelRef,
  loadingMore,
  hasMore,
  hasItems,
  error,
  onRetry,
  colSpan = 1,
}) {
  const { t } = useLanguage();
  return (
    <tr ref={sentinelRef} className="h-8">
      <td colSpan={colSpan}>
        <FooterContent
          loadingMore={loadingMore}
          hasMore={hasMore}
          hasItems={hasItems}
          error={error}
          onRetry={onRetry}
          t={t}
        />
      </td>
    </tr>
  );
}

/** Bottom-of-list sentinel + indicator for the mobile card layout. */
export function InfiniteListFooter({
  sentinelRef,
  loadingMore,
  hasMore,
  hasItems,
  error,
  onRetry,
  className = "",
}) {
  const { t } = useLanguage();
  return (
    <div ref={sentinelRef} className={className}>
      <FooterContent
        loadingMore={loadingMore}
        hasMore={hasMore}
        hasItems={hasItems}
        error={error}
        onRetry={onRetry}
        t={t}
      />
    </div>
  );
}
