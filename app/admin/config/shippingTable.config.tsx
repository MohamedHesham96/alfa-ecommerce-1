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
        headerClassName: "p-5",
        cellClassName: "font-semibold px-5",
      },
      cell: ({ row }) =>
        locale === "ar"
          ? row.original.governorate?.nameAr
          : row.original.governorate?.nameEn,
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
        cellClassName: "font-semibold px-5",
      },
      cell: ({ row }) => row.original.shippingCost,
    },
    {
      id: "actions",
      header: "",
      meta: {
        headerClassName: "",
        cellClassName: "text-2xl",
      },
      cell: ({ row }) => (
        <button
          type="button"
          className="rounded-full p-2 text-red-600 hover:bg-red-200"
          onClick={() => onEdit(row.original)}
        >
          <BiEdit />
        </button>
      ),
    },
  ];
}
