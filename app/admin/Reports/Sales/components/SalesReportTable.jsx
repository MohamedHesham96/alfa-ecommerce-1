"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
import { IoMdSearch } from "react-icons/io";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";

import { useLanguage } from "../../../../../context/LanguageContext.js";
import { DataTable } from "../../../components/data-table";
import StatusBadge from "../../../components/ui/StatusBadge";
import { fetchSalesReportOrders } from "../../../services/salesReportService";
import { createSalesReportColumns } from "../../../config/salesReportTable.config";
import {
  customerLabel,
  formatMoney,
  formatNumber,
  formatOrderDate,
  orderDisplayDate,
  orderStateTone,
} from "../salesReportUtils";

const PAGE_SIZE = 25;

function buildPageNumbers(pageIndex, pageCount) {
  const pages = new Set([0, pageIndex - 1, pageIndex, pageIndex + 1, pageCount - 1]);
  return Array.from(pages)
    .filter((page) => page >= 0 && page < pageCount)
    .sort((left, right) => left - right);
}

export default function SalesReportTable({
  filters,
  searchTerm,
  onSearch,
  onOpenOrder,
  refreshKey = 0,
  currency,
  timezone,
}) {
  const { t, locale } = useLanguage();
  const [page, setPage] = useState(0);
  const [sorting, setSorting] = useState([{ id: "createdDate", desc: true }]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rows, setRows] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    size: PAGE_SIZE,
    number: 0,
    totalElements: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchDraft, setSearchDraft] = useState(searchTerm ?? "");

  const columns = useMemo(
    () =>
      createSalesReportColumns({
        t,
        locale,
        currency: currency || t("currency"),
        timezone,
        onOpen: onOpenOrder,
      }),
    [t, locale, currency, timezone, onOpenOrder],
  );

  const sortingPayload = useMemo(
    () =>
      sorting.flatMap((sort) => {
        const column = columns.find(
          (item) => (item.id ?? item.accessorKey) === sort.id,
        );
        const field = column?.meta?.backendField;
        if (!field) return [];
        return [{ field, direction: sort.desc ? "DESC" : "ASC" }];
      }),
    [sorting, columns],
  );

  useEffect(() => {
    setSearchDraft(searchTerm ?? "");
  }, [searchTerm]);

  useEffect(() => {
    setPage(0);
  }, [filters, searchTerm, refreshKey]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSalesReportOrders(
      {
        filters,
        page,
        size: PAGE_SIZE,
        globalSearch: searchTerm || undefined,
        sorting: sortingPayload.length
          ? sortingPayload
          : [{ field: "createdDate", direction: "DESC" }],
      },
      controller.signal,
    )
      .then((data) => {
        if (cancelled) return;
        setRows(data.content);
        setPageInfo(data.page);
      })
      .catch((requestError) => {
        if (cancelled || requestError?.name === "CanceledError") return;
        setError(requestError);
        setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [filters, page, searchTerm, sortingPayload, refreshKey, reloadKey]);

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      columnVisibility,
      pagination: { pageIndex: page, pageSize: PAGE_SIZE },
    },
    manualPagination: true,
    manualSorting: true,
    pageCount: pageInfo.totalPages,
    enableMultiSort: true,
    isMultiSortEvent: (event) => Boolean(event?.shiftKey),
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.orderId),
    onSortingChange: (updater) => {
      setSorting(updater);
      setPage(0);
    },
    onColumnVisibilityChange: setColumnVisibility,
  });

  const submitSearch = useCallback(() => {
    onSearch?.(searchDraft.trim());
    setPage(0);
  }, [onSearch, searchDraft]);

  const clearSearch = () => {
    setSearchDraft("");
    onSearch?.("");
    setPage(0);
  };

  const pageNumbers = buildPageNumbers(page, pageInfo.totalPages);
  const from = pageInfo.totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(pageInfo.totalElements, (page + 1) * PAGE_SIZE);

  const renderMobileCard = (order) => (
    <div
      key={order.orderId}
      className="admin-mobile-card cursor-pointer"
      onClick={() => onOpenOrder(order.orderId)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[var(--admin-danger-text)]">
            {order.code}
          </p>
          <p className="mt-1 text-xs text-[var(--admin-muted)]">
            {formatOrderDate(orderDisplayDate(order), locale)}
            {timezone ? ` (${timezone})` : ""}
          </p>
        </div>
        <StatusBadge tone={orderStateTone(order.state)}>{t(order.state)}</StatusBadge>
      </div>
      <div className="mt-3 border-t border-[var(--admin-border-subtle)] pt-3">
        <p className="truncate text-sm font-semibold text-[var(--admin-ink)]">
          {customerLabel(order.customer)}
        </p>
        <p className="truncate text-xs text-[var(--admin-muted)]">
          {order.customer?.email || order.customer?.username || ""}
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--admin-border-subtle)] pt-3 text-xs text-[var(--admin-muted)]">
        <span>
          {t("sales_report_items_count")}: {formatNumber(order.itemsCount, locale)}
        </span>
        <span className="text-base font-bold text-[var(--admin-ink)]">
          {formatMoney(order.total, locale, currency || t("currency"))}
        </span>
      </div>
    </div>
  );

  const toolbar = (
    <div className="admin-toolbar sales-report-table-toolbar">
      <div className="admin-toolbar-main">
        <label className="admin-search">
          <IoMdSearch className="admin-search-icon" aria-hidden="true" />
          <input
            type="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitSearch();
              }
            }}
            placeholder={t("sales_report_search_placeholder")}
            aria-label={t("sales_report_search_placeholder")}
          />
        </label>
        <button
          type="button"
          className="admin-btn admin-btn-secondary admin-btn-sm"
          onClick={submitSearch}
        >
          {t("search")}
        </button>
        {searchTerm ? (
          <button
            type="button"
            className="admin-btn admin-btn-ghost admin-btn-sm"
            onClick={clearSearch}
          >
            <FaTimes aria-hidden="true" />
            {t("sales_report_clear_search")}
          </button>
        ) : null}
      </div>
      <div className="sales-report-table-tools">
        <div className="sales-report-table-count">
          {t("sales_report_showing")
            .replace("{from}", String(from))
            .replace("{to}", String(to))
            .replace("{total}", formatNumber(pageInfo.totalElements, locale))}
        </div>
        <details className="sales-report-columns">
          <summary>{t("sales_report_columns")}</summary>
          <div className="sales-report-columns-menu">
            {table.getAllLeafColumns().map((column) => (
              <label key={column.id} className="sales-report-columns-option">
                <input
                  type="checkbox"
                  checked={column.getIsVisible()}
                  onChange={column.getToggleVisibilityHandler()}
                />
                <span>
                  {typeof column.columnDef.header === "string"
                    ? column.columnDef.header
                    : column.id}
                </span>
              </label>
            ))}
          </div>
        </details>
      </div>
    </div>
  );

  return (
    <section className="admin-card sales-report-table-card" id="sales-report-details">
      <div className="admin-card-header">
        <div>
          <h2 className="admin-card-title">{t("sales_report_table_title")}</h2>
          <p className="admin-card-description">
            {t("sales_report_table_description")}
          </p>
        </div>
      </div>
      <div className="admin-card-body">
        <DataTable
          table={table}
          loading={loading}
          error={error}
          onRetry={() => setReloadKey((value) => value + 1)}
          toolbar={toolbar}
          mobileCard={renderMobileCard}
          onRowClick={(order) => onOpenOrder(order.orderId)}
          showInfiniteFooter={false}
          emptyMessage={t("sales_report_no_orders")}
          desktopWrapperClassName="admin-table-shell mt-3 w-full overflow-x-auto"
          tableClassName="admin-table min-w-[1180px]"
        />

        {error ? (
          <div className="admin-alert admin-alert-danger mt-3" role="alert">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t("sales_report_table_error_title")}</p>
              <p>{t("sales_report_table_error_description")}</p>
            </div>
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              onClick={() => setReloadKey((value) => value + 1)}
            >
              {t("sales_report_retry")}
            </button>
          </div>
        ) : null}

        {pageInfo.totalPages > 1 ? (
          <div className="sales-report-pagination">
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              disabled={page === 0 || loading}
              aria-label={t("sales_report_previous_page")}
            >
              <FaChevronLeft aria-hidden="true" />
            </button>
            {pageNumbers.map((pageNumber, index) => {
              const previous = pageNumbers[index - 1];
              return (
                <span key={pageNumber} className="sales-report-page-group">
                  {previous !== undefined && pageNumber - previous > 1 ? (
                    <span className="sales-report-page-ellipsis">…</span>
                  ) : null}
                  <button
                    type="button"
                    className={`sales-report-page-button ${
                      pageNumber === page ? "sales-report-page-button--active" : ""
                    }`}
                    onClick={() => setPage(pageNumber)}
                    disabled={loading}
                    aria-current={pageNumber === page ? "page" : undefined}
                  >
                    {formatNumber(pageNumber + 1, locale)}
                  </button>
                </span>
              );
            })}
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              onClick={() =>
                setPage((value) => Math.min(pageInfo.totalPages - 1, value + 1))
              }
              disabled={page >= pageInfo.totalPages - 1 || loading}
              aria-label={t("sales_report_next_page")}
            >
              <FaChevronRight aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
