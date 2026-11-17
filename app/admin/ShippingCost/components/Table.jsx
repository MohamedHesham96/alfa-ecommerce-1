"use client";
import { useMemo } from "react";
import { BiEdit } from "react-icons/bi";

import { useLanguage } from "../../../../context/LanguageContext";
import { useRefresh } from "../../../../context/refreshContext";
import { DataTable, DataTableToolbar } from "../../components/data-table";
import { useServerDataTable } from "../../hooks/useServerDataTable";
import { createShippingColumns } from "../../config/shippingTable.config";

const PAGE_SIZE = 15;

export default function Table({
  setGovernorate,
  setGovernorateId,
  setGovernoratePrice,
  setShowForm,
}) {
  const { t, locale } = useLanguage();
  const { refreshKey } = useRefresh();

  const editRate = (rate) => {
    setGovernorate(
      locale === "ar" ? rate.governorate?.nameAr : rate.governorate?.nameEn,
    );
    setGovernorateId(rate.shippingRateId);
    setGovernoratePrice(rate.shippingCost);
    setShowForm(true);
  };

  const columns = useMemo(
    () => createShippingColumns({ t, locale, onEdit: editRate }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, locale],
  );

  const tableState = useServerDataTable({
    endpoint: "/api/admin/shipping-rates/search",
    columns,
    pageSize: PAGE_SIZE,
    refreshKey,
    getRowId: (rate) => String(rate.shippingRateId),
  });

  const renderMobileCard = (rate) => (
    <div
      key={rate.shippingRateId}
      className="admin-mobile-card cursor-pointer"
      onClick={() => editRate(rate)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-[var(--admin-muted)]">{t("governorate")}</p>
          <p className="mt-0.5 break-words text-sm font-semibold text-[var(--admin-ink)]">
            {locale === "ar"
              ? rate.governorate?.nameAr
              : rate.governorate?.nameEn}
          </p>
        </div>
        <button
          type="button"
          className="admin-action-icon shrink-0 !text-[var(--admin-info-text)] hover:!bg-[var(--admin-info-soft)]"
          onClick={(event) => {
            event.stopPropagation();
            editRate(rate);
          }}
          aria-label={t("edit")}
        >
          <BiEdit className="text-lg" />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[var(--admin-border-subtle)] pt-3">
        <span className="text-xs text-[var(--admin-muted)]">{t("shippingCost")}</span>
        <span className="text-base font-bold text-[var(--admin-ink)]">
          {Number(rate.shippingCost ?? 0).toLocaleString("en-US")}{" "}
          <span className="text-xs font-medium text-[var(--admin-muted)]">
            {t("currency")}
          </span>
        </span>
      </div>
    </div>
  );

  const toolbar = (
    <DataTableToolbar
      table={tableState.table}
      searchValue={tableState.globalFilter}
      onSearchChange={tableState.setGlobalFilter}
    />
  );

  return (
    <div className="h-full w-full">
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
        onRowClick={(rate) => editRate(rate)}
        mobileWrapperClassName="lg:hidden mt-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3"
        desktopWrapperClassName="admin-table-shell hidden lg:block max-h-[600px] min-w-0 mt-3 w-full overflow-x-auto overflow-y-auto"
        tableClassName="admin-table min-w-[560px]"
        emptyMessage={t("no_data")}
      />
    </div>
  );
}
