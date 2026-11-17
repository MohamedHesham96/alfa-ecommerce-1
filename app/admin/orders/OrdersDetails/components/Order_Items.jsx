"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { useLanguage } from "../../../../../context/LanguageContext.js";
import { getRequest } from "../../../../../utils/requestsUtils.js";
import { useOrderDetailsContext } from "../../../../../context/orderDetailsContext.jsx";
import { DataTable } from "../../../components/data-table";
import {
  createOrderItemColumns,
  createReturnItemColumns,
  ItemImage,
} from "../../../config/orderItemsTable.config";

export default function OrdersItems({ orderId, orderType }) {
  const { t, locale } = useLanguage();
  const [orderItems, setOrderItems] = useState([]);
  const [reasonMessage, setReasonMessage] = useState();
  const [itemPrice, setItemPrice] = useState();
  const [shippingCost, setShippingCost] = useState();
  const [itemQuantity, setItemQuantity] = useState();
  const [loading, setLoading] = useState(true);
  const { setSelectedOrderState } = useOrderDetailsContext();
  const { setSelectedOrderCode } = useOrderDetailsContext();
  const { setSelectedOrderDate } = useOrderDetailsContext();
  const [orderTotalPrice, setOrderTotalPrice] = useState("");

  const orderItem = useCallback(async () => {
    try {
      setLoading(true);
      const adminBasePath =
        orderType === "orders" ? "/api/admin/orders" : "/api/admin/return-orders";
      const res = await getRequest(`${adminBasePath}/${orderId}`);
      const resData = res.data;
      setOrderItems(
        orderType === "orders"
          ? resData.orderItemLines ?? []
          : resData.item
            ? [{ ...resData, item: resData.item }]
            : [],
      );
      setOrderTotalPrice(
        orderType === "orders" ? resData.netTotal : resData.refundAmount,
      );
      setShippingCost(resData.shippingCost);
      setReasonMessage(resData.reasonMessage);
      setItemPrice(orderType === "orders" ? "" : resData.unitPrice);
      setItemQuantity(orderType === "orders" ? "" : resData.quantity);
      setSelectedOrderState(resData.state);
      setSelectedOrderDate(resData.createdDate);
      setSelectedOrderCode(resData.code);
    } finally {
      setLoading(false);
    }
  }, [
    orderType,
    orderId,
    setSelectedOrderState,
    setSelectedOrderDate,
    setSelectedOrderCode,
  ]);

  useEffect(() => {
    orderItem();
  }, [orderItem]);

  const columns = useMemo(
    () =>
      orderType === "orders"
        ? createOrderItemColumns({ t, locale })
        : createReturnItemColumns({ t, locale }),
    [orderType, t, locale],
  );

  const table = useReactTable({
    data: orderItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row, index) => String(row.itemLineId ?? index),
  });

  const renderMobileCard = (item) => {
    if (orderType === "orders") {
      return (
        <div className="admin-mobile-card">
          <div className="flex items-start gap-3">
            <ItemImage imageUrl={item.item?.images?.[0]?.imageUrl} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#101828]">
                {locale === "ar" ? item.item?.nameAr : item.item?.nameEn}
              </p>
              <p className="truncate text-xs text-[#667085]">
                {item.item?.code}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#eef1f6] pt-3">
            <div>
              <div className="text-sm font-semibold text-[#101828]">
                {Number(item.unitPrice ?? 0).toLocaleString("en-US")}{" "}
                {t("currency")}
              </div>
              <div className="text-xs line-through text-[#98a2b3]">
                {Number(item.oldUnitPrice ?? 0).toLocaleString("en-US")}{" "}
                {t("currency")}
              </div>
            </div>
            <div className="shrink-0 text-xs text-[#667085]">
              {t("quantity")}: {item.quantity}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#eef1f6] pt-3">
            <span className="text-xs text-[#667085]">{t("total")}</span>
            <span className="text-base font-bold text-[#101828]">
              {Number(item.totalPrice ?? 0).toLocaleString("en-US")}{" "}
              {t("currency")}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="admin-mobile-card">
        <div className="flex items-start gap-3">
          <ItemImage imageUrl={item.item?.images?.[0]?.imageUrl} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#101828]">
              {locale === "ar" ? item.item?.nameAr : item.item?.nameEn}
            </p>
            <p className="truncate text-xs text-[#667085]">
              {item.item?.code}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#eef1f6] pt-3">
          <div className="text-sm font-semibold text-[#101828]">
            {Number(itemPrice ?? 0).toLocaleString("en-US")} {t("currency")}
          </div>
          <div className="shrink-0 text-xs text-[#667085]">
            {t("quantity")}: {itemQuantity}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="admin-card min-w-0 w-full overflow-hidden">
      <div className="admin-card-header">
        <div>
          <h2 className="admin-card-title">{t("items_in_order")}</h2>
          <p className="admin-card-description">
            {t("order_summary")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {orderType !== "orders" ? (
            <span className="admin-badge admin-badge-amber">
              {t("reasonMessage")}: {reasonMessage}
            </span>
          ) : (
            <span className="admin-badge admin-badge-gray">
              {t("shippingCost")}:{" "}
              {Number(shippingCost ?? 0).toLocaleString("en-US")}{" "}
              {t("currency")}
            </span>
          )}
          <span className="admin-badge admin-badge-red !px-3 !py-1 text-xs">
            {t("total")}:{" "}
            {Number(orderTotalPrice ?? 0).toLocaleString("en-US")}{" "}
            {t("currency")}
          </span>
        </div>
      </div>
      <div className="p-3 sm:p-4">
        <DataTable
          table={table}
          loading={loading}
          mobileCard={renderMobileCard}
          mobileWrapperClassName="lg:hidden"
          desktopWrapperClassName="hidden lg:block max-h-[435px] w-full overflow-x-auto overflow-y-auto rounded-xl border border-[#e4e8f0]"
          tableClassName="admin-table min-w-[640px]"
          showInfiniteFooter={false}
          emptyMessage={t("no_data")}
        />
      </div>
    </section>
  );
}
