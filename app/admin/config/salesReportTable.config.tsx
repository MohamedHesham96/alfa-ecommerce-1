import type { ColumnDef } from "@tanstack/react-table";

import StatusBadge from "../components/ui/StatusBadge";
import type { SalesOrderRow } from "../types/salesReport.types";
import {
  customerLabel,
  formatMoney,
  formatNumber,
  formatOrderDate,
  orderDisplayDate,
  orderStateTone,
} from "../Reports/Sales/salesReportUtils";

interface SalesReportColumnActions {
  t: (key: string) => string;
  locale: string;
  currency: string;
  timezone?: string;
  onOpen: (orderId: number) => void;
}

export function createSalesReportColumns({
  t,
  locale,
  currency,
  timezone,
  onOpen,
}: SalesReportColumnActions): ColumnDef<SalesOrderRow, unknown>[] {
  return [
    {
      id: "code",
      accessorKey: "code",
      header: t("sales_report_order_number"),
      meta: {
        backendField: "code",
        sortable: true,
        headerClassName: "min-w-[150px]",
      },
      cell: ({ row }) => (
        <button
          type="button"
          className="text-sm font-bold text-[var(--admin-danger-text)] hover:underline"
          onClick={() => onOpen(row.original.orderId)}
        >
          {row.original.code}
        </button>
      ),
    },
    {
      id: "createdDate",
      accessorKey: "createdDate",
      header: `${t("sales_report_order_date")}${
        timezone ? ` (${timezone})` : ""
      }`,
      meta: {
        backendField: "createdDate",
        sortable: true,
        headerClassName: "min-w-[150px]",
        cellClassName: "text-sm text-[var(--admin-muted)]",
      },
      cell: ({ row }) =>
        formatOrderDate(orderDisplayDate(row.original), locale),
    },
    {
      id: "customer",
      accessorFn: (row) => customerLabel(row.customer),
      header: t("sales_report_customer"),
      meta: {
        backendField: "customer",
        sortable: true,
        headerClassName: "min-w-[190px]",
      },
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold text-[var(--admin-ink)]">
              {customerLabel(order.customer)}
            </p>
            <p className="break-words text-xs text-[var(--admin-muted)]">
              {order.customer?.email || order.customer?.username || ""}
            </p>
          </div>
        );
      },
    },
    {
      id: "state",
      accessorKey: "state",
      header: t("sales_report_order_status"),
      meta: { backendField: "state", sortable: true, headerClassName: "min-w-[130px]" },
      cell: ({ row }) => (
        <StatusBadge tone={orderStateTone(row.original.state)}>
          {t(row.original.state)}
        </StatusBadge>
      ),
    },
    {
      id: "paymentMethod",
      accessorKey: "paymentMethod",
      header: t("sales_report_payment_method"),
      meta: {
        backendField: "paymentMethod",
        sortable: true,
        headerClassName: "min-w-[150px]",
      },
      cell: ({ row }) =>
        row.original.paymentMethod ? t(row.original.paymentMethod) : "—",
    },
    {
      id: "fulfillmentType",
      accessorKey: "fulfillmentType",
      header: t("sales_report_fulfillment_type"),
      meta: {
        backendField: "fulfillmentType",
        sortable: true,
        headerClassName: "min-w-[130px]",
      },
      cell: ({ row }) =>
        row.original.fulfillmentType ? t(row.original.fulfillmentType) : "—",
    },
    {
      id: "itemsCount",
      accessorKey: "itemsCount",
      header: t("sales_report_items_count"),
      meta: {
        backendField: "itemsCount",
        sortable: true,
        align: "right",
        headerClassName: "min-w-[100px]",
      },
      cell: ({ row }) => formatNumber(row.original.itemsCount, locale),
    },
    {
      id: "subtotal",
      accessorKey: "subtotal",
      header: t("sales_report_subtotal"),
      meta: {
        backendField: "subtotal",
        sortable: true,
        align: "right",
        headerClassName: "min-w-[130px]",
      },
      cell: ({ row }) => formatMoney(row.original.subtotal, locale, currency),
    },
    {
      id: "discount",
      accessorKey: "discount",
      header: t("sales_report_discount"),
      meta: {
        backendField: "discount",
        sortable: true,
        align: "right",
        headerClassName: "min-w-[120px]",
      },
      cell: ({ row }) => formatMoney(row.original.discount, locale, currency),
    },
    {
      id: "shipping",
      accessorKey: "shipping",
      header: t("sales_report_shipping"),
      meta: {
        backendField: "shipping",
        sortable: true,
        align: "right",
        headerClassName: "min-w-[120px]",
      },
      cell: ({ row }) => formatMoney(row.original.shipping, locale, currency),
    },
    {
      id: "total",
      accessorKey: "total",
      header: t("sales_report_total"),
      meta: {
        backendField: "total",
        sortable: true,
        align: "right",
        headerClassName: "min-w-[130px]",
      },
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm font-bold text-[var(--admin-ink)]">
          {formatMoney(row.original.total, locale, currency)}
        </span>
      ),
    },
  ];
}
