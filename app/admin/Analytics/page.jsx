"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MdCalendarMonth,
  MdDateRange,
  MdEventAvailable,
  MdOutlinePeopleAlt,
  MdOutlineVisibility,
  MdPeopleOutline,
  MdRefresh,
  MdWarningAmber,
} from "react-icons/md";

import { useLanguage } from "../../../context/LanguageContext.js";
import { getRequest } from "../../../utils/requestsUtils";
import AdminPageHeader from "../components/ui/AdminPageHeader";
import StatCard from "../components/ui/StatCard";
import DeviceBreakdownCard from "./components/DeviceBreakdownCard";
import NewVsReturningCard from "./components/NewVsReturningCard";
import SessionQualityCard from "./components/SessionQualityCard";
import TopProductsCard from "./components/TopProductsCard";
import TrafficSourcesCard from "./components/TrafficSourcesCard";
import TrendChart from "./components/TrendChart";
import WishlistCard from "./components/WishlistCard";

const PERIODS = [
  { value: "TODAY", labelKey: "analytics_period_today" },
  { value: "WEEK", labelKey: "analytics_period_week" },
  { value: "MONTH", labelKey: "analytics_period_month" },
];

const ACTIVE_POLL_MS = 5000;

export default function WebsiteAnalyticsPage() {
  const { t, locale } = useLanguage();
  const [period, setPeriod] = useState("TODAY");
  const [summary, setSummary] = useState(null);
  const [activeUsers, setActiveUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const requestIdRef = useRef(0);
  const activeRequestRef = useRef(false);

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US"),
    [locale],
  );
  const formatNumber = useCallback(
    (value) => numberFormatter.format(Number(value) || 0),
    [numberFormatter],
  );

  const formatDuration = useCallback(
    (seconds) => {
      const total = Math.max(0, Math.round(Number(seconds) || 0));
      if (total < 60) {
        return `${formatNumber(total)}${t("analytics_duration_second_short")}`;
      }
      const minutes = Math.floor(total / 60);
      const remainingSeconds = total % 60;
      if (minutes < 60) {
        return remainingSeconds
          ? `${formatNumber(minutes)}${t("analytics_duration_minute_short")} ${formatNumber(remainingSeconds)}${t("analytics_duration_second_short")}`
          : `${formatNumber(minutes)}${t("analytics_duration_minute_short")}`;
      }
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes
        ? `${formatNumber(hours)}${t("analytics_duration_hour_short")} ${formatNumber(remainingMinutes)}${t("analytics_duration_minute_short")}`
        : `${formatNumber(hours)}${t("analytics_duration_hour_short")}`;
    },
    [formatNumber, t],
  );

  const loadSummary = useCallback(
    async (targetPeriod, { force = false } = {}) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError(false);
      try {
        const response = await getRequest(
          `/api/admin/analytics/summary?period=${encodeURIComponent(targetPeriod)}${force ? "&refresh=true" : ""}`,
          { suppressErrorToast: true },
        );
        if (requestId !== requestIdRef.current) return;
        const data = response?.data ?? null;
        if (!data) {
          throw new Error("Empty analytics response");
        }
        setSummary(data);
        setActiveUsers(Number(data.activeUsers) || 0);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setError(true);
        setSummary(null);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    setSummary(null);
    setError(false);
    void loadSummary(period);
  }, [period, loadSummary]);

  useEffect(() => {
    let cancelled = false;

    const loadActiveUsers = async () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }
      if (activeRequestRef.current) return;
      activeRequestRef.current = true;
      try {
        const response = await getRequest(
          "/api/admin/analytics/active-users",
          { suppressErrorToast: true },
        );
        if (!cancelled) {
          setActiveUsers(Number(response?.data?.activeUsers) || 0);
        }
      } catch {
        // Keep the last known value; the next poll retries.
      } finally {
        activeRequestRef.current = false;
      }
    };

    void loadActiveUsers();
    const interval = window.setInterval(loadActiveUsers, ACTIVE_POLL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void loadActiveUsers();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", loadActiveUsers);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", loadActiveUsers);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadSummary(period, { force: true });
  };

  const updatedLabel = (() => {
    if (!summary?.generatedAt) return "";
    try {
      const time = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
        timeStyle: "short",
        timeZone: summary.timezone || undefined,
      }).format(new Date(summary.generatedAt));
      return t("analytics_updated").replace("{time}", time);
    } catch {
      return "";
    }
  })();

  const showSkeleton = loading && !summary;
  const activeValue = activeUsers ?? summary?.activeUsers ?? 0;

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow={t("overview")}
        title={t("website_analytics")}
        description={t("analytics_subtitle")}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div
              className="analytics-period-switch"
              role="group"
              aria-label={t("analytics_period_filter")}
            >
              {PERIODS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`analytics-period-button ${period === option.value ? "analytics-period-button--active" : ""}`}
                  aria-pressed={period === option.value}
                  onClick={() => setPeriod(option.value)}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              onClick={handleRefresh}
              disabled={loading || refreshing}
            >
              <MdRefresh aria-hidden="true" />
              {t("analytics_refresh")}
            </button>
          </div>
        }
      />

      {error ? (
        <div className="admin-alert admin-alert-danger" role="alert">
          <MdWarningAmber aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t("analytics_error_title")}</p>
            <p>{t("analytics_error_desc")}</p>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={handleRefresh}
          >
            {t("analytics_retry")}
          </button>
        </div>
      ) : null}

      {summary && summary.hasData === false && !error ? (
        <div className="admin-alert admin-alert-info" role="status">
          <div className="min-w-0">
            <p className="font-semibold">{t("analytics_no_data_title")}</p>
            <p>{t("analytics_no_data_desc")}</p>
          </div>
        </div>
      ) : null}

      {showSkeleton ? <AnalyticsSkeleton /> : null}

      {summary && !showSkeleton ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
            <StatCard
              label={t("analytics_active_now")}
              value={formatNumber(activeValue)}
              icon={<MdOutlinePeopleAlt />}
              tone="rose"
              hint={
                <span className="inline-flex items-center gap-1.5">
                  <span className="analytics-live-dot" aria-hidden="true" />
                  {t("analytics_active_hint")}
                </span>
              }
            />
            <StatCard
              label={t("analytics_today_visitors")}
              value={formatNumber(summary.todayVisitors)}
              icon={<MdPeopleOutline />}
              tone="blue"
              hint={t("analytics_legend_visitors")}
            />
            <StatCard
              label={t("analytics_today_page_views")}
              value={formatNumber(summary.todayPageViews)}
              icon={<MdOutlineVisibility />}
              tone="amber"
              hint={t("analytics_legend_page_views")}
            />
            <StatCard
              label={t("analytics_week_visitors")}
              value={formatNumber(summary.weekVisitors)}
              icon={<MdDateRange />}
              tone="purple"
              hint={t("analytics_legend_visitors")}
            />
            <StatCard
              label={t("analytics_month_visitors")}
              value={formatNumber(summary.monthVisitors)}
              icon={<MdCalendarMonth />}
              tone="green"
              hint={t("analytics_legend_visitors")}
            />
            <StatCard
              label={t("analytics_year_visitors")}
              value={formatNumber(summary.yearVisitors)}
              icon={<MdEventAvailable />}
              tone="gray"
              hint={t("analytics_legend_visitors")}
            />
          </div>

          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">
                  {t("analytics_traffic_trend")}
                </h2>
                <p className="admin-card-description">
                  {t("analytics_traffic_trend_desc")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="analytics-chip">
                  <strong>{formatNumber(summary.periodVisitors)}</strong>
                  {t("analytics_legend_visitors")}
                </span>
                <span className="analytics-chip">
                  <strong>{formatNumber(summary.periodPageViews)}</strong>
                  {t("analytics_legend_page_views")}
                </span>
              </div>
            </div>
            <div className="admin-card-body">
              <TrendChart
                points={summary.trend}
                granularity={
                  summary.period === "TODAY"
                    ? "HOUR"
                    : "DAY"
                }
                locale={locale}
                t={t}
                formatNumber={formatNumber}
              />
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            <SessionQualityCard
              sessions={summary.sessions}
              t={t}
              formatNumber={formatNumber}
              formatDuration={formatDuration}
            />
            <NewVsReturningCard
              distribution={summary.newVsReturning}
              t={t}
              formatNumber={formatNumber}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <TrafficSourcesCard
              sources={summary.trafficSources}
              t={t}
              formatNumber={formatNumber}
            />
            <DeviceBreakdownCard
              devices={summary.devices}
              t={t}
              formatNumber={formatNumber}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <TopProductsCard
              products={summary.topProducts}
              t={t}
              locale={locale}
              formatNumber={formatNumber}
            />
            <WishlistCard
              wishlist={summary.wishlist}
              t={t}
              formatNumber={formatNumber}
            />
          </div>

          <footer className="analytics-footer">
            <p>
              {t("analytics_definitions_note")} {t("analytics_admin_excluded")}
            </p>
            <p>
              {t("analytics_timezone_note").replace(
                "{timezone}",
                summary.timezone || "",
              )}
              {updatedLabel ? ` · ${updatedLabel}` : ""}
            </p>
          </footer>
        </>
      ) : null}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`analytics-stat-skeleton-${index}`}
            className="admin-card admin-card-pad"
          >
            <div className="space-y-3">
              <div className="admin-skeleton h-3.5 w-24" />
              <div className="admin-skeleton h-8 w-16" />
              <div className="admin-skeleton h-3 w-28" />
            </div>
          </div>
        ))}
      </div>
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="space-y-2">
            <div className="admin-skeleton h-5 w-40" />
            <div className="admin-skeleton h-3 w-64" />
          </div>
          <div className="admin-skeleton h-7 w-48" />
        </div>
        <div className="admin-card-body">
          <div className="admin-skeleton h-[290px] w-full" />
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`analytics-card-skeleton-${index}`} className="admin-card">
            <div className="admin-card-header">
              <div className="space-y-2">
                <div className="admin-skeleton h-5 w-36" />
                <div className="admin-skeleton h-3 w-56" />
              </div>
            </div>
            <div className="admin-card-body space-y-3">
              {Array.from({ length: 4 }).map((__, rowIndex) => (
                <div
                  key={`analytics-row-skeleton-${index}-${rowIndex}`}
                  className="flex items-center gap-3"
                >
                  <div className="admin-skeleton h-9 w-9 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="admin-skeleton h-3.5 w-2/5" />
                    <div className="admin-skeleton h-2.5 w-3/5" />
                  </div>
                  <div className="admin-skeleton h-4 w-10" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
