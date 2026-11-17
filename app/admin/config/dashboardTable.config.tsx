import type { ColumnDef } from "@tanstack/react-table";

import type { PendingOrderRow } from "../types/api.types";
import StatusBadge from "../components/ui/StatusBadge";

interface DashboardColumnActions {
  t: (key: string) => string;
  onOpen: (orderId: number) => void;
}

function formatDate(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-GB");
}

export function createDashboardColumns({
  t,
  onOpen,
}: DashboardColumnActions): ColumnDef<PendingOrderRow, unknown>[] {
  return [
    {
      id: "orderCode",
      accessorKey: "orderCode",
      header: t("order_id"),
      meta: {
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <button
          type="button"
          className="text-sm font-bold text-[#b4233a] hover:underline"
          onClick={() => onOpen(row.original.orderId)}
        >
          {row.original.orderCode}
        </button>
      ),
    },
    {
      id: "createdDate",
      accessorKey: "createdDate",
      header: t("date"),
      meta: {
        headerClassName: "",
        cellClassName: "text-sm text-[#667085]",
      },
      cell: ({ row }) => formatDate(row.original.createdDate),
    },
    {
      id: "user",
      header: t("user"),
      meta: {
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => {
        const order = row.original;
        return (
          <button
            type="button"
            className="flex min-w-0 items-center gap-3 text-start"
            onClick={() => onOpen(order.orderId)}
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[#e4e8f0] bg-[#f8fafc] text-[10px] font-bold text-[#667085]">
              {(order.userName?.[0] ?? "U").toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-[#101828]">
                {order.userName}
              </span>
              <span className="block truncate text-xs text-[#667085]">
                {order.userEmail}
              </span>
            </span>
          </button>
        );
      },
    },
    {
      id: "orderTotal",
      accessorKey: "orderTotal",
      header: t("total"),
      meta: {
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm font-bold text-[#101828]">
          {Number(row.original.orderTotal ?? 0).toLocaleString("en-US")}{" "}
          <span className="text-xs font-medium text-[#667085]">
            {t("currency")}
          </span>
        </span>
      ),
    },
    {
      id: "state",
      accessorKey: "state",
      header: t("state_order"),
      meta: {
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <StatusBadge
          tone={
            row.original.state === "PROCESSING"
              ? "processing"
              : row.original.state === "SHIPPED"
                ? "shipped"
                : row.original.state === "PENDING"
                  ? "pending"
                  : row.original.state === "DELIVERED"
                    ? "delivered"
                    : "cancelled"
          }
        >
          {t(row.original.state)}
        </StatusBadge>
      ),
    },
  ];
}
