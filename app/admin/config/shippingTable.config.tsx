import type { ColumnDef } from "@tanstack/react-table";
import { BiEdit } from "react-icons/bi";

import type { ShippingRateRow } from "../types/api.types";

interface ShippingColumnActions {
  t: (key: string) => string;
  locale: string;
  onEdit: (rate: ShippingRateRow) => void;
}

export function createShippingColumns({
  t,
  locale,
  onEdit,
}: ShippingColumnActions): ColumnDef<ShippingRateRow, unknown>[] {
  return [
    {
      id: "governorate",
      accessorFn: (row) =>
        locale === "ar" ? row.governorate?.nameAr : row.governorate?.nameEn,
      header: t("governorate"),
      meta: {
        backendField:
          locale === "ar" ? "governorate.nameAr" : "governorate.nameEn",
        dataType: "STRING",
        searchable: true,
        sortable: true,
        filterable: true,
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-[var(--admin-ink)]">
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
      id: "actions",
      header: "",
      meta: {
        headerClassName: "w-[80px]",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <button
          type="button"
          className="admin-action-icon !text-[var(--admin-info-text)] hover:!bg-[var(--admin-info-soft)]"
          onClick={() => onEdit(row.original)}
          title={t("edit")}
          aria-label={t("edit")}
        >
          <BiEdit className="text-lg" />
        </button>
      ),
    },
  ];
}
