"use client";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaUserLarge } from "react-icons/fa6";

import { useLanguage } from "../../../../context/LanguageContext.js";
import { useIdContext } from "../../../../context/idContext.jsx";
import { useNamePageInAdminContext } from "../../../../context/namePageInAdmin.jsx";
import { postRequest } from "../../../../utils/requestsUtils.js";
import { DataTable, DataTableToolbar } from "../../components/data-table";
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
      <div
        key={order.orderId}
        className="mb-3 cursor-pointer rounded-xl border bg-white p-3 hover:bg-gray-50"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0" onClick={() => openOrder(order.orderId)}>
            <span className="text-sm font-bold text-red-600">{order.code}</span>
            <div className="mt-1 text-xs text-gray-500">{dateOnly}</div>
          </div>
          {mode === "admin" ? (
            <span className="w-[150px] shrink-0">
              <OrderStatusSelect
                order={order}
                t={t}
                onChange={(state) => updateOrderState(order.orderId, state)}
                className="w-full text-sm font-semibold xs:text-xs"
              />
            </span>
          ) : (
            <span
              className={`shrink-0 text-xs font-semibold ${
                order.state === "PROCESSING"
                  ? "text-blue-500"
                  : order.state === "SHIPPED"
                    ? "text-yellow-500"
                    : order.state === "PENDING"
                      ? "text-orange-500"
                      : order.state === "DELIVERED"
                        ? "text-green-500"
                        : "text-red-500"
              }`}
            >
              {t(order.state)}
            </span>
          )}
        </div>

        {mode === "admin" &&
        order.state !== "CANCELLED" &&
        order.state !== "DELIVERED" ? (
          <div className="flex w-full items-end justify-end">
            <button
              type="button"
              className="mt-2 flex items-center justify-center rounded-3xl border border-red-700 bg-red-100 px-4 py-1 text-center font-semibold text-red-700 hover:bg-red-200 xs:text-xs md:text-sm"
              onClick={(event) => {
                event.stopPropagation();
                cancelOrder(order.orderId);
              }}
            >
              {t("order_cancel")}
            </button>
          </div>
        ) : null}

        <div
          className="mt-3 flex cursor-pointer items-center gap-3 border-t pt-3"
          onClick={() => openOrder(order.orderId)}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-gray-50 p-2 text-gray-600">
            <FaUserLarge />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">
              {(order.user?.firstName ?? "") +
                " " +
                (order.user?.lastName ?? "")}
            </h1>
            <h1 className="truncate text-xs text-gray-500">
              {order.user?.email}
            </h1>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-3">
            <span
              className="cursor-pointer rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600"
              onClick={() => openOrder(order.orderId)}
            >
              {order.orderItemLines?.length ?? 0} {t("items")}
            </span>
            <span className="break-words text-base font-bold">
              {Number(
                (mode === "admin" ? order.netTotal : order.total) ?? 0,
              ).toLocaleString("en-US")}{" "}
              {t("currency")}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const toolbar = (
    <DataTableToolbar
      table={tableState.table}
      searchValue={tableState.globalFilter}
      onSearchChange={tableState.setGlobalFilter}
      className="!p-4"
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
          ? "lg:hidden mt-5"
          : "lg:hidden mt-5 h-[500px] w-full overflow-x-scroll overflow-y-scroll rounded-xl border"
      }
      desktopWrapperClassName={
        mode === "admin"
          ? "hidden lg:block h-[520px] border-t mt-3 w-full overflow-y-scroll"
          : "hidden lg:block mt-5 h-[500px] w-full overflow-x-scroll overflow-y-scroll rounded-xl border"
      }
      tableClassName={mode === "admin" ? "w-full h-auto" : "w-full"}
      headerClassName="bg-[#f0eff0] text-xs text-justify sticky top-0 z-10"
      rowClassName="text-red-950 border-t w-full hover:bg-gray-50 cursor-pointer"
      emptyMessage={t("no_data")}
    />
  );
}
