"use client";
import type { ReactNode } from "react";
import {
  flexRender,
  type Table,
} from "@tanstack/react-table";
import { FiInbox } from "react-icons/fi";

import { useLanguage } from "../../../../context/LanguageContext.js";
import {
  InfiniteListFooter,
  InfiniteTableFooter,
} from "../InfiniteScroll";
import { DataTableColumnHeader } from "./DataTableColumnHeader";

interface DataTableProps<T> {
  table: Table<T>;
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  error?: unknown;
  sentinelRef?: (node: HTMLElement | null) => void;
  onRetry?: () => void;
  toolbar?: ReactNode;
  mobileCard?: (row: T) => ReactNode;
  className?: string;
  mobileWrapperClassName?: string;
  desktopWrapperClassName?: string;
  tableClassName?: string;
  headerClassName?: string;
  rowClassName?: string;
  emptyMessage?: string;
  skeletonRows?: number;
  renderSkeletonRow?: (index: number) => ReactNode;
  renderSkeletonMobileCard?: (index: number) => ReactNode;
  showInfiniteFooter?: boolean;
}

export function DataTable<T>({
  table,
  loading = false,
  loadingMore = false,
  hasMore = false,
  error,
  sentinelRef,
  onRetry,
  toolbar,
  mobileCard,
  className = "w-full",
  mobileWrapperClassName = "lg:hidden mt-3",
  desktopWrapperClassName = "admin-table-shell hidden lg:block mt-3 w-full overflow-x-auto overflow-y-auto",
  tableClassName = "admin-table",
  headerClassName = "",
  rowClassName = "",
  emptyMessage,
  skeletonRows = 6,
  renderSkeletonRow,
  renderSkeletonMobileCard,
  showInfiniteFooter = true,
}: DataTableProps<T>) {
  const { t } = useLanguage();
  const rows = table.getRowModel().rows;
  const columnCount = table.getAllLeafColumns().length;
  const hasItems = rows.length > 0;
  // Only show the skeleton when there is nothing to display yet. During a
  // refresh (search/filter change) the previous rows stay visible instead of
  // flashing the loading skeleton again.
  const showSkeleton = loading && !hasItems;

  const emptyState = (
    <div className="admin-table-empty">
      <span className="admin-empty-icon" aria-hidden="true">
        <FiInbox />
      </span>
      <p className="admin-empty-title">{emptyMessage ?? t("no_data")}</p>
      <p className="admin-empty-description">{t("empty_hint")}</p>
    </div>
  );

  return (
    <div className={className}>
      {toolbar ? <div className="shrink-0">{toolbar}</div> : null}

      {mobileCard ? (
        <div className={mobileWrapperClassName}>
          {showSkeleton
            ? Array.from({ length: skeletonRows }).map((_, index) =>
                renderSkeletonMobileCard ? (
                  <div key={`mobile-skeleton-${index}`}>
                    {renderSkeletonMobileCard(index)}
                  </div>
                ) : (
                  <div
                    key={`mobile-skeleton-${index}`}
                    className="admin-mobile-card"
                  >
                    <div className="admin-skeleton h-4 w-24" />
                    <div className="admin-skeleton mt-2 h-3 w-16" />
                    <div className="admin-skeleton mt-3 h-8 w-full" />
                  </div>
                ),
              )
            : rows.map((row) => (
                <div key={row.id}>{mobileCard(row.original)}</div>
              ))}

          {!showSkeleton && !hasItems ? emptyState : null}

          {showInfiniteFooter && sentinelRef ? (
            <div className="flex justify-center py-3">
              <InfiniteListFooter
                sentinelRef={sentinelRef}
                loadingMore={loadingMore}
                hasMore={hasMore}
                hasItems={hasItems}
                error={error}
                onRetry={onRetry}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={desktopWrapperClassName}>
        <table className={tableClassName}>
          <thead className={headerClassName}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta;
                  const alignClass =
                    meta?.align === "center"
                      ? "text-center"
                      : meta?.align === "right"
                        ? "text-end"
                        : "";
                  return (
                    <th
                      key={header.id}
                      className={`${meta?.headerClassName ?? ""} ${alignClass}`}
                    >
                      {header.isPlaceholder ? null : (
                        <DataTableColumnHeader
                          column={header.column}
                          title={flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="w-full bg-white text-sm">
            {showSkeleton
              ? Array.from({ length: skeletonRows }).map((_, index) =>
                  renderSkeletonRow ? (
                    <tr key={`skeleton-${index}`}>
                      {renderSkeletonRow(index)}
                    </tr>
                  ) : (
                    <tr key={`skeleton-${index}`}>
                      <td colSpan={columnCount} className="px-4 py-3">
                        <div className="admin-skeleton h-5 w-full" />
                      </td>
                    </tr>
                  ),
                )
              : rows.map((row) => (
                  <tr key={row.id} className={rowClassName}>
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta;
                      const alignClass =
                        meta?.align === "center"
                          ? "text-center"
                          : meta?.align === "right"
                            ? "text-end"
                            : "";
                      return (
                        <td
                          key={cell.id}
                          className={`${meta?.cellClassName ?? ""} ${alignClass}`}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

            {!showSkeleton && !hasItems ? (
              <tr>
                <td colSpan={columnCount}>{emptyState}</td>
              </tr>
            ) : null}

            {showInfiniteFooter && sentinelRef ? (
              <InfiniteTableFooter
                colSpan={columnCount}
                sentinelRef={sentinelRef}
                loadingMore={loadingMore}
                hasMore={hasMore}
                hasItems={hasItems}
                error={error}
                onRetry={onRetry}
              />
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
