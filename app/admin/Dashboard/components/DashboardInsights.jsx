"use client";

import { useRouter } from "next/navigation.js";
import { FiArrowUpRight } from "react-icons/fi";
import {
  PiArrowsClockwiseFill,
  PiClockCountdownFill,
  PiStarFill,
  PiTruckFill,
  PiXCircleFill,
} from "react-icons/pi";
import { TbTruckReturn } from "react-icons/tb";

import { useLanguage } from "../../../../context/LanguageContext.js";
import { useNamePageInAdminContext } from "../../../../context/namePageInAdmin.jsx";
import { useIdContext } from "../../../../context/idContext.jsx";
import { useDashboardSummary } from "../context/DashboardSummaryContext";

const ORDER_ROWS = [
  { state: "PENDING", color: "var(--admin-warning)" },
  { state: "PROCESSING", color: "var(--admin-info)" },
  { state: "SHIPPED", color: "var(--admin-purple)" },
  { state: "DELIVERED", color: "var(--admin-success)" },
  { state: "CANCELLED", color: "var(--admin-danger)" },
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function percentage(value, total) {
  if (!total) return 0;
  return (Number(value || 0) / Number(total)) * 100;
}

function ProgressBar({ value, color }) {
  const bounded = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div
      className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--admin-surface-sunken)]"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(bounded)}
    >
      <span
        className="block h-full rounded-full transition-[width] duration-300"
        style={{ width: `${bounded}%`, background: color }}
      />
    </div>
  );
}

function OrderMetricValue({ count, percentage, strong = false }) {
  return (
    <span
      dir="ltr"
      className="grid w-[6.75rem] shrink-0 grid-cols-[2rem_0.5rem_3.5rem] items-center gap-1 text-sm tabular-nums"
    >
      <strong className="text-end font-bold text-[var(--admin-ink)]">
        {count == null ? "" : formatNumber(count)}
      </strong>
      <span className="text-center text-[var(--admin-muted)]">
        {count == null ? "" : "·"}
      </span>
      <span
        className={`text-end ${
          strong
            ? "font-bold text-[var(--admin-ink)]"
            : "text-[var(--admin-muted)]"
        }`}
      >
        {percentage}
      </span>
    </span>
  );
}

