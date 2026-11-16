import { useCallback, useMemo, useState } from "react";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type Updater,
} from "@tanstack/react-table";

import {
  toPageResult,
  useInfiniteScroll,
} from "../components/InfiniteScroll";
import { searchTable } from "../services/adminTableService";
import { useDebouncedValue } from "./useDebouncedValue";
import { buildTableCacheKey } from "./tableQueryCache";
import type {
  ColumnFilterValue,
  FilterCondition,
  SortCondition,
} from "../types/table.types";

interface UseServerDataTableOptions<T> {
  endpoint: string;
  columns: ColumnDef<T, unknown>[];
  pageSize?: number;
  initialSorting?: SortingState;
  initialFilters?: ColumnFiltersState;
  initialGlobalFilter?: string;
  baseFilters?: FilterCondition[];
  refreshKey?: unknown;
  enabled?: boolean;
  getRowId?: (row: T) => string;
  /**
   * Keep the last result in memory (and restore it instantly) for this table.
   * Enable it for tables that are opened repeatedly, such as the products
   * popup inside the categories page.
   */
  cacheResults?: boolean;
}

function operatorNeedsValue(operator: string) {
  return operator !== "IS_NULL" && operator !== "IS_NOT_NULL";
}

const EMPTY_FILTERS: FilterCondition[] = [];

export function useServerDataTable<T>({
  endpoint,
  columns,
  pageSize: initialPageSize = 15,
  initialSorting = [],
  initialFilters = [],
  initialGlobalFilter = "",
  baseFilters = EMPTY_FILTERS,
  refreshKey,
  enabled = true,
  getRowId,
  cacheResults = false,
}: UseServerDataTableOptions<T>) {
  const [globalFilter, setGlobalFilter] = useState(initialGlobalFilter);
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>(initialFilters);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const debouncedGlobalFilter = useDebouncedValue(globalFilter, 300);

  const columnMetaById = useMemo(() => {
    const metaById = new Map<string, ReturnType<typeof columnMetaOf>>();
    for (const column of columns) {
      const accessorKey = (column as { accessorKey?: string }).accessorKey;
      const id = column.id ?? accessorKey;
      if (id) {
        metaById.set(id, columnMetaOf(column));
      }
    }
    return metaById;
  }, [columns]);

  const requestFilters = useMemo<FilterCondition[]>(() => {
    return columnFilters.flatMap((filter) => {
      const meta = columnMetaById.get(filter.id);
      if (!meta?.backendField || !meta.filterable) return [];
      const value = filter.value as ColumnFilterValue | undefined;
      if (!value?.operator) return [];
      const condition: FilterCondition = {
        field: meta.backendField,
        operator: value.operator,
      };
      if (operatorNeedsValue(value.operator)) {
        condition.value = value.value;
      }
      return [condition];
    });
  }, [columnFilters, columnMetaById]);

  const requestSorting = useMemo<SortCondition[]>(() => {
    return sorting.flatMap((sort) => {
      const meta = columnMetaById.get(sort.id);
      if (!meta?.backendField || !meta.sortable) return [];
      return [
        {
          field: meta.backendField,
          direction: sort.desc ? "DESC" : "ASC",
        } satisfies SortCondition,
      ];
    });
  }, [sorting, columnMetaById]);

  const combinedFilters = useMemo(
    () => [...baseFilters, ...requestFilters],
    [baseFilters, requestFilters],
  );
  const debouncedFilters = useDebouncedValue(combinedFilters, 300);

  const cacheKey = useMemo(
    () =>
      cacheResults
        ? buildTableCacheKey({
            endpoint,
            globalFilter: debouncedGlobalFilter,
            filters: debouncedFilters,
            sorting: requestSorting,
            pageSize,
          })
        : undefined,
    [
      cacheResults,
      endpoint,
      debouncedGlobalFilter,
      debouncedFilters,
      requestSorting,
      pageSize,
    ],
  );

  const queryKey = [
    endpoint,
    debouncedGlobalFilter,
    JSON.stringify(debouncedFilters),
    JSON.stringify(requestSorting),
    pageSize,
    refreshKey ?? "",
  ];

  const load = useCallback(
    async (page: number, options: { signal?: AbortSignal } = {}) => {
      const payload = await searchTable<T>(
        endpoint,
        {
          page,
          size: pageSize,
          globalSearch: debouncedGlobalFilter,
          filters: debouncedFilters,
          sorting: requestSorting,
        },
        options.signal,
      );
      return toPageResult(payload, page, pageSize);
    },
    [endpoint, pageSize, debouncedGlobalFilter, debouncedFilters, requestSorting],
  );

  const {
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
  } = useInfiniteScroll({
    pageSize,
    queryKey,
    cacheKey,
    cacheVersion: refreshKey,
    load,
    enabled,
    getKey: getRowId,
  });

  const pageCount =
    totalElements > 0 ? Math.max(1, Math.ceil(totalElements / pageSize)) : 0;

  const table = useReactTable({
    data: items as T[],
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount,
    enableMultiSort: true,
    isMultiSortEvent: (event) => Boolean((event as MouseEvent)?.shiftKey),
    getCoreRowModel: getCoreRowModel(),
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    onSortingChange: (updater: Updater<SortingState>) => {
      setSorting(updater);
    },
    onColumnFiltersChange: (updater: Updater<ColumnFiltersState>) => {
      setColumnFilters(updater);
    },
    onGlobalFilterChange: (updater: Updater<string>) => {
      setGlobalFilter(updater);
    },
  });

  return {
    table,
    globalFilter,
    setGlobalFilter,
    columnFilters,
    setColumnFilters,
    sorting,
    setSorting,
    pageSize,
    setPageSize,
    pageCount,
    totalElements,
    items,
    setItems,
    loading,
    loadingMore,
    hasMore,
    error,
    sentinelRef,
    loadMore,
    reload,
  };
}

function columnMetaOf<T>(column: ColumnDef<T, unknown>) {
  return (column.meta ?? {}) as {
    backendField?: string;
    filterable?: boolean;
    sortable?: boolean;
  };
}
