import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";
import { MdDelete, MdEdit } from "react-icons/md";

import { getThumbnailUrl } from "../../../utils/functions.jsx";
import type { ItemCategorySummary } from "../types/api.types";

interface CategoryColumnActions {
  t: (key: string) => string;
  locale: string;
  onOpen: (categoryId: number) => void;
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
        headerClassName: "px-5",
        cellClassName: "px-4",
      },
      cell: ({ row }) => (
        <span className="w-[100px]" onClick={() => onOpen(row.original.itemCategoryId)}>
          {row.original.imageURL ? (
            <Image
              alt=""
              src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${getThumbnailUrl(
                row.original.imageURL ?? "",
              )}`}
              width={40}
              height={40}
              className="my-1 rounded-xl border p-1 xs:h-10 xs:w-10 md:h-16 md:w-16"
            />
          ) : (
            <div className="my-1 flex h-10 w-10 items-center justify-center rounded-xl border bg-gray-100 text-[10px] text-gray-400 md:h-16 md:w-16">
              {t("no_image")}
            </div>
          )}
        </span>
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
        <div onClick={() => onOpen(row.original.itemCategoryId)}>
          <h1 className="font-semibold xs:text-xs md:text-sm">
            {locale === "ar" ? row.original.nameAr : row.original.nameEn}
          </h1>
          <h1 className="xs:text-[10px] md:text-xs">{t("main_category")}</h1>
        </div>
      ),
    },
    {
      id: "itemsCount",
      header: t("products_count"),
      meta: {
        headerClassName: "px-5",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <div
          className="w-[60px] rounded-full bg-red-100 px-2 text-center font-semibold text-red-600 xs:text-[10px] md:w-[80px] md:text-xs"
          onClick={() => onOpen(row.original.itemCategoryId)}
        >
          <h1>{row.original.itemsCount ?? 0}</h1>
          <h2>{t("products_category")}</h2>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      meta: {
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <div className="flex gap-5">
          <button
            type="button"
            className="flex items-center gap-1 rounded-md bg-blue-300 px-2 py-1 text-sm font-semibold text-blue-800 hover:bg-blue-400"
            onClick={() => onEdit(row.original.itemCategoryId)}
          >
            <MdEdit />
            <h1 className="xs:hidden md:block">{t("edit")}</h1>
          </button>
          <button
            type="button"
            className="flex items-center gap-1 rounded-md bg-red-300 px-2 py-1 text-sm font-semibold text-red-800 hover:bg-red-400"
            onClick={() => onDelete(row.original.itemCategoryId)}
          >
            <MdDelete />
            <h1 className="xs:hidden md:block">{t("delete")}</h1>
          </button>
        </div>
      ),
    },
  ];
}
