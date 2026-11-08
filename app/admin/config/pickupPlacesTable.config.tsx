import type { ColumnDef } from "@tanstack/react-table";
import { MdEdit } from "react-icons/md";

import type { PickupPlaceRow } from "../types/api.types";

interface PickupPlaceColumnActions {
  t: (key: string) => string;
  locale: string;
  onEdit: (place: PickupPlaceRow) => void;
  onToggleActive: (place: PickupPlaceRow) => void;
}

export function createPickupPlaceColumns({
  t,
  locale,
  onEdit,
  onToggleActive,
}: PickupPlaceColumnActions): ColumnDef<PickupPlaceRow, unknown>[] {
  return [
    {
      id: "name",
      accessorKey: "name",
      header: t("pickup_place_name"),
      meta: {
        backendField: "name",
        dataType: "STRING",
        searchable: true,
        sortable: true,
        filterable: true,
        headerClassName: "px-4",
        cellClassName: "px-4",
      },
      cell: ({ row }) => (
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-gray-900">
            {row.original.name}
          </h1>
          <p className="mt-1 max-w-[360px] text-xs leading-5 text-gray-500">
            {row.original.description}
          </p>
        </div>
      ),
    },
    {
      id: "address",
      accessorKey: "address",
      header: t("address"),
      meta: {
        backendField: "address",
        dataType: "STRING",
        searchable: true,
        sortable: true,
        filterable: true,
        headerClassName: "px-4",
        cellClassName: "px-4",
      },
      cell: ({ row }) => (
        <div className="max-w-[320px] text-sm leading-6 text-gray-700">
          {row.original.address}
        </div>
      ),
    },
    {
      id: "phone",
      accessorKey: "phone",
      header: t("phoneNumber"),
      meta: {
        backendField: "phone",
        dataType: "STRING",
        searchable: true,
        sortable: true,
        filterable: true,
        headerClassName: "px-4",
        cellClassName: "px-4 text-sm",
      },
      cell: ({ row }) => <span dir="ltr">{row.original.phone}</span>,
    },
    {
      id: "workingHours",
      accessorKey: "workingHours",
      header: t("working_hours"),
      meta: {
        backendField: "workingHours",
        dataType: "STRING",
        sortable: true,
        filterable: true,
        headerClassName: "px-4",
        cellClassName: "px-4 text-sm",
      },
      cell: ({ row }) => (
        <span className="text-gray-700">{row.original.workingHours}</span>
      ),
    },
    {
      id: "active",
      accessorKey: "active",
      header: t("status"),
      meta: {
        backendField: "active",
        dataType: "BOOLEAN",
        sortable: true,
        filterable: true,
        headerClassName: "px-4",
        cellClassName: "px-4",
      },
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onToggleActive(row.original)}
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            row.original.active
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-gray-300 bg-gray-100 text-gray-600"
          }`}
          title={
            row.original.active ? t("deactivate") : t("activate")
          }
        >
          {row.original.active
            ? t("active_pickup_place")
            : t("inactive_pickup_place")}
        </button>
      ),
    },
    {
      id: "actions",
      header: "",
      meta: {
        headerClassName: "px-4",
        cellClassName: "px-4",
      },
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1 rounded-md bg-blue-300 px-2 py-1 text-sm font-semibold text-blue-800 hover:bg-blue-400"
            onClick={() => onEdit(row.original)}
          >
            <MdEdit />
            <span className="xs:hidden md:block">{t("edit")}</span>
          </button>
          <button
            type="button"
            className={`rounded-md px-2 py-1 text-xs font-semibold ${
              row.original.active
                ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                : "bg-green-100 text-green-800 hover:bg-green-200"
            }`}
            onClick={() => onToggleActive(row.original)}
          >
            {row.original.active ? t("deactivate") : t("activate")}
          </button>
        </div>
      ),
    },
  ];
}
