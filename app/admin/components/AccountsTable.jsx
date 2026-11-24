"use client";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaPlus } from "react-icons/fa";
import { ImBlocked } from "react-icons/im";

import { useLanguage } from "../../../context/LanguageContext.js";
import { useRefresh } from "../../../context/refreshContext.jsx";
import { useIdContext } from "../../../context/idContext.jsx";
import { postRequest } from "../../../utils/requestsUtils.js";
import { DataTable, DataTableToolbar } from "./data-table";
import { useServerDataTable } from "../hooks/useServerDataTable";
import {
  createAccountColumns,
  formatAccountDate,
} from "../config/accountsTable.config";
import StatusBadge from "./ui/StatusBadge";

const PAGE_SIZE = 15;

function initials(name) {
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

export default function AccountsTable({ mode, setIsFormOpen, onStatsChange }) {
  const { t, locale } = useLanguage();
  const { refreshKey } = useRefresh();
  const router = useRouter();
  const { setSelectedAdminId, setSelectedUserId } = useIdContext();
  const setItemsRef = useRef(null);

  const openAccount = useCallback(
    (userId) => {
      if (mode === "admin") {
        setIsFormOpen?.(true);
        setSelectedAdminId(userId);
        return;
      }
      setSelectedUserId(userId);
      router.push(`/admin/UsersPage/UserInfo/${userId}`);
    },
    [mode, router, setSelectedAdminId, setSelectedUserId, setIsFormOpen],
  );

  const toggleBlocked = useCallback(
    async (userId, blocked) => {
      const res = await postRequest(
        `/api/admin/users/${userId}/${blocked ? "block" : "unblock"}`,
        "",
        t("message"),
      );
      if (res) {
        setItemsRef.current?.((prev) =>
          prev.map((user) =>
            user.userId === userId ? { ...user, blocked } : user,
          ),
        );
        onStatsChange?.();
      }
    },
    [t, onStatsChange],
  );

  const columns = useMemo(
    () =>
      createAccountColumns({
        mode,
        t,
        locale,
        onOpen: openAccount,
        onToggleBlocked: toggleBlocked,
      }),
    [mode, t, locale, openAccount, toggleBlocked],
  );

  const tableState = useServerDataTable({
    endpoint:
      mode === "admin"
        ? "/api/admin/admins/search"
        : "/api/admin/users/search",
    columns,
    pageSize: PAGE_SIZE,
    refreshKey: mode === "admin" ? refreshKey : undefined,
    getRowId: (user) => String(user.userId),
  });

  useEffect(() => {
    setItemsRef.current = tableState.setItems;
  }, [tableState.setItems]);

  const renderMobileCard = (user) => {
    const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    return (
      <div
        className="admin-mobile-card cursor-pointer"
        onClick={() => openAccount(user.userId)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-xs font-bold text-[var(--admin-ink-soft)]">
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
          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge tone={user.active ? "success" : "neutral"}>
              {!user.active && locale !== "ar" ? t("inactive") : t("active")}
            </StatusBadge>
            <button
              type="button"
              className={`admin-action-icon ${
                user.blocked ? "!text-[var(--admin-danger-text)]" : ""
              }`}
              onClick={(event) => {
                event.stopPropagation();
                toggleBlocked(user.userId, !user.blocked);
              }}
              aria-label={user.blocked ? t("activate") : t("deactivate")}
            >
              <ImBlocked />
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--admin-border-subtle)] pt-3 text-xs text-[var(--admin-muted)]">
          <span className="truncate">
            {mode === "admin"
              ? `${t("username")}: ${user.username}`
              : user.email}
          </span>
          <span>
            {mode === "admin"
              ? `${t("last_login")}: ${formatAccountDate(user.lastLoginDate)}`
              : `${t("registered-on")}: ${formatAccountDate(user.registrationDate)}`}
          </span>
        </div>

        {mode !== "admin" ? (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--admin-border-subtle)] pt-3">
            <span className="text-xs text-[var(--admin-muted)]">
              {t("order_activity")}
            </span>
            <span className="rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--admin-ink-soft)]">
              {user.ordersCount ?? 0} {t("orders")}
            </span>
          </div>
        ) : null}
      </div>
    );
  };

  const toolbar = (
    <DataTableToolbar
      table={tableState.table}
      searchValue={tableState.globalFilter}
      onSearchChange={tableState.setGlobalFilter}
      actions={
        mode === "admin" ? (
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => {
              setIsFormOpen?.(true);
              setSelectedAdminId(null);
            }}
          >
            <FaPlus className="text-xs" />
            {t("add_admin")}
          </button>
        ) : null
      }
    />
  );

  return (
    <div className={mode === "admin" ? "h-full w-full" : "w-full"}>
      <DataTable
        table={tableState.table}
        loading={tableState.loading}
        loadingMore={tableState.loadingMore}
        hasMore={tableState.hasMore}
        error={tableState.error}
        sentinelRef={tableState.sentinelRef}
        onRetry={tableState.reload}
        toolbar={toolbar}
        mobileCard={renderMobileCard}
        onRowClick={(user) => openAccount(user.userId)}
        mobileWrapperClassName="lg:hidden mt-3"
        desktopWrapperClassName="admin-table-shell hidden lg:block max-h-[600px] min-w-0 mt-3 w-full overflow-x-auto overflow-y-auto"
        tableClassName="admin-table"
        emptyMessage={t("no_data")}
      />
    </div>
  );
}
