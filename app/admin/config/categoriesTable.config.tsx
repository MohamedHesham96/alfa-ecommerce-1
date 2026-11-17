import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";
import { MdDelete, MdEdit } from "react-icons/md";

import { getThumbnailUrl } from "../../../utils/functions.jsx";
import type { ItemCategorySummary } from "../types/api.types";

interface CategoryColumnActions {
  t: (key: string) => string;
  locale: string;
  onOpen: (category: ItemCategorySummary) => void;
  onEdit: (categoryId: number) => void;
  onDelete: (categoryId: number) => void;
}

export function createCategoryColumns({
  t,
  locale,
  onOpen,
  onEdit,
  onDelete,
}: CategoryColumnActions): ColumnDef<ItemCategorySummary, unknown>[] {
  return [
    {
      id: "image",
      header: t("image"),
      meta: {
        headerClassName: "w-[90px]",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <button
          type="button"
          className="block"
          onClick={() => onOpen(row.original)}
          aria-label={t("image")}
        >
          {row.original.imageURL ? (
            <Image
              alt=""
              src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${getThumbnailUrl(
                row.original.imageURL ?? "",
              )}`}
              width={48}
              height={48}
              className="h-11 w-11 rounded-xl border border-[#e4e8f0] bg-white object-cover p-0.5"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#e4e8f0] bg-[#f8fafc] text-[9px] text-[#98a2b3]">
              {t("no_image")}
            </div>
          )}
        </button>
      ),
    },
    {
      id: "name",
      accessorFn: (row) => (locale === "ar" ? row.nameAr : row.nameEn),
      header: t("category_name_capetal"),
      meta: {
        backendField: locale === "ar" ? "nameAr" : "nameEn",
        dataType: "STRING",
        searchable: true,
        sortable: true,
        filterable: true,
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <button
          type="button"
          className="min-w-0 text-start"
          onClick={() => onOpen(row.original)}
        >
          <p className="truncate text-sm font-semibold text-[#101828]">
            {locale === "ar" ? row.original.nameAr : row.original.nameEn}
          </p>
          <p className="mt-0.5 text-xs text-[#667085]">{t("main_category")}</p>
        </button>
      ),
    },
    {
      id: "itemsCount",
      header: t("products_count"),
      meta: {
        headerClassName: "w-[120px]",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#f3c6cd] bg-[#fbeff2] px-2.5 py-1 text-xs font-semibold text-[#b4233a]"
          onClick={() => onOpen(row.original)}
        >
          <span className="text-sm font-bold">{row.original.itemsCount ?? 0}</span>
          <span className="text-[10px] font-medium">{t("products_category")}</span>
        </button>
      ),
    },
    {
      id: "actions",
      header: "",
      meta: {
        headerClassName: "w-[100px]",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="admin-action-icon !text-[#1d4ed8] hover:!bg-[#eef4ff]"
            title={t("edit")}
            aria-label={t("edit")}
            onClick={() => onEdit(row.original.itemCategoryId)}
          >
            <MdEdit className="text-base" />
          </button>
          <button
            type="button"
            className="admin-action-icon !text-[#b4233a] hover:!bg-[#fbeff2]"
            title={t("delete")}
            aria-label={t("delete")}
            onClick={() => onDelete(row.original.itemCategoryId)}
          >
            <MdDelete className="text-base" />
          </button>
        </div>
      ),
    },
  ];
}
