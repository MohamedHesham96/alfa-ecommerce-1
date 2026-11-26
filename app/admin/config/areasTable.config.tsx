import type { ColumnDef } from "@tanstack/react-table";
import { BiEdit, BiTrash } from "react-icons/bi";

import type { AreaRow } from "../types/api.types";

interface AreaColumnActions {
  t: (key: string) => string;
  locale: string;
  onEdit: (area: AreaRow) => void;
  onDelete: (area: AreaRow) => void;
}

export function createAreaColumns({
  t,
  locale,
  onEdit,
  onDelete,
}: AreaColumnActions): ColumnDef<AreaRow, unknown>[] {
  const areaNameField = locale === "ar" ? "nameAr" : "nameEn";
  const governorateNameField =
    locale === "ar" ? "governorate.nameAr" : "governorate.nameEn";

  return [
    {
      id: "areaName",
      accessorFn: (row) =>
        locale === "ar" ? row.nameAr : row.nameEn,
      header: t("area"),
      meta: {
        backendField: areaNameField,
        dataType: "STRING",
        searchable: true,
        sortable: true,
        filterable: true,
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-[var(--admin-ink)]">
          {locale === "ar" ? row.original.nameAr : row.original.nameEn}
        </span>
      ),
    },
    {
      id: "governorate",
      accessorFn: (row) =>
        locale === "ar"
          ? row.governorate?.nameAr
          : row.governorate?.nameEn,
      header: t("governorate"),
      meta: {
        backendField: governorateNameField,
        dataType: "STRING",
        searchable: true,
        sortable: true,
        filterable: true,
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--admin-ink-soft)]">
          {locale === "ar"
            ? row.original.governorate?.nameAr
            : row.original.governorate?.nameEn}
        </span>
      ),
    },
    {
      id: "shippingCost",
      accessorKey: "shippingCost",
      header: t("shippingCost"),
      meta: {
        backendField: "shippingCost",
        dataType: "NUMBER",
        sortable: true,
        filterable: true,
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm font-bold text-[var(--admin-ink)]">
          {Number(row.original.shippingCost ?? 0).toLocaleString("en-US")}{" "}
          <span className="text-xs font-medium text-[var(--admin-muted)]">
            {t("currency")}
          </span>
        </span>
      ),
    },
    {
      id: "createdDate",
      accessorKey: "createdDate",
      header: t("created_date"),
      meta: {
        backendField: "createdDate",
        dataType: "DATETIME",
        sortable: true,
        filterable: false,
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs text-[var(--admin-muted)]">
          {row.original.createdDate
            ? new Date(row.original.createdDate).toLocaleDateString(
                locale === "ar" ? "ar-EG" : "en-GB",
              )
            : "--"}
        </span>
      ),
    },
    {
      id: "modifiedDate",
      accessorKey: "modifiedDate",
      header: t("updated_date"),
      meta: {
        backendField: "modifiedDate",
        dataType: "DATETIME",
        sortable: true,
        filterable: false,
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs text-[var(--admin-muted)]">
          {row.original.modifiedDate
            ? new Date(row.original.modifiedDate).toLocaleDateString(
                locale === "ar" ? "ar-EG" : "en-GB",
              )
            : "--"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      meta: {
        headerClassName: "w-[120px]",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="admin-action-icon !text-[var(--admin-info-text)] hover:!bg-[var(--admin-info-soft)]"
            onClick={() => onEdit(row.original)}
            title={t("edit")}
            aria-label={t("edit")}
          >
            <BiEdit className="text-lg" />
          </button>
          <button
            type="button"
            className="admin-action-icon !text-[var(--admin-danger-text)] hover:!bg-[var(--admin-danger-soft)]"
            onClick={() => onDelete(row.original)}
            title={t("delete")}
            aria-label={t("delete")}
          >
            <BiTrash className="text-lg" />
          </button>
        </div>
      ),
    },
  ];
}
