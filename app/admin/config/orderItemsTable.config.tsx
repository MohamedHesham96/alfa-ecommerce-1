import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";

import { getThumbnailUrl } from "../../../utils/functions.jsx";
import type { OrderItemLineRow, ReturnOrderRow } from "../types/api.types";

interface ItemColumnActions {
  t: (key: string) => string;
  locale: string;
}

function productName(
  locale: string,
  nameAr?: string | null,
  nameEn?: string | null,
) {
  return locale === "ar" ? nameAr : nameEn;
}

function ItemImage({
  imageUrl,
  size = 60,
  emptyLabel = "",
}: {
  imageUrl?: string | null;
  size?: number;
  emptyLabel?: string;
}) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {imageUrl ? (
        <Image
          alt=""
          src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${getThumbnailUrl(
            imageUrl,
          )}`}
          fill
          sizes={`${size}px`}
          className="rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-xl bg-[var(--admin-surface-sunken)]">
          <span className="text-[10px] text-[var(--admin-muted-soft)]">{emptyLabel}</span>
        </div>
      )}
    </div>
  );
}

export function createOrderItemColumns({
  t,
  locale,
}: ItemColumnActions): ColumnDef<OrderItemLineRow, unknown>[] {
  return [
    {
      id: "image",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center">
          <ItemImage
            size={42}
            imageUrl={row.original.item?.images?.[0]?.imageUrl}
            emptyLabel={t("no_image")}
          />
        </div>
      ),
    },
    {
      id: "product",
      header: t("product"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div>
            <h1 className="mx-2 font-semibold">
              {productName(
                locale,
                row.original.item?.nameAr,
                row.original.item?.nameEn,
              )}
            </h1>
            <h1 className="mx-2 text-sm text-[var(--admin-muted)]">
              {row.original.item?.code}
            </h1>
          </div>
        </div>
      ),
    },
    {
      id: "price",
      header: t("price"),
      cell: ({ row }) => (
        <div className="text-[var(--admin-muted)]">
          <span className="mx-1 font-semibold text-[var(--admin-ink)]">
            {Number(row.original.unitPrice ?? 0).toLocaleString("en-US")}{" "}
            {t("currency")}
          </span>
          <span className="text-sm line-through">
            {Number(row.original.oldUnitPrice ?? 0).toLocaleString("en-US")}{" "}
            {t("currency")}
          </span>
        </div>
      ),
    },
    {
      id: "quantity",
      header: t("quantity"),
      cell: ({ row }) => row.original.quantity,
    },
    {
      id: "total",
      header: t("total"),
      meta: { cellClassName: "text-[var(--admin-danger)] font-semibold text-center" },
      cell: ({ row }) =>
        `${Number(row.original.totalPrice ?? 0).toLocaleString("en-US")} ${t(
          "currency",
        )}`,
    },
  ];
}

export function createReturnItemColumns({
  t,
  locale,
}: ItemColumnActions): ColumnDef<ReturnOrderRow, unknown>[] {
  return [
    {
      id: "image",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <ItemImage
            size={42}
            imageUrl={row.original.item?.images?.[0]?.imageUrl}
            emptyLabel={t("no_image")}
          />
        </div>
      ),
    },
    {
      id: "product",
      header: t("product"),
      cell: ({ row }) => (
        <div>
          <h1 className="text-sm font-semibold">
            {productName(
              locale,
              row.original.item?.nameAr,
              row.original.item?.nameEn,
            )}
          </h1>
          <h1 className="text-xs text-[var(--admin-muted)]">{row.original.item?.code}</h1>
        </div>
      ),
    },
    {
      id: "price",
      header: t("price"),
      meta: { cellClassName: "text-sm font-semibold text-center" },
      cell: ({ row }) =>
        `${Number(row.original.unitPrice ?? 0).toLocaleString("en-US")} ${t(
          "currency",
        )}`,
    },
    {
      id: "quantity",
      header: t("quantity"),
      meta: { cellClassName: "text-sm text-center" },
      cell: ({ row }) => row.original.quantity,
    },
  ];
}

export { ItemImage };
