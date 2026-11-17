"use client";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaUserLarge } from "react-icons/fa6";

import { useLanguage } from "../../../../context/LanguageContext.js";
import { useIdContext } from "../../../../context/idContext.jsx";
import { useNamePageInAdminContext } from "../../../../context/namePageInAdmin.jsx";
import { postRequest } from "../../../../utils/requestsUtils.js";
import { DataTable, DataTableToolbar } from "../../components/data-table";
import StatusBadge from "../../components/ui/StatusBadge";
import { useServerDataTable } from "../../hooks/useServerDataTable";
import {
  createOrderColumns,
  formatOrderDate,
  OrderStateFilter,
  OrderStatusSelect,
} from "../../config/ordersTable.config";

const ADMIN_PAGE_SIZE = 15;
const USER_PAGE_SIZE = 10;

export default function Orders_Table({ mode = "admin", userId }) {
  const { t } = useLanguage();
  const router = useRouter();
  const { selectedState, setSelectedState } = useIdContext();
  const { setSelectedNamePage } = useNamePageInAdminContext();
  const setItemsRef = useRef(null);

  const openOrder = useCallback(
    (orderId) => {
      router.push(`/admin/orders/OrdersDetails/${orderId}`);
      setSelectedNamePage("Orders Management");
    },
    [router, setSelectedNamePage],
  );

  const updateOrderState = useCallback(
    async (orderId, newState) => {
      try {
        const res = await postRequest(
          `/api/admin/orders/${orderId}/changeState/${newState}`,
          "",
          t("message"),
        );
        if (res?.success === true) {
          setItemsRef.current?.((prev) =>
            prev.map((item) =>
              item.orderId === orderId ? { ...item, state: newState } : item,
            ),
          );
        }
      } catch (error) {
        // Shared request utility already surfaces the error.
      }
    },
    [t],
  );

  const cancelOrder = useCallback(
    async (orderId) => {
      try {
        const res = await postRequest(
          `/api/admin/orders/${orderId}/changeState/CANCELLED`,
          "",
          t("message"),
        );
        if (res) {
          setItemsRef.current?.((prev) =>
            prev.map((order) =>
              order.orderId === orderId
                ? { ...order, state: "CANCELLED" }
                : order,
            ),
          );
        }
      } catch (error) {
        // Shared request utility already surfaces the error.
      }
    },
    [t],
  );

  const columns = useMemo(
    () =>
      createOrderColumns({
        mode,
        t,
        onOpen: openOrder,
        onUpdateState: updateOrderState,
        onCancel: cancelOrder,
      }),
    [mode, t, openOrder, updateOrderState, cancelOrder],
  );

  const baseFilters = useMemo(
    () =>
      mode === "user" && userId
        ? [{ field: "userId", operator: "EQUALS", value: userId }]
        : [],
    [mode, userId],
  );

  const initialFilters = useMemo(() => {
    if (mode !== "admin" || !selectedState) return [];
    return [
      {
        id: "state",
        value: { operator: "EQUALS", value: selectedState },
      },
    ];
  }, [mode, selectedState]);

  const tableState = useServerDataTable({
    endpoint: "/api/admin/orders/search",
    columns,
    pageSize: mode === "admin" ? ADMIN_PAGE_SIZE : USER_PAGE_SIZE,
    baseFilters,
    initialFilters,
    getRowId: (order) => String(order.orderId),
  });

  useEffect(() => {
    setItemsRef.current = tableState.setItems;
  }, [tableState.setItems]);

  const stateValue =
    tableState.columnFilters.find((filter) => filter.id === "state")?.value
      ?.value ?? "";

  const applyStateFilter = (value) => {
    tableState.setColumnFilters((prev) => {
      const others = prev.filter((filter) => filter.id !== "state");
      return value
        ? [
            ...others,
            { id: "state", value: { operator: "EQUALS", value } },
          ]
        : others;
    });
    if (mode === "admin") setSelectedState(value);
  };

  const renderMobileCard = (order) => {
    const dateOnly = formatOrderDate(order.createdDate);
    return (
      <div key={order.orderId} className="admin-mobile-card">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            className="min-w-0 text-start"
            onClick={() => openOrder(order.orderId)}
          >
            <span className="text-sm font-bold text-[#b4233a]">{order.code}</span>
            <span className="mt-1 block text-xs text-[#667085]">{dateOnly}</span>
          </button>
          {mode === "admin" ? (
            <span className="w-[160px] shrink-0">
              <OrderStatusSelect
                order={order}
                t={t}
                onChange={(state) => updateOrderState(order.orderId, state)}
                className="w-full text-xs font-semibold"
              />
            </span>
          ) : (
            <StatusBadge
              tone={
                order.state === "PROCESSING"
                  ? "processing"
                  : order.state === "SHIPPED"
                    ? "shipped"
                    : order.state === "PENDING"
                      ? "pending"
                      : order.state === "DELIVERED"
                        ? "delivered"
                        : "cancelled"
              }
            >
              {t(order.state)}
            </StatusBadge>
          )}
        </div>

        <button
          type="button"
          className="mt-3 flex w-full cursor-pointer items-center gap-3 border-t border-[#eef1f6] pt-3 text-start"
          onClick={() => openOrder(order.orderId)}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e4e8f0] bg-[#f8fafc] text-[10px] font-bold text-[#667085]">
            <FaUserLarge />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-[#101828]">
              {(order.user?.firstName ?? "") +
                " " +
                (order.user?.lastName ?? "")}
            </span>
            <span className="block truncate text-xs text-[#667085]">
              {order.user?.email}
            </span>
          </span>
        </button>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f6] pt-3">
          <span className="inline-flex items-center rounded-full border border-[#f3c6cd] bg-[#fbeff2] px-2.5 py-1 text-xs font-semibold text-[#b4233a]">
            {order.orderItemLines?.length ?? 0} {t("items")}
          </span>
          <span className="break-words text-base font-bold text-[#101828]">
            {Number(
              (mode === "admin" ? order.netTotal : order.total) ?? 0,
            ).toLocaleString("en-US")}{" "}
            <span className="text-xs font-medium text-[#667085]">
              {t("currency")}
            </span>
          </span>
        </div>

        {mode === "admin" &&
        order.state !== "CANCELLED" &&
        order.state !== "DELIVERED" ? (
          <div className="mt-3 flex justify-end border-t border-[#eef1f6] pt-3">
            <button
              type="button"
              className="admin-action-delete"
              onClick={(event) => {
                event.stopPropagation();
                cancelOrder(order.orderId);
              }}
            >
              {t("order_cancel")}
            </button>
          </div>
        ) : null}
      </div>
    );
  };

  const toolbar = (
    <DataTableToolbar
      table={tableState.table}
      searchValue={tableState.globalFilter}
      onSearchChange={tableState.setGlobalFilter}
      leading={
        <OrderStateFilter
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
      mobileWrapperClassName={
        mode === "admin"
          ? "lg:hidden mt-3 rounded-2xl border border-[#e4e8f0] bg-[#f8fafc] p-3"
          : "lg:hidden mt-3 rounded-2xl border border-[#e4e8f0] bg-[#f8fafc] p-3"
      }
      desktopWrapperClassName="admin-table-shell hidden lg:block max-h-[600px] mt-3 w-full overflow-x-auto overflow-y-auto"
      tableClassName="admin-table"
      rowClassName="cursor-pointer"
      emptyMessage={t("no_data")}
    />
  );
}
