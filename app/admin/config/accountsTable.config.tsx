import type { ColumnDef } from "@tanstack/react-table";
import { ImBlocked } from "react-icons/im";

import type { AdminUserRow } from "../types/api.types";
import StatusBadge from "../components/ui/StatusBadge";

interface AccountColumnActions {
  mode: "admin" | "user";
  t: (key: string) => string;
  onOpen: (userId: number) => void;
  onToggleBlocked: (userId: number, blocked: boolean) => void;
}

function formatDate(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-GB");
}

function initials(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "U";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function createAccountColumns({
  mode,
  t,
  onOpen,
  onToggleBlocked,
}: AccountColumnActions): ColumnDef<AdminUserRow, unknown>[] {
  const columns: ColumnDef<AdminUserRow, unknown>[] = [
    {
      id: "status",
      header: t("status"),
      meta: {
        backendField: "active",
        dataType: "BOOLEAN",
        filterable: true,
        headerClassName: "w-[130px]",
        cellClassName: "",
      },
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-2">
            <StatusBadge tone={user.active ? "success" : "neutral"}>
              {user.active ? t("active") : t("inactive")}
            </StatusBadge>
            <button
              type="button"
              aria-label={
                user.blocked ? t("activate") : t("deactivate")
              }
              title={user.blocked ? t("activate") : t("deactivate")}
              className={`admin-action-icon ${
                user.blocked
                  ? "!text-[var(--admin-danger-text)] hover:!bg-[var(--admin-danger-soft)]"
                  : "hover:!text-[var(--admin-danger-text)]"
              }`}
              onClick={(event) => {
                event.stopPropagation();
                onToggleBlocked(user.userId, !user.blocked);
              }}
            >
              <ImBlocked />
            </button>
          </div>
        );
      },
    },
    {
      id: "identity",
      accessorFn: (row) => row.firstName,
      header: mode === "admin" ? t("admin") : t("User"),
      meta: {
        backendField: "firstName",
        dataType: "STRING",
        sortable: true,
        filterable: true,
        headerClassName: "",
        cellClassName: "",
      },
      cell: ({ row }) => {
        const user = row.original;
        const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
        return (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-[11px] font-bold text-[var(--admin-ink-soft)]">
              {initials(fullName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--admin-ink)]">
                {fullName}
              </p>
              <p className="truncate text-xs text-[var(--admin-muted)]">
                {mode === "admin" ? user.email : user.username}
              </p>
            </div>
          </div>
        );
      },
    },
  ];

  if (mode === "admin") {
    columns.push(
      {
        id: "username",
        accessorKey: "username",
        header: t("username"),
        meta: {
          backendField: "username",
          dataType: "STRING",
          sortable: true,
          filterable: true,
          headerClassName: "",
          cellClassName: "",
        },
        cell: ({ row }) => (
          <span className="text-sm text-[var(--admin-muted)]">
            {row.original.username}
          </span>
        ),
      },
      {
        id: "lastLoginDate",
        accessorKey: "lastLoginDate",
        header: t("last_login"),
        meta: {
          backendField: "lastLoginDate",
          dataType: "DATETIME",
          sortable: true,
          filterable: true,
          headerClassName: "",
          cellClassName: "text-sm",
        },
        cell: ({ row }) => (
          <div className="text-sm text-[var(--admin-muted)]">
            {formatDate(row.original.lastLoginDate)}
          </div>
        ),
      },
    );
  } else {
    columns.push(
      {
        id: "email",
        accessorKey: "email",
        header: t("email"),
        meta: {
          backendField: "email",
          dataType: "STRING",
          sortable: true,
          filterable: true,
          headerClassName: "",
          cellClassName: "",
        },
        cell: ({ row }) => (
          <span className="text-sm text-[var(--admin-muted)]">
            {row.original.email ?? "--"}
          </span>
        ),
      },
      {
        id: "registrationDate",
        accessorKey: "registrationDate",
        header: t("registered-on"),
        meta: {
          backendField: "registrationDate",
          dataType: "DATETIME",
          sortable: true,
          filterable: true,
          headerClassName: "",
          cellClassName: "text-sm",
        },
        cell: ({ row }) => (
          <div className="text-sm text-[var(--admin-muted)]">
            {formatDate(row.original.registrationDate)}
          </div>
        ),
      },
      {
        id: "ordersCount",
        header: t("orders"),
        meta: {
          headerClassName: "w-[110px]",
          cellClassName: "",
        },
        cell: ({ row }) => (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--admin-ink-soft)]"
            onClick={() => onOpen(row.original.userId)}
          >
            <span className="text-sm font-bold text-[var(--admin-ink)]">
              {row.original.ordersCount ?? 0}
            </span>
            <span className="text-[11px] text-[var(--admin-muted)]">{t("orders")}</span>
          </button>
        ),
      },
    );
  }

  return columns;
}

export { formatDate as formatAccountDate };
