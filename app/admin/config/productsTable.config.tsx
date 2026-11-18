import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";
import { GoStarFill } from "react-icons/go";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { MdBlock, MdDelete } from "react-icons/md";

import { getThumbnailUrl } from "../../../utils/functions.jsx";
import type { ProductRow } from "../types/api.types";
import type { FilterCondition } from "../types/table.types";

export const PRODUCTS_ENDPOINT = "/api/admin/items/search";
export const PRODUCTS_PAGE_SIZE = 10;

export function buildCategoryProductsFilters(
  categoryId: number | string,
): FilterCondition[] {
  return [
    {
      field: "itemCategory.itemCategoryId",
      operator: "EQUALS",
      value: categoryId,
    },
  ];
}

export interface ProductsColumnActions {
  t: (key: string) => string;
  locale: string;
  onToggleFavorite: (itemId: number, favorite: boolean) => void;
  onToggleActive: (itemId: number, active: boolean) => void;
  onToggleAvailable: (itemId: number, available: boolean) => void;
  onDelete: (product: ProductRow) => void;
}

export function createProductsColumns({
  t,
  locale,
  onToggleFavorite,
  onToggleActive,
  onToggleAvailable,
  onDelete,
}: ProductsColumnActions): ColumnDef<ProductRow, unknown>[] {
  const isArabic = locale === "ar";
  // Filters and sorting must target the same language the admin sees.
  const productNameField = isArabic ? "nameAr" : "nameEn";
  const categoryNameField = isArabic
    ? "itemCategory.nameAr"
    : "itemCategory.nameEn";
  const productName = (product: ProductRow) =>
    isArabic ? product.nameAr : product.nameEn;
  const categoryName = (product: ProductRow) =>
    isArabic
      ? product.itemCategory?.nameAr
      : product.itemCategory?.nameEn;

  return [
    {
      id: "status",
      header: t("status"),
      meta: {
        backendField: "active",
        dataType: "BOOLEAN",
        filterable: true,
        sortable: false,
        headerClassName: "w-[170px]",
        cellClassName: "",
      },
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              title={product.active ? t("deactivate") : t("activate")}
              aria-label={product.active ? t("deactivate") : t("activate")}
              onClick={(event) => {
                event.stopPropagation();
                onToggleActive(product.itemId, !product.active);
              }}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                product.active
                  ? "border-[var(--admin-success-border)] bg-[var(--admin-success-soft)] text-[var(--admin-success-text)]"
                  : "border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  product.active ? "bg-[var(--admin-success)]" : "bg-[var(--admin-muted-soft)]"
                }`}
                aria-hidden="true"
              />
              {!product.active && !isArabic ? t("inactive") : t("active")}
            </button>
            <button
              type="button"
              title={t("featured-product")}
              aria-label={t("featured-product")}
              onClick={(event) => {
                event.stopPropagation();
                onToggleFavorite(product.itemId, !product.favorite);
              }}
              className={`admin-action-icon ${
                product.favorite
                  ? "!text-[var(--admin-warning-text)] hover:!bg-[var(--admin-warning-soft)]"
                  : "!text-[var(--admin-muted-soft)]"
              }`}
            >
              <GoStarFill />
            </button>
            <button
              type="button"
              title={product.available ? t("available_in_store") : t("Currently_unavailable")}
              aria-label={product.available ? t("available_in_store") : t("Currently_unavailable")}
              onClick={(event) => {
                event.stopPropagation();
                onToggleAvailable(product.itemId, !product.available);
              }}
              className="admin-action-icon"
            >
              {product.available ? (
                <IoCheckmarkCircleOutline className="text-lg text-[var(--admin-success)]" />
              ) : (
                <MdBlock className="text-[var(--admin-danger)]" />
              )}
            </button>
          </div>
        );
      },
    },
    {
      id: "product",
      accessorKey: productNameField,
      header: t("PRODUCT_NAME"),
      meta: {
        backendField: productNameField,
        dataType: "STRING",
        searchable: true,
        sortable: true,
        filterable: true,
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => {
        const product = row.original;
        const imageUrl = product.images?.[0]?.imageUrl;
        return (
          <div className="flex min-w-0 items-center gap-3">
            {imageUrl ? (
              <Image
                alt=""
                src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${getThumbnailUrl(
                  imageUrl,
                )}`}
                width={50}
                height={50}
                className="h-10 w-10 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] object-cover p-0.5"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-[9px] text-[var(--admin-muted-soft)]">
                {t("no_image")}
              </div>
            )}
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold text-[var(--admin-ink)]">
                {productName(product)}
              </p>
              <p className="break-words text-xs text-[var(--admin-muted)]">
                {t("code")}: {product.code}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: "category",
      accessorFn: (row) => categoryName(row),
      header: t("product_category"),
      meta: {
        backendField: categoryNameField,
        dataType: "STRING",
        sortable: true,
        filterable: true,
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--admin-ink-soft)]">
          {categoryName(row.original) || "--"}
        </span>
      ),
    },
    {
      id: "price",
      accessorKey: "price",
      header: t("price"),
      meta: {
        backendField: "price",
        dataType: "NUMBER",
        sortable: true,
        filterable: true,
        headerClassName: "",
        cellClassName: "text-sm font-bold",
      },
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-[var(--admin-ink)]">
          {Number(row.original.price).toLocaleString("en-US")}{" "}
          <span className="text-xs font-medium text-[var(--admin-muted)]">
            {t("currency")}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      meta: {
        headerClassName: "w-[70px]",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <button
          type="button"
          className="admin-action-icon !text-[var(--admin-danger-text)] hover:!bg-[var(--admin-danger-soft)]"
          title={t("delete")}
          aria-label={t("delete")}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(row.original);
          }}
        >
          <MdDelete className="text-base" />
        </button>
      ),
    },
  ];
}
