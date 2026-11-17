"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { useLanguage } from "../../../../../context/LanguageContext.js";
import { getRequest } from "../../../../../utils/requestsUtils.js";
import { useOrderDetailsContext } from "../../../../../context/orderDetailsContext.jsx";
import { useIdContext } from "../../../../../context/idContext.jsx";
import { DataTable } from "../../../components/data-table";
import FormProduct from "../../../Products/components/ProductForm";
import {
  createOrderItemColumns,
  createReturnItemColumns,
  ItemImage,
} from "../../../config/orderItemsTable.config";

export default function OrdersItems({ orderId, orderType }) {
  const { t, locale } = useLanguage();
  const { setSelectedProductId } = useIdContext();
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [reasonMessage, setReasonMessage] = useState();
  const [itemPrice, setItemPrice] = useState();
  const [itemQuantity, setItemQuantity] = useState();
  const [loading, setLoading] = useState(true);
  const { setSelectedOrderState } = useOrderDetailsContext();
  const { setSelectedOrderCode } = useOrderDetailsContext();
  const { setSelectedOrderDate } = useOrderDetailsContext();
  const { setOrderSummary } = useOrderDetailsContext();

  const orderItem = useCallback(async () => {
    try {
      setLoading(true);
      const adminBasePath =
        orderType === "orders" ? "/api/admin/orders" : "/api/admin/return-orders";
      const res = await getRequest(`${adminBasePath}/${orderId}`);
      const resData = res.data;
      const lines =
        orderType === "orders"
          ? (resData.orderItemLines ?? [])
          : resData.item
            ? [{ ...resData, item: resData.item }]
            : [];
      setOrderItems(lines);
      setOrderSummary({
        itemCount: lines.reduce(
          (total, line) => total + Number(line.quantity ?? 0),
          0,
        ),
        total: resData.total,
        discount: resData.totalDiscount,
        shippingCost: resData.shippingCost,
        netTotal:
          resData.netTotal ??
          Number(resData.total ?? 0) + Number(resData.shippingCost ?? 0),
        paymentMethod: resData.paymentMethod,
        fulfillmentType: resData.fulfillmentType || "DELIVERY",
      });
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
    setOrderSummary,
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

  const openProduct = useCallback(
    (line) => {
      const productId = line?.item?.itemId ?? line?.itemId;
      if (!productId) return;
      setSelectedProductId(productId);
      setIsProductFormOpen(true);
    },
    [setSelectedProductId],
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
        <div
          className="admin-mobile-card cursor-pointer"
          onClick={() => openProduct(item)}
        >
          <div className="flex items-start gap-3">
            <ItemImage imageUrl={item.item?.images?.[0]?.imageUrl} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--admin-ink)]">
                {locale === "ar" ? item.item?.nameAr : item.item?.nameEn}
              </p>
              <p className="truncate text-xs text-[var(--admin-muted)]">
                {item.item?.code}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--admin-border-subtle)] pt-3">
            <div>
              <div className="text-sm font-semibold text-[var(--admin-ink)]">
                {Number(item.unitPrice ?? 0).toLocaleString("en-US")}{" "}
                {t("currency")}
              </div>
              <div className="text-xs line-through text-[var(--admin-muted-soft)]">
                {Number(item.oldUnitPrice ?? 0).toLocaleString("en-US")}{" "}
                {t("currency")}
              </div>
            </div>
            <div className="shrink-0 text-xs text-[var(--admin-muted)]">
              {t("quantity")}: {item.quantity}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[var(--admin-border-subtle)] pt-3">
            <span className="text-xs text-[var(--admin-muted)]">{t("total")}</span>
            <span className="text-base font-bold text-[var(--admin-ink)]">
              {Number(item.totalPrice ?? 0).toLocaleString("en-US")}{" "}
              {t("currency")}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        className="admin-mobile-card cursor-pointer"
        onClick={() => openProduct(item)}
      >
        <div className="flex items-start gap-3">
          <ItemImage imageUrl={item.item?.images?.[0]?.imageUrl} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--admin-ink)]">
              {locale === "ar" ? item.item?.nameAr : item.item?.nameEn}
            </p>
            <p className="truncate text-xs text-[var(--admin-muted)]">
              {item.item?.code}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--admin-border-subtle)] pt-3">
          <div className="text-sm font-semibold text-[var(--admin-ink)]">
            {Number(itemPrice ?? 0).toLocaleString("en-US")} {t("currency")}
          </div>
          <div className="shrink-0 text-xs text-[var(--admin-muted)]">
            {t("quantity")}: {itemQuantity}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {isProductFormOpen ? (
        <FormProduct
          isFormOpen={isProductFormOpen}
          setIsFormOpen={setIsProductFormOpen}
          isEditMode
          setIsEditMode={() => {}}
        />
      ) : null}
      <section className="admin-card min-w-0 w-full overflow-hidden">
        <div className="admin-card-header !px-4 !py-2.5">
          <div>
            <h2 className="admin-card-title">{t("items_in_order")}</h2>
            <p className="admin-card-description">{t("order_summary")}</p>
          </div>
          {orderType !== "orders" && reasonMessage ? (
            <span className="admin-badge admin-badge-amber">
              {t("reasonMessage")}: {reasonMessage}
            </span>
          ) : null}
        </div>
        <div className="p-3">
          <DataTable
            table={table}
            loading={loading}
            mobileCard={renderMobileCard}
            onRowClick={openProduct}
            mobileWrapperClassName="lg:hidden"
            desktopWrapperClassName="hidden lg:block max-h-[435px] w-full overflow-x-auto overflow-y-auto rounded-xl border border-[var(--admin-border)]"
            tableClassName="admin-table min-w-[640px]"
            showInfiniteFooter={false}
            emptyMessage={t("no_data")}
          />
        </div>
      </section>
    </>
  );
}
