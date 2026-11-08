"use client";

import { useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import { MdEdit } from "react-icons/md";

import { useLanguage } from "../../../../context/LanguageContext";
import { useRefresh } from "../../../../context/refreshContext";
import { postRequest } from "../../../../utils/requestsUtils";
import { DataTable, DataTableToolbar } from "../../components/data-table";
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
      className={`mx-2 my-3 rounded-xl border bg-white p-3 ${
        place.active ? "" : "opacity-80"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-gray-900">
            {place.name}
          </h1>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            {place.description}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${
            place.active
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-gray-300 bg-gray-100 text-gray-600"
          }`}
        >
          {place.active
            ? t("active_pickup_place")
            : t("inactive_pickup_place")}
        </span>
      </div>

      <div className="mt-3 space-y-2 border-t pt-3 text-xs text-gray-600">
        <p>
          <span className="font-semibold text-gray-700">{t("address")}:</span>{" "}
          {place.address}
        </p>
        <p>
          <span className="font-semibold text-gray-700">
            {t("phoneNumber")}:
          </span>{" "}
          <span dir="ltr">{place.phone}</span>
        </p>
        <p>
          <span className="font-semibold text-gray-700">
            {t("working_hours")}:
          </span>{" "}
          {place.workingHours}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
        <button
          type="button"
          className="flex items-center gap-1 rounded-md bg-blue-300 px-3 py-1 text-sm font-semibold text-blue-800 hover:bg-blue-400"
          onClick={() => onEdit(place)}
        >
          <MdEdit />
          {t("edit")}
        </button>
        <button
          type="button"
          className={`rounded-md px-3 py-1 text-sm font-semibold ${
            place.active
              ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
              : "bg-green-100 text-green-800 hover:bg-green-200"
          }`}
          onClick={() => toggleActive(place)}
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
      className="!p-3"
      actions={
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-md bg-[#CD4354] p-2 text-center text-white xs:text-xs md:text-sm"
          onClick={onCreate}
        >
          <FaPlus />
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
      mobileWrapperClassName="lg:hidden mt-3 h-auto rounded-xl border overflow-y-auto"
      desktopWrapperClassName="hidden lg:block mt-3 max-h-[600px] w-full overflow-x-auto overflow-y-auto"
      tableClassName="w-full min-w-[860px] border"
      headerClassName="bg-[#f0eff0] text-xs text-justify sticky top-0 z-10"
      rowClassName="border w-full hover:bg-gray-50"
      emptyMessage={t("no_pickup_places")}
    />
  );
}
