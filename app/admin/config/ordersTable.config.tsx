import type { ColumnDef } from "@tanstack/react-table";
import Select from "react-select";

import type { OrderRow } from "../types/api.types";
import StatusBadge from "../components/ui/StatusBadge";

interface OrderColumnActions {
  mode: "admin" | "user";
  t: (key: string) => string;
  onOpen: (orderId: number) => void;
  onUpdateState: (orderId: number, state: string) => void;
  onCancel: (orderId: number) => void;
}

const NEXT_STATES: Record<string, string[]> = {
  PENDING: ["PROCESSING"],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const STATE_COLORS: Record<string, string> = {
  PROCESSING: "var(--admin-info)",
  SHIPPED: "var(--admin-warning)",
  PENDING: "var(--admin-warning-text)",
  CANCELLED: "var(--admin-danger)",
  DELIVERED: "var(--admin-success)",
};

const STATE_TONES: Record<string, string> = {
  PROCESSING: "processing",
  SHIPPED: "shipped",
  PENDING: "pending",
  CANCELLED: "cancelled",
  DELIVERED: "delivered",
};

export function formatOrderDate(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-GB");
}

export function OrderStateFilter({
  value,
  onChange,
  t,
}: {
  value: string;
  onChange: (value: string) => void;
  t: (key: string) => string;
}) {
  const options = [
    { value: "", label: t("all_statuses") },
    { value: "PENDING", label: t("PENDING") },
    { value: "PROCESSING", label: t("PROCESSING") },
    { value: "SHIPPED", label: t("SHIPPED") },
    { value: "DELIVERED", label: t("DELIVERED") },
    { value: "CANCELLED", label: t("CANCELLED") },
  ];
  return (
    <div className="min-w-[170px]">
      <Select
        value={value ? { value, label: t(value) } : null}
        onChange={(option) => onChange(option?.value ?? "")}
        options={options}
        placeholder={t("all_statuses")}
        isClearable
        isSearchable={false}
        className="text-sm font-semibold"
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: "var(--admin-surface)",
            border: "1px solid var(--admin-border-strong)",
            borderRadius: "10px",
            minHeight: "40px",
            cursor: "pointer",
            boxShadow: "none",
            "&:hover": {
              borderColor: "var(--admin-info-border)",
              backgroundColor: "var(--admin-info-soft)",
            },
          }),
          valueContainer: (base) => ({ ...base, paddingInline: "0.65rem" }),
          option: (base, state) => ({
            ...base,
            margin: "2px 0",
            padding: "8px 10px",
            borderRadius: "7px",
            backgroundColor: state.isSelected
              ? "var(--admin-accent-solid)"
              : state.isFocused
                ? "var(--admin-info)"
                : "transparent",
            color: state.isSelected
              ? "var(--admin-on-accent)"
              : state.isFocused
                ? "var(--admin-surface)"
                : "var(--admin-ink-soft)",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            transition: "background-color 0.15s ease, color 0.15s ease",
          }),
          menu: (base) => ({
            ...base,
            marginTop: 2,
            padding: 4,
            backgroundColor: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            borderRadius: "10px",
            boxShadow: "var(--admin-shadow-popover)",
            zIndex: 9999,
            overflow: "hidden",
          }),
          menuList: (base) => ({ ...base, padding: 0 }),
          placeholder: (base) => ({
            ...base,
            color: "var(--admin-muted)",
            fontSize: "13px",
            fontWeight: "600",
          }),
          singleValue: (base) => ({
            ...base,
            color: "var(--admin-ink-soft)",
            fontSize: "13px",
            fontWeight: "600",
          }),
          input: (base) => ({ ...base, color: "var(--admin-ink-soft)" }),
          clearIndicator: (base) => ({ ...base, color: "var(--admin-muted-soft)" }),
          dropdownIndicator: (base) => ({ ...base, color: "var(--admin-muted-soft)" }),
        }}
      />
    </div>
  );
}

function statusSelect(
  order: OrderRow,
  t: (key: string) => string,
  onChange: (state: string) => void,
  className = "w-[190px] text-sm font-semibold",
) {
  return (
    <Select
      value={{ value: order.state, label: t(order.state) }}
      onChange={(option) => {
        if (option?.value) onChange(option.value);
      }}
      options={(NEXT_STATES[order.state] ?? []).map((state) => ({
        value: state,
        label: t(state),
      }))}
      isSearchable={false}
      className={className}
      styles={{
        control: (base) => ({
          ...base,
          backgroundColor: "var(--admin-surface-muted)",
          border: "1px solid var(--admin-border)",
          borderRadius: "9px",
          minHeight: "36px",
          cursor: "pointer",
          boxShadow: "none",
          "&:hover": {
            borderColor: "var(--admin-info-border)",
            backgroundColor: "var(--admin-info-soft)",
          },
          "&:focus": {
            borderColor: "var(--admin-accent)",
            boxShadow: "0 0 0 3px var(--admin-focus-ring)",
          },
        }),
        valueContainer: (base) => ({ ...base, paddingInline: "0.6rem" }),
        option: (base, state) => ({
          ...base,
          margin: "2px 0",
          padding: "8px 10px",
          borderRadius: "7px",
          backgroundColor: state.isSelected
            ? "var(--admin-accent-solid)"
            : state.isFocused
              ? "var(--admin-info)"
              : "transparent",
          color: state.isSelected
            ? "var(--admin-on-accent)"
            : state.isFocused
              ? "var(--admin-surface)"
              : "var(--admin-ink-soft)",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 600,
          transition: "background-color 0.15s ease, color 0.15s ease",
        }),
        menu: (base) => ({
          ...base,
          marginTop: 2,
          padding: 4,
          backgroundColor: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
          borderRadius: "10px",
          boxShadow: "var(--admin-shadow-popover)",
          zIndex: 9999,
          overflow: "hidden",
        }),
        menuList: (base) => ({ ...base, padding: 0 }),
        placeholder: (base) => ({
          ...base,
          color: "var(--admin-muted)",
          fontSize: "13px",
          fontWeight: "600",
        }),
        singleValue: (base) => ({
          ...base,
          color: STATE_COLORS[order.state] ?? "var(--admin-success)",
          fontSize: "13px",
          fontWeight: "700",
        }),
        input: (base) => ({ ...base, color: "var(--admin-ink-soft)" }),
        dropdownIndicator: (base) => ({ ...base, color: "var(--admin-muted-soft)" }),
        indicatorSeparator: () => ({ display: "none" }),
      }}
    />
  );
}