function AttentionTile({ icon, label, value, tone, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 text-start transition-all hover:-translate-y-0.5 hover:border-[var(--admin-border-strong)] hover:shadow-[var(--admin-shadow)]"
    >
      <span
        className={`admin-stat-icon !h-10 !w-10 admin-tone-${tone}`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold text-[var(--admin-muted)]">
          {label}
        </span>
        <span className="mt-0.5 block text-xl font-bold leading-none text-[var(--admin-ink)]">
          {formatNumber(value)}
        </span>
      </span>
      <FiArrowUpRight className="shrink-0 text-sm text-[var(--admin-muted)] transition-transform group-hover:-translate-y-0.5" />
    </button>
  );
}

export default function DashboardInsights() {
  const { t } = useLanguage();
  const router = useRouter();
  const { setSelectedNamePage } = useNamePageInAdminContext();
  const { setSelectedState } = useIdContext();
  const { summary } = useDashboardSummary();

  const ordersCount = Number(summary?.ordersCount) || 0;
  const ordersStats = summary?.ordersStats ?? [];
  const itemStats = summary?.itemStats ?? {};
  const userStats = summary?.userStats ?? {};

  const countFor = (state) =>
    Number(ordersStats.find((row) => row.state === state)?.count) || 0;

  const pendingOrders = countFor("PENDING");
  const processingOrders = countFor("PROCESSING");
  const deliveredOrders = countFor("DELIVERED");
  const cancelledOrders = countFor("CANCELLED");
  const deliveryRate = percentage(
    deliveredOrders,
    ordersCount - cancelledOrders,
  );

  const pendingReturns = Number(summary?.pendingReturns) || 0;
  const unavailableProducts = Number(itemStats.unavailable) || 0;
  const availableProducts = Number(itemStats.available) || 0;
  const favoriteProducts = Number(itemStats.favorite) || 0;
  const totalProducts = availableProducts + unavailableProducts;
  const availabilityRate = percentage(availableProducts, totalProducts);

  const totalUsers = Number(userStats.totalUsers) || 0;
  const usersWithOrders = Number(userStats.usersWithOrders) || 0;
  const ordersPercentage =
    userStats.ordersPercentage != null
      ? Number(userStats.ordersPercentage) || 0
      : percentage(usersWithOrders, totalUsers);

  const openOrders = (state = null) => {
    setSelectedState(state);
    router.push("/admin/orders");
    setSelectedNamePage("Orders Management");
  };

  const openReturns = () => {
    router.push("/admin/Returns");
    setSelectedNamePage("Returns Management");
  };

  const openProducts = () => {
    router.push("/admin/Products");
    setSelectedNamePage("Products Management");
  };

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <div className="admin-card overflow-hidden">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">
              {t("dashboard_attention_title")}
            </h2>
            <p className="admin-card-description">
              {t("dashboard_attention_description")}
            </p>
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <AttentionTile
            icon={<PiClockCountdownFill />}
            label={t("pending_orders")}
            value={pendingOrders}
            tone="amber"
            onClick={() => openOrders("PENDING")}
          />
          <AttentionTile
            icon={<PiArrowsClockwiseFill />}
            label={t("processing_orders")}
            value={processingOrders}
            tone="blue"
            onClick={() => openOrders("PROCESSING")}
          />
          <AttentionTile
            icon={<TbTruckReturn />}
            label={t("dashboard_pending_returns")}
            value={pendingReturns}
            tone="red"
            onClick={openReturns}
          />
          <AttentionTile
            icon={<PiXCircleFill />}
            label={t("products_stats_unavailable")}
            value={unavailableProducts}
            tone="purple"
            onClick={openProducts}
          />
        </div>

        <div className="space-y-4 border-t border-[var(--admin-border-subtle)] p-5">
          <div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-[var(--admin-ink-soft)]">
                {t("users_stats_with_orders")}
              </span>
              <span className="font-bold text-[var(--admin-ink)]">
                {formatNumber(usersWithOrders)} / {formatNumber(totalUsers)} ·{" "}
                {ordersPercentage.toFixed(1)}%
              </span>
            </div>
            <ProgressBar value={ordersPercentage} color="var(--admin-accent)" />
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-[var(--admin-ink-soft)]">
                {t("dashboard_product_availability")}
              </span>
              <span className="font-bold text-[var(--admin-ink)]">
                {formatNumber(availableProducts)} /{" "}
                {formatNumber(totalProducts)} ·{" "}
                {availabilityRate.toFixed(1)}%
              </span>
            </div>
            <ProgressBar
              value={availabilityRate}
              color="var(--admin-success)"
            />
          </div>

          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2 font-semibold text-[var(--admin-ink-soft)]">
              <PiStarFill className="text-[var(--admin-warning)]" />
              {t("products_stats_favorite")}
            </span>
            <span className="font-bold text-[var(--admin-ink)]">
              {formatNumber(favoriteProducts)}
            </span>
          </div>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">
              {t("dashboard_orders_overview")}
            </h2>
            <p className="admin-card-description">
              {t("dashboard_orders_overview_description")}
            </p>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={() => openOrders()}
          >
            {t("view_all")}
            <FiArrowUpRight className="text-sm" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {ORDER_ROWS.map(({ state, color }) => {
            const count = countFor(state);
            const rowPercentage = percentage(count, ordersCount);
            return (
              <div key={state}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-[var(--admin-ink-soft)]">
                    {t(state)}
                  </span>
                  <OrderMetricValue
                    count={count}
                    percentage={`${rowPercentage.toFixed(1)}%`}
                  />
                </div>
                <ProgressBar value={rowPercentage} color={color} />
              </div>
            );
          })}

          <div className="border-t border-[var(--admin-border-subtle)] pt-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="inline-flex items-center gap-2 font-semibold text-[var(--admin-ink-soft)]">
                <PiTruckFill className="text-[var(--admin-success)]" />
                {t("dashboard_delivery_rate")}
              </span>
              <OrderMetricValue
                percentage={`${deliveryRate.toFixed(1)}%`}
                strong
              />
            </div>
            <ProgressBar
              value={deliveryRate}
              color="var(--admin-success)"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
