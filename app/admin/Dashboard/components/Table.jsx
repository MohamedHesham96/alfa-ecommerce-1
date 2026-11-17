"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { FiArrowUpRight } from "react-icons/fi";

import { useLanguage } from "../../../../context/LanguageContext.js";
import { useNamePageInAdminContext } from "../../../../context/namePageInAdmin.jsx";
import { getRequest } from "../../../../utils/requestsUtils.js";
import { DataTable } from "../../components/data-table";
import StatusBadge from "../../components/ui/StatusBadge";
import { createDashboardColumns } from "../../config/dashboardTable.config";

export default function RecentOrders_table() {
  const { t } = useLanguage();
  const { setSelectedNamePage } = useNamePageInAdminContext();
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        const response = await getRequest("/api/admin/dashboard");
        if (alive) {
          setPendingOrders(response.data?.pendingOrders ?? []);
          setError(null);
        }
      } catch (requestError) {
        if (alive) setError(requestError);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  const goToOrder = (orderId) => {
    router.push(`/admin/orders/OrdersDetails/${orderId}`);
    setSelectedNamePage("Orders Management");
  };

  const goToOrders = () => {
    router.push("/admin/orders");
    setSelectedNamePage("Orders Management");
  };

  const columns = useMemo(
    () => createDashboardColumns({ t, onOpen: goToOrder }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  const table = useReactTable({
    data: pendingOrders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (order) => String(order.orderId),
  });

  const renderMobileCard = (order) => {
    const date = new Date(order.createdDate);
    const dateOnly = Number.isNaN(date.getTime())
      ? "--"
      : date.toLocaleDateString("en-GB");
    return (
      <div
        key={order.orderId}
        className="admin-mobile-card cursor-pointer"
        onClick={() => goToOrder(order.orderId)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-sm font-bold text-[var(--admin-danger-text)]">
              {order.orderCode}
            </span>
            <div className="mt-1 text-xs text-[var(--admin-muted)]">{dateOnly}</div>
          </div>
          <StatusBadge
            tone={
              order.state === "PROCESSING"
                ? "processing"
                : order.state === "SHIPPED"
                  ? "shipped"
                  : order.state === "PENDING"
                    ? "pending"
                    : order.state === "DELIVERED"
                      ? "delivered"
                      : "cancelled"
            }
          >
            {t(order.state)}
          </StatusBadge>
        </div>
        <div className="mt-3 flex items-center gap-3 border-t border-[var(--admin-border-subtle)] pt-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-[10px] font-bold text-[var(--admin-muted)]">
            {(order.userName?.[0] ?? "U").toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--admin-ink)]">
              {order.userName}
            </p>
            <p className="truncate text-xs text-[var(--admin-muted)]">{order.userEmail}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-[var(--admin-border-subtle)] pt-3">
          <span className="text-xs text-[var(--admin-muted)]">{t("total")}</span>
          <span className="text-base font-bold text-[var(--admin-ink)]">
            {Number(order.orderTotal ?? 0).toLocaleString("en-US")}{" "}
            <span className="text-xs font-medium text-[var(--admin-muted)]">
              {t("currency")}
            </span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <section className="admin-card mt-5 w-full overflow-hidden">
      <div className="admin-card-header">
        <div>
          <h2 className="admin-card-title">{t("recent_orders")}</h2>
          <p className="admin-card-description">
            {t("recent_orders_description")}
          </p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-secondary admin-btn-sm"
          onClick={goToOrders}
        >
          {t("view_all")}
          <FiArrowUpRight className="text-sm" />
        </button>
      </div>
      <div className="p-3 sm:p-4">
        <DataTable
          table={table}
          loading={loading}
          error={error}
          mobileCard={renderMobileCard}
          onRowClick={(order) => goToOrder(order.orderId)}
          mobileWrapperClassName="lg:hidden"
          desktopWrapperClassName="hidden lg:block max-h-[540px] min-w-0 overflow-x-auto overflow-y-auto rounded-xl border border-[var(--admin-border)]"
          tableClassName="admin-table min-w-[720px]"
          rowClassName="cursor-pointer"
          emptyMessage={t("no_data")}
          showInfiniteFooter={false}
        />
      </div>
    </section>
  );
}
