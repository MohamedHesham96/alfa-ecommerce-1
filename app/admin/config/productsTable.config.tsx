import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";
import { FaCircle } from "react-icons/fa";
import { GoStarFill } from "react-icons/go";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { MdBlock, MdDelete } from "react-icons/md";

import { getThumbnailUrl } from "../../../utils/functions.jsx";
import type { ProductRow } from "../types/api.types";

export interface ProductsColumnActions {
  t: (key: string) => string;
  locale: string;
  onOpen: (itemId: number) => void;
  onToggleFavorite: (itemId: number, favorite: boolean) => void;
  onToggleActive: (itemId: number, active: boolean) => void;
  onToggleAvailable: (itemId: number, available: boolean) => void;
  onDelete: (product: ProductRow) => void;
}

export function createProductsColumns({
  t,
  locale,
  onOpen,
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
      header: "",
      meta: {
        backendField: "active",
        dataType: "BOOLEAN",
        filterable: true,
        sortable: false,
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              className={`flex items-center justify-center gap-3 text-sm ${
                product.active ? "text-green-600" : "text-gray-600"
              }`}
              onClick={(event) => {
                event.stopPropagation();
                onToggleActive(product.itemId, !product.active);
              }}
            >
              <FaCircle />
            </button>
            <button
              type="button"
              className={`flex items-center justify-center ${
                product.favorite ? "text-yellow-500" : "text-gray-500"
              }`}
              onClick={(event) => {
                event.stopPropagation();
                onToggleFavorite(product.itemId, !product.favorite);
              }}
            >
              <GoStarFill />
            </button>
            <button
              type="button"
              className="flex items-center justify-center"
              onClick={(event) => {
                event.stopPropagation();
                onToggleAvailable(product.itemId, !product.available);
              }}
            >
              {product.available ? (
                <IoCheckmarkCircleOutline className="text-lg text-green-500" />
              ) : (
                <MdBlock className="text-red-500" />
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
        cellClassName: "flex items-center gap-4",
      },
      cell: ({ row }) => {
        const product = row.original;
        const imageUrl = product.images?.[0]?.imageUrl;
        return (
          <div
            className="flex items-center gap-4"
            onClick={() => onOpen(product.itemId)}
          >
            {imageUrl ? (
              <Image
                alt=""
                src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${getThumbnailUrl(
                  imageUrl,
                )}`}
                width={50}
                height={50}
                className="my-1 h-10 w-10 rounded-xl border p-1 md:h-14 md:w-14"
              />
            ) : (
              <div className="my-1 flex h-10 w-10 items-center justify-center rounded-xl border bg-gray-100 text-[10px] text-gray-400 md:h-14 md:w-14">
                {t("no_image")}
              </div>
            )}
            <div>
              <h1 className="text-sm font-semibold">{productName(product)}</h1>
              <h1 className="text-xs text-gray-500">
                {t("code")} : {product.code}
              </h1>
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
        <div
          className="mx-1 text-sm font-semibold text-gray-500"
          onClick={() => onOpen(row.original.itemId)}
        >
          <h1>{categoryName(row.original)}</h1>
        </div>
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
        <div onClick={() => onOpen(row.original.itemId)}>
          {Number(row.original.price).toLocaleString("en-US")}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      meta: {
        headerClassName: "w-[10%]",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <button
          type="button"
          className="flex items-center gap-1 rounded-md bg-red-300 px-2 py-1 text-sm font-semibold text-red-800 hover:bg-red-400"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(row.original);
          }}
        >
          <MdDelete />
          {t("delete")}
        </button>
      ),
    },
  ];
}
