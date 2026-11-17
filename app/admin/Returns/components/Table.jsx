"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { FaUserLarge } from "react-icons/fa6";

import { useLanguage } from "../../../../context/LanguageContext";
import { DataTable, DataTableToolbar } from "../../components/data-table";
import StatusBadge from "../../components/ui/StatusBadge";
import { useServerDataTable } from "../../hooks/useServerDataTable";
import {
  createReturnColumns,
  formatReturnDate,
  ReturnStateFilter,
} from "../../config/returnsTable.config";

const PAGE_SIZE = 15;

export default function ReturnTable() {
  const { t } = useLanguage();
  const router = useRouter();

  const columns = useMemo(
    () =>
      createReturnColumns({
        t,
        onOpen: (returnOrderId) =>
          router.push(`/admin/returnorderdetails/${returnOrderId}`),
      }),
    [router, t],
  );

  const tableState = useServerDataTable({
    endpoint: "/api/admin/return-orders/search",
    columns,
    pageSize: PAGE_SIZE,
    getRowId: (order) => String(order.returnOrderId),
  });

  const stateValue =
    tableState.columnFilters.find((filter) => filter.id === "state")?.value
      ?.value ?? "";

  const applyStateFilter = (value) => {
    tableState.setColumnFilters((prev) => {
      const others = prev.filter((filter) => filter.id !== "state");
      return value
        ? [...others, { id: "state", value: { operator: "EQUALS", value } }]
        : others;
    });
  };

  const renderMobileCard = (order) => {
    const dateOnly = formatReturnDate(order.createdDate);
    return (
      <div
        key={order.returnOrderId}
        className="admin-mobile-card cursor-pointer"
        onClick={() =>
          router.push(`/admin/returnorderdetails/${order.returnOrderId}`)
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-sm font-bold text-[#b4233a]">{order.code}</span>
            <div className="mt-1 text-xs text-[#667085]">{dateOnly}</div>
          </div>
          <StatusBadge
            tone={
              order.state === "PENDING"
                ? "pending"
                : order.state === "APPROVED"
                  ? "approved"
                  : order.state === "REJECTED"
                    ? "rejected"
                    : order.state === "REFUNDED"
                      ? "refunded"
                      : "cancelled"
            }
          >
            {t(order.state)}
          </StatusBadge>
        </div>
        <div className="mt-3 flex items-center gap-3 border-t border-[#eef1f6] pt-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e4e8f0] bg-[#f8fafc] text-[10px] font-bold text-[#667085]">
            <FaUserLarge />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#101828]">
              {(order.user?.firstName ?? "") +
                " " +
                (order.user?.lastName ?? "")}
            </p>
            <p className="truncate text-xs text-[#667085]">
              {order.user?.email}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#eef1f6] pt-3">
          <span className="break-words text-base font-bold text-[#101828]">
            {Number(order.unitPrice ?? 0).toLocaleString("en-US")}{" "}
            <span className="text-xs font-medium text-[#667085]">
              {t("currency")}
            </span>
          </span>
          <span className="max-w-[45%] truncate text-end text-xs font-semibold text-[#667085]">
            {t(order.reason).length <= 30
              ? t(order.reason)
              : `${t(order.reason).slice(0, 30)} ...`}
          </span>
        </div>
      </div>
    );
  };

  const toolbar = (
    <DataTableToolbar
      table={tableState.table}
      searchValue={tableState.globalFilter}
      onSearchChange={tableState.setGlobalFilter}
      leading={
        <ReturnStateFilter
          value={stateValue}
          onChange={applyStateFilter}
          t={t}
        />
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
      mobileWrapperClassName="lg:hidden mt-3 rounded-2xl border border-[#e4e8f0] bg-[#f8fafc] p-3"
      desktopWrapperClassName="admin-table-shell hidden lg:block max-h-[600px] mt-3 w-full min-w-0 overflow-x-auto overflow-y-auto"
      tableClassName="admin-table min-w-[800px]"
      rowClassName="cursor-pointer"
      emptyMessage={t("no_data")}
    />
  );
}
