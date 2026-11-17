import type { ColumnDef } from "@tanstack/react-table";
import { MdEdit } from "react-icons/md";

import type { PickupPlaceRow } from "../types/api.types";
import StatusBadge from "../components/ui/StatusBadge";

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
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--admin-ink)]">
            {row.original.name}
          </p>
          <p className="mt-1 max-w-[360px] text-xs leading-5 text-[var(--admin-muted)]">
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
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <div className="max-w-[320px] text-sm leading-6 text-[var(--admin-ink-soft)]">
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
        headerClassName: "",
        cellClassName: "text-sm",
      },
      cell: ({ row }) => (
        <span dir="ltr" className="text-[var(--admin-ink-soft)]">
          {row.original.phone}
        </span>
      ),
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
        headerClassName: "",
        cellClassName: "text-sm",
      },
      cell: ({ row }) => (
        <span className="text-[var(--admin-ink-soft)]">{row.original.workingHours}</span>
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
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onToggleActive(row.original)}
          title={row.original.active ? t("deactivate") : t("activate")}
          aria-label={row.original.active ? t("deactivate") : t("activate")}
        >
          <StatusBadge tone={row.original.active ? "success" : "neutral"}>
            {row.original.active
              ? t("active_pickup_place")
              : t("inactive_pickup_place")}
          </StatusBadge>
        </button>
      ),
    },
    {
      id: "actions",
      header: "",
      meta: {
        headerClassName: "w-[190px]",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="admin-action-edit"
            onClick={() => onEdit(row.original)}
          >
            <MdEdit className="text-sm" />
            <span className="hidden xl:inline">{t("edit")}</span>
          </button>
          <button
            type="button"
            className={
              row.original.active
                ? "inline-flex h-8 items-center justify-center rounded-lg border border-[var(--admin-warning-border)] bg-[var(--admin-warning-soft)] px-2.5 text-xs font-semibold text-[var(--admin-warning-text)] transition-colors hover:bg-[var(--admin-warning-border-soft)]"
                : "inline-flex h-8 items-center justify-center rounded-lg border border-[var(--admin-success-border)] bg-[var(--admin-success-soft)] px-2.5 text-xs font-semibold text-[var(--admin-success-text)] transition-colors hover:bg-[var(--admin-success-border-soft)]"
            }
            onClick={() => onToggleActive(row.original)}
          >
            {row.original.active ? t("deactivate") : t("activate")}
          </button>
        </div>
      ),
    },
  ];
}