export function OrderStatusSelect({
  order,
  t,
  onChange,
  className,
}: {
  order: OrderRow;
  t: (key: string) => string;
  onChange: (state: string) => void;
  className?: string;
}) {
  return statusSelect(order, t, onChange, className);
}

export function createOrderColumns({
  mode,
  t,
  onOpen,
  onUpdateState,
  onCancel,
}: OrderColumnActions): ColumnDef<OrderRow, unknown>[] {
  const columns: ColumnDef<OrderRow, unknown>[] = [
    {
      id: "code",
      accessorKey: "code",
      header: t("order_id"),
      meta: {
        backendField: "code",
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
      header: t("date"),
      meta: {
        backendField: "createdDate",
        dataType: "DATETIME",
        sortable: true,
        filterable: true,
        headerClassName: "",
        cellClassName: "text-sm text-[var(--admin-muted)]",
      },
      cell: ({ row }) => formatOrderDate(row.original.createdDate),
    },
    {
      id: "user",
      accessorFn: (row) => row.user?.firstName,
      header: t("user"),
      meta: {
        backendField: "user.firstName",
        dataType: "STRING",
        sortable: true,
        filterable: true,
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
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-[10px] font-bold text-[var(--admin-muted)]">
              {(order.user?.firstName?.[0] ?? "U").toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block break-words text-sm font-semibold text-[var(--admin-ink)]">
                {(order.user?.firstName ?? "") +
                  " " +
                  (order.user?.lastName ?? "")}
              </span>
              <span className="block break-words text-xs text-[var(--admin-muted)]">
                {order.user?.email}
              </span>
            </span>
          </button>
        );
      },
    },
    {
      id: "items",
      header: t("items"),
      meta: {
        headerClassName: "w-[90px]",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <button
          type="button"
          className="inline-flex min-w-[44px] items-center justify-center rounded-full border border-[var(--admin-danger-border)] bg-[var(--admin-danger-soft)] px-2.5 py-1 text-xs font-bold text-[var(--admin-danger-text)]"
          onClick={() => onOpen(row.original.orderId)}
        >
          {row.original.orderItemLines?.length ?? 0}
        </button>
      ),
    },
    {
      id: "total",
      accessorFn: (row) => (mode === "admin" ? row.netTotal : row.total),
      header: t("total"),
      meta: {
        backendField: mode === "admin" ? "netTotal" : "total",
        dataType: "NUMBER",
        sortable: true,
        filterable: true,
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => {
        const value =
          mode === "admin" ? row.original.netTotal : row.original.total;
        return (
          <span className="whitespace-nowrap text-sm font-bold text-[var(--admin-ink)]">
            {Number(value ?? 0).toLocaleString("en-US")}{" "}
            <span className="text-xs font-medium text-[var(--admin-muted)]">
              {t("currency")}
            </span>
          </span>
        );
      },
    },
    {
      id: "state",
      accessorKey: "state",
      header: t("state_order"),
      meta: {
        backendField: "state",
        dataType: "ENUM",
        sortable: true,
        filterable: true,
        filterOptions: [
          "PENDING",
          "PROCESSING",
          "SHIPPED",
          "DELIVERED",
          "CANCELLED",
        ].map((state) => ({ value: state, label: t(state) })),
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => {
        const order = row.original;
        if (mode === "user") {
          return (
            <StatusBadge tone={STATE_TONES[order.state] ?? "neutral"}>
              {t(order.state)}
            </StatusBadge>
          );
        }
        return (
          <div
            data-row-click-ignore
            onClick={(event) => event.stopPropagation()}
          >
            {statusSelect(order, t, (state) =>
              onUpdateState(order.orderId, state),
            )}
          </div>
        );
      },
    },
  ];

  if (mode === "admin") {
    columns.push({
      id: "actions",
      header: "",
      meta: {
        headerClassName: "w-[120px]",
        cellClassName: "",
      },
      cell: ({ row }) => {
        const order = row.original;
        if (order.state === "CANCELLED" || order.state === "DELIVERED") {
          return null;
        }
        return (
          <button
            type="button"
            className="admin-action-delete"
            onClick={() => onCancel(order.orderId)}
          >
            {t("order_cancel")}
          </button>
        );
      },
    });
  }

  return columns;
}
