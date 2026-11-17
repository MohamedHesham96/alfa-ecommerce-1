import type { ColumnDef } from "@tanstack/react-table";
import Select from "react-select";

import type { ReturnOrderRow } from "../types/api.types";
import StatusBadge from "../components/ui/StatusBadge";

interface ReturnColumnActions {
  t: (key: string) => string;
  onOpen: (returnOrderId: number) => void;
}

const RETURN_STATES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "REFUNDED",
  "CANCELLED",
];

const RETURN_REASONS = [
  "DAMAGED",
  "DEFECTIVE",
  "WRONG_ITEM",
  "MISSING_ACCESSORIES",
  "NOT_AS_DESCRIBED",
  "PERFORMANCE_ISSUES",
  "CONNECTIVITY_ISSUES",
  "COMPATIBILITY_ISSUES",
  "SOFTWARE_ISSUES",
  "CHANGED_MIND",
  "FOUND_BETTER_PRICE",
  "ORDERED_BY_MISTAKE",
  "ARRIVED_LATE",
  "WARRANTY_CLAIM",
  "OTHER",
];

const RETURN_STATE_TONES: Record<string, string> = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
};

export function formatReturnDate(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-GB");
}

export function ReturnStateFilter({
  value,
  onChange,
  t,
}: {
  value: string;
  onChange: (value: string) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="min-w-[170px]">
      <Select
        value={value ? { value, label: t(value) } : null}
        onChange={(option) => onChange(option?.value ?? "")}
        options={[
          { value: "", label: t("all_statuses") },
          ...RETURN_STATES.map((state) => ({
            value: state,
            label: t(state),
          })),
        ]}
        placeholder={t("all_statuses")}
        isClearable
        isSearchable={false}
        className="text-sm font-semibold"
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: "#ffffff",
            border: "1px solid #d3d9e5",
            borderRadius: "10px",
            minHeight: "40px",
            cursor: "pointer",
            boxShadow: "none",
            "&:hover": { borderColor: "#c3cbd9" },
          }),
          valueContainer: (base) => ({ ...base, paddingInline: "0.65rem" }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
              ? "#cf4356"
              : state.isFocused
                ? "#fbeff2"
                : "#ffffff",
            color: state.isSelected ? "#ffffff" : "#344054",
            cursor: "pointer",
            fontSize: "13px",
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 20px 50px -20px rgba(15,23,42,0.35)",
            zIndex: 9999,
            overflow: "hidden",
          }),
          placeholder: (base) => ({
            ...base,
            color: "#667085",
            fontSize: "13px",
            fontWeight: "600",
          }),
          singleValue: (base) => ({
            ...base,
            color: "#344054",
            fontSize: "13px",
            fontWeight: "600",
          }),
          input: (base) => ({ ...base, color: "#344054" }),
          clearIndicator: (base) => ({ ...base, color: "#98a2b3" }),
          dropdownIndicator: (base) => ({ ...base, color: "#98a2b3" }),
        }}
      />
    </div>
  );
}

export function createReturnColumns({
  t,
  onOpen,
}: ReturnColumnActions): ColumnDef<ReturnOrderRow, unknown>[] {
  return [
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
          className="text-sm font-bold text-[#b4233a] hover:underline"
          onClick={() => onOpen(row.original.returnOrderId)}
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
        cellClassName: "text-sm text-[#667085]",
      },
      cell: ({ row }) => formatReturnDate(row.original.createdDate),
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
            onClick={() => onOpen(order.returnOrderId)}
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[#e4e8f0] bg-[#f8fafc] text-[10px] font-bold text-[#667085]">
              {(order.user?.firstName?.[0] ?? "U").toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-[#101828]">
                {(order.user?.firstName ?? "") +
                  " " +
                  (order.user?.lastName ?? "")}
              </span>
              <span className="block truncate text-xs text-[#667085]">
                {order.user?.email}
              </span>
            </span>
          </button>
        );
      },
    },
    {
      id: "unitPrice",
      accessorKey: "unitPrice",
      header: t("price"),
      meta: {
        backendField: "unitPrice",
        dataType: "NUMBER",
        sortable: true,
        filterable: true,
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm font-bold text-[#101828]">
          {Number(row.original.unitPrice ?? 0).toLocaleString("en-US")}{" "}
          <span className="text-xs font-medium text-[#667085]">
            {t("currency")}
          </span>
        </span>
      ),
    },
    {
      id: "reason",
      accessorKey: "reason",
      header: t("Reason_for_return"),
      meta: {
        backendField: "reason",
        dataType: "ENUM",
        sortable: true,
        filterable: true,
        filterOptions: RETURN_REASONS.map((reason) => ({
          value: reason,
          label: t(reason),
        })),
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => {
        const reason = t(row.original.reason);
        return (
          <span
            className="block max-w-[220px] truncate text-xs font-medium text-[#475467]"
            title={reason}
          >
            {reason.length <= 30 ? reason : `${reason.slice(0, 30)} ...`}
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
        filterOptions: RETURN_STATES.map((state) => ({
          value: state,
          label: t(state),
        })),
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => (
        <StatusBadge tone={RETURN_STATE_TONES[row.original.state] ?? "neutral"}>
          {t(row.original.state)}
        </StatusBadge>
      ),
    },
  ];
}
