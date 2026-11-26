"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { BiEdit, BiTrash } from "react-icons/bi";

import { useLanguage } from "../../../../context/LanguageContext";
import { useRefresh } from "../../../../context/refreshContext";
import {
  deleteRequest,
  getRequest,
} from "../../../../utils/requestsUtils";
import { DataTable, DataTableToolbar } from "../../components/data-table";
import { useServerDataTable } from "../../hooks/useServerDataTable";
import { createAreaColumns } from "../../config/areasTable.config";

const PAGE_SIZE = 15;

export default function AreaTable({ onCreate, onEdit }) {
  const { t, locale } = useLanguage();
  const { refreshKey, triggerRefresh } = useRefresh();
  const [governorates, setGovernorates] = useState([]);
  const [governorateFilter, setGovernorateFilter] = useState("");

  useEffect(() => {
    let active = true;
    getRequest("/api/public/governorates")
      .then((response) => {
        if (!active) return;
        const list = Array.isArray(response?.data) ? response.data : [];
        setGovernorates(
          list.map((governorate) => ({
            value: String(governorate.governorateId),
            label:
              locale === "ar"
                ? governorate.nameAr
                : governorate.nameEn,
          })),
        );
      })
      .catch(() => {
        if (active) setGovernorates([]);
      });
    return () => {
      active = false;
    };
  }, [locale]);

  const handleDelete = useCallback(
    async (area) => {
      try {
        const result = await deleteRequest(
          `/api/admin/areas/${area.areaId}`,
          t("confirm_delete_area"),
        );
        if (result !== undefined && result !== null) {
          triggerRefresh();
        }
      } catch {
        // The shared request utility displays the backend message.
      }
    },
    [t, triggerRefresh],
  );

  const columns = useMemo(
    () =>
      createAreaColumns({
        t,
        locale,
        onEdit,
        onDelete: handleDelete,
      }),
    [t, locale, onEdit, handleDelete],
  );

  const baseFilters = useMemo(
    () =>
      governorateFilter
        ? [
            {
              field: "governorate.governorateId",
              operator: "EQUALS",
              value: Number(governorateFilter),
            },
          ]
        : [],
    [governorateFilter],
  );

  const tableState = useServerDataTable({
    endpoint: "/api/admin/areas/search",
    columns,
    pageSize: PAGE_SIZE,
    refreshKey,
    baseFilters,
    getRowId: (area) => String(area.areaId),
  });

  const renderMobileCard = (area) => (
    <div
      key={area.areaId}
      className="admin-mobile-card cursor-pointer"
      onClick={() => onEdit(area)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-[var(--admin-ink)]">
            {locale === "ar" ? area.nameAr : area.nameEn}
          </p>
          <p className="mt-1 text-xs text-[var(--admin-muted)]">
            {locale === "ar"
              ? area.governorate?.nameAr
              : area.governorate?.nameEn}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="admin-action-icon !text-[var(--admin-info-text)] hover:!bg-[var(--admin-info-soft)]"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(area);
            }}
            aria-label={t("edit")}
          >
            <BiEdit className="text-lg" />
          </button>
          <button
            type="button"
            className="admin-action-icon !text-[var(--admin-danger-text)] hover:!bg-[var(--admin-danger-soft)]"
            onClick={(event) => {
              event.stopPropagation();
              handleDelete(area);
            }}
            aria-label={t("delete")}
          >
            <BiTrash className="text-lg" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[var(--admin-border-subtle)] pt-3">
        <span className="text-xs text-[var(--admin-muted)]">
          {t("shippingCost")}
        </span>
        <span className="text-base font-bold text-[var(--admin-ink)]">
          {Number(area.shippingCost ?? 0).toLocaleString("en-US")}{" "}
          <span className="text-xs font-medium text-[var(--admin-muted)]">
            {t("currency")}
          </span>
        </span>
      </div>
      {area.createdDate || area.modifiedDate ? (
        <p className="mt-2 text-[11px] text-[var(--admin-muted)]">
          {t("created_date")}:{" "}
          {area.createdDate
            ? new Date(area.createdDate).toLocaleDateString(
                locale === "ar" ? "ar-EG" : "en-GB",
              )
            : "--"}
          {area.modifiedDate
            ? ` · ${t("updated_date")}: ${new Date(
                area.modifiedDate,
              ).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB")}`
            : ""}
        </p>
      ) : null}
    </div>
  );

  const toolbar = (
    <DataTableToolbar
      table={tableState.table}
      searchValue={tableState.globalFilter}
      onSearchChange={tableState.setGlobalFilter}
      leading={
        <select
          className="admin-select h-9 w-auto min-w-[160px] text-xs"
          value={governorateFilter}
          onChange={(event) => setGovernorateFilter(event.target.value)}
          aria-label={t("filter_by_governorate")}
        >
          <option value="">{t("all_governorates")}</option>
          {governorates.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      }
      actions={
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={onCreate}
        >
          <FaPlus className="text-xs" />
          <span>{t("add_area")}</span>
        </button>
      }
    />
  );

  return (
    <DataTable
      table={tableState.table}
      loading={tableState.loading}
      loadingMore={tableState.loadingMore}
      hasMore={tableState.hasMore}
      error={tableState.error}
      sentinelRef={tableState.sentinelRef}
      onRetry={tableState.reload}
      toolbar={toolbar}
      mobileCard={renderMobileCard}
      onRowClick={(area) => onEdit(area)}
      mobileWrapperClassName="lg:hidden mt-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3"
      desktopWrapperClassName="admin-table-shell hidden lg:block max-h-[600px] min-w-0 mt-3 w-full overflow-x-auto overflow-y-auto"
      tableClassName="admin-table min-w-[900px]"
      emptyMessage={t("no_areas")}
    />
  );
}
