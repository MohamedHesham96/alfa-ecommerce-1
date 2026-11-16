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
        <div className="mx-2 my-3 rounded-xl border bg-white p-3">
          <div className="flex items-start gap-3">
            <ItemImage imageUrl={item.item?.images?.[0]?.imageUrl} />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold">
                {locale === "ar" ? item.item?.nameAr : item.item?.nameEn}
              </h1>
              <h1 className="truncate text-xs text-gray-500">
                {item.item?.code}
              </h1>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
            <div>
              <div className="text-sm font-semibold">
                {Number(item.unitPrice ?? 0).toLocaleString("en-US")}{" "}
                {t("currency")}
              </div>
              <div className="text-xs line-through">
                {Number(item.oldUnitPrice ?? 0).toLocaleString("en-US")}{" "}
                {t("currency")}
              </div>
            </div>
            <div className="shrink-0 text-sm text-gray-500">
              {t("quantity")} : {item.quantity}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <div className="text-base font-bold">
              {t("total")} :{" "}
              {Number(item.totalPrice ?? 0).toLocaleString("en-US")}{" "}
              {t("currency")}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-2 my-3 rounded-xl border bg-white p-3">
        <div className="flex items-start gap-3">
          <ItemImage imageUrl={item.item?.images?.[0]?.imageUrl} />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">
              {locale === "ar" ? item.item?.nameAr : item.item?.nameEn}
            </h1>
            <h1 className="truncate text-xs text-gray-500">
              {item.item?.code}
            </h1>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
          <div className="text-sm font-semibold">
            {Number(itemPrice ?? 0).toLocaleString("en-US")} {t("currency")}
          </div>
          <div className="shrink-0 text-sm text-gray-500">
            {t("quantity")} : {itemQuantity}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex h-16 items-center justify-between rounded-t-lg border-l border-r border-t bg-white px-6 xs:text-sm md:text-base">
        <h1
          className={`xs:text-sm md:text-base ${
            orderType === "orders" ? "hidden" : "block"
          }`}
        >
          {t("reasonMessage")}: {reasonMessage}
        </h1>
        <div className={orderType === "orders" ? "block" : "hidden"}>
          {t("shippingCost")}:{" "}
          <span className="font-semibold xs:text-base md:text-lg">
            {Number(shippingCost ?? 0).toLocaleString("en-US")}{" "}
            {t("currency")}
          </span>{" "}
        </div>
        <div>
          {t("total")}:{" "}
          <span className="font-semibold text-[#CD4354] xs:text-base md:text-lg">
            {Number(orderTotalPrice ?? 0).toLocaleString("en-US")}{" "}
            {t("currency")}
          </span>
        </div>
      </div>
      <div
        className={`w-full border ${
          orderType === "orders"
            ? "h-[435px] overflow-hidden overflow-x-scroll overflow-y-scroll"
            : ""
        }`}
      >
        <DataTable
          table={table}
          loading={loading}
          mobileCard={renderMobileCard}
          mobileWrapperClassName="lg:hidden"
          desktopWrapperClassName="hidden lg:block w-full"
          tableClassName="w-full h-auto rounded-lg"
          headerClassName="text-xs bg-[#f0eff0] text-justify"
          rowClassName="border-b w-full"
          showInfiniteFooter={false}
          emptyMessage={t("no_data")}
        />
      </div>
    </div>
  );
}
