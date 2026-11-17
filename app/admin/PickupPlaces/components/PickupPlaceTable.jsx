"use client";

import { useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import { MdEdit } from "react-icons/md";

import { useLanguage } from "../../../../context/LanguageContext";
import { useRefresh } from "../../../../context/refreshContext";
import { postRequest } from "../../../../utils/requestsUtils";
import { DataTable, DataTableToolbar } from "../../components/data-table";
import StatusBadge from "../../components/ui/StatusBadge";
import { useServerDataTable } from "../../hooks/useServerDataTable";
import { createPickupPlaceColumns } from "../../config/pickupPlacesTable.config";

const PAGE_SIZE = 15;

export default function PickupPlaceTable({ onCreate, onEdit }) {
  const { t, locale } = useLanguage();
  const { triggerRefresh, refreshKey } = useRefresh();

  const toggleActive = async (place) => {
    try {
      const response = await postRequest(
        `/api/admin/pickup-places/${place.pickupPlaceId}/active/${!place.active}`,
        "",
        t("message"),
      );
      if (response) triggerRefresh();
    } catch {
      // The shared request utility surfaces the error.
    }
  };

  const columns = useMemo(
    () =>
      createPickupPlaceColumns({
        t,
        locale,
        onEdit,
        onToggleActive: toggleActive,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, locale, onEdit],
  );

  const tableState = useServerDataTable({
    endpoint: "/api/admin/pickup-places/search",
    columns,
    pageSize: PAGE_SIZE,
    initialSorting: [{ id: "name", desc: false }],
    refreshKey,
    getRowId: (place) => String(place.pickupPlaceId),
  });

  const renderMobileCard = (place) => (
    <div
      key={place.pickupPlaceId}
      className={`admin-mobile-card cursor-pointer ${place.active ? "" : "opacity-80"}`}
      onClick={() => onEdit(place)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--admin-ink)]">
            {place.name}
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">
            {place.description}
          </p>
        </div>
        <StatusBadge tone={place.active ? "success" : "neutral"}>
          {place.active
            ? t("active_pickup_place")
            : t("inactive_pickup_place")}
        </StatusBadge>
      </div>

      <div className="mt-3 space-y-2 border-t border-[var(--admin-border-subtle)] pt-3 text-xs text-[var(--admin-muted)]">
        <p className="flex gap-1.5">
          <span className="font-semibold text-[var(--admin-ink-soft)]">{t("address")}:</span>
          <span className="min-w-0 break-words">{place.address}</span>
        </p>
        <p className="flex gap-1.5">
          <span className="font-semibold text-[var(--admin-ink-soft)]">
            {t("phoneNumber")}:
          </span>
          <span dir="ltr">{place.phone}</span>
        </p>
        <p className="flex gap-1.5">
          <span className="font-semibold text-[var(--admin-ink-soft)]">
            {t("working_hours")}:
          </span>
          <span className="min-w-0 break-words">{place.workingHours}</span>
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--admin-border-subtle)] pt-3">
        <button
          type="button"
          className="admin-action-edit"
          onClick={(event) => {
            event.stopPropagation();
            onEdit(place);
          }}
        >
          <MdEdit className="text-sm" />
          {t("edit")}
        </button>
        <button
          type="button"
          className={
            place.active
              ? "inline-flex h-8 items-center justify-center rounded-lg border border-[var(--admin-warning-border)] bg-[var(--admin-warning-soft)] px-2.5 text-xs font-semibold text-[var(--admin-warning-text)]"
              : "inline-flex h-8 items-center justify-center rounded-lg border border-[var(--admin-success-border)] bg-[var(--admin-success-soft)] px-2.5 text-xs font-semibold text-[var(--admin-success-text)]"
          }
          onClick={(event) => {
            event.stopPropagation();
            toggleActive(place);
          }}
        >
          {place.active ? t("deactivate") : t("activate")}
        </button>
      </div>
    </div>
  );

  const toolbar = (
    <DataTableToolbar
      table={tableState.table}
      searchValue={tableState.globalFilter}
      onSearchChange={tableState.setGlobalFilter}
      actions={
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={onCreate}
        >
          <FaPlus className="text-xs" />
          <span>{t("add_pickup_place")}</span>
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
      onRowClick={(place) => onEdit(place)}
      mobileWrapperClassName="lg:hidden mt-3"
      desktopWrapperClassName="admin-table-shell hidden lg:block mt-3 max-h-[600px] w-full overflow-x-auto overflow-y-auto"
      tableClassName="admin-table min-w-[860px]"
      emptyMessage={t("no_pickup_places")}
    />
  );
}
