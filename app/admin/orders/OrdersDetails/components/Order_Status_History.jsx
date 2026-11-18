"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiArchive,
  FiArrowLeft,
  FiArrowRight,
  FiCalendar,
  FiClock,
  FiLink,
  FiMonitor,
  FiRefreshCw,
  FiSettings,
  FiUser,
} from "react-icons/fi";
import { FaBox, FaCheck, FaTimes, FaTruck } from "react-icons/fa";
import { TfiTimer } from "react-icons/tfi";

import { useLanguage } from "../../../../../context/LanguageContext.js";
import { useOrderDetailsContext } from "../../../../../context/orderDetailsContext.jsx";
import { getRequest } from "../../../../../utils/requestsUtils.js";
import StatusBadge from "../../../components/ui/StatusBadge";

const STATUS_ICONS = {
  PENDING: TfiTimer,
  PROCESSING: FaBox,
  SHIPPED: FaTruck,
  DELIVERED: FaCheck,
  CANCELLED: FaTimes,
};

const STATUS_NODE_TONES = {
  PENDING: "admin-tone-amber",
  PROCESSING: "admin-tone-blue",
  SHIPPED: "admin-tone-purple",
  DELIVERED: "admin-tone-green",
  CANCELLED: "admin-tone-red",
};

const SOURCE_CONFIG = {
  ADMIN_DASHBOARD: {
    labelKey: "history_source_admin",
    icon: FiMonitor,
  },
  CUSTOMER: {
    labelKey: "history_source_customer",
    icon: FiUser,
  },
  SYSTEM: {
    labelKey: "history_source_system",
    icon: FiSettings,
  },
  INTEGRATION: {
    labelKey: "history_source_integration",
    icon: FiLink,
  },
  LEGACY: {
    labelKey: "history_source_legacy",
    icon: FiArchive,
  },
};

function badgeTone(state) {
  switch (state) {
    case "PENDING":
      return "pending";
    case "PROCESSING":
      return "processing";
    case "SHIPPED":
      return "shipped";
    case "DELIVERED":
      return "delivered";
    case "CANCELLED":
      return "cancelled";
    default:
      return "neutral";
  }
}

function timestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function OrderStatusHistory({ orderId }) {
  const { t, locale } = useLanguage();
  const { selectedOrderState, historyRefreshKey } = useOrderDetailsContext();
  const isArabic = locale === "ar";

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const fetchHistory = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setLoadError(false);

      try {
        const response = await getRequest(
          `/api/admin/orders/${orderId}/history`,
        );
        setHistory(Array.isArray(response?.data) ? response.data : []);
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId],
  );

  useEffect(() => {
    // The first paint shows a skeleton. Refreshes triggered by a status update
    // keep the current timeline visible while the newest entry is fetched.
    fetchHistory({ silent: historyRefreshKey > 0 });
  }, [fetchHistory, historyRefreshKey]);

  const entries = useMemo(() => {
    return [...history].sort((a, b) => {
      const aTime = timestamp(a.changedDate)?.getTime() ?? 0;
      const bTime = timestamp(b.changedDate)?.getTime() ?? 0;
      if (bTime !== aTime) return bTime - aTime;
      return (b.orderStateHistoryId ?? 0) - (a.orderStateHistoryId ?? 0);
    });
  }, [history]);

  const currentIndex = useMemo(() => {
    if (!selectedOrderState) return -1;
    return entries.findIndex((entry) => entry.state === selectedOrderState);
  }, [entries, selectedOrderState]);

  const formatDateTime = (value) => {
    const date = timestamp(value);
    if (!date) return "--";
    return new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const sourceLabel = (source) => {
    const config = SOURCE_CONFIG[source];
    return config ? t(config.labelKey) : t("history_source_other");
  };

  const actorLabel = (entry) => {
    if (entry.source === "SYSTEM") return t("system");
    if (entry.changedBy && entry.changedBy.toLowerCase() !== "system") {
      return entry.changedBy;
    }
    return t("system");
  };

  const ArrowIcon = isArabic ? FiArrowLeft : FiArrowRight;
  const hasEntries = entries.length > 0;

  return (
    <section
      className="admin-card min-w-0 w-full overflow-hidden"
      aria-labelledby="order-status-history-title"
    >
      <div className="admin-card-header !px-4 !py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="admin-stat-icon !h-9 !w-9 admin-tone-rose">
            <FiClock />
          </span>
          <div className="min-w-0">
            <h2 id="order-status-history-title" className="admin-card-title">
              {t("order_status_history")}
            </h2>
            <p className="admin-card-description !mt-0.5">
              {t("order_status_history_description")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedOrderState ? (
            <StatusBadge tone={badgeTone(selectedOrderState)}>
              {t(selectedOrderState)}
            </StatusBadge>
          ) : null}
          {refreshing ? (
            <span
              className="hidden items-center gap-1 text-[10.5px] font-semibold text-[var(--admin-muted)] sm:inline-flex"
              role="status"
            >
              <FiRefreshCw className="animate-spin text-[11px]" />
              {t("status_history_refreshing")}
            </span>
          ) : null}
          <button
            type="button"
            className="admin-icon-btn"
            onClick={() => fetchHistory({ silent: hasEntries })}
            disabled={loading || refreshing}
            title={t("refresh")}
            aria-label={t("refresh")}
          >
            <FiRefreshCw
              className={refreshing ? "animate-spin text-[13px]" : "text-[13px]"}
            />
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-5">
        {loading ? (
          <div
            className="space-y-4"
            role="status"
            aria-live="polite"
            aria-label={t("status_history_loading")}
          >
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex gap-3 sm:gap-4">
                <span className="admin-skeleton mt-0.5 h-8 w-8 flex-shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 rounded-xl border border-[var(--admin-border-subtle)] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="admin-skeleton h-4 w-24" />
                    <span className="admin-skeleton h-3 w-28" />
                  </div>
                  <div className="admin-skeleton mt-3 h-3 w-2/3" />
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <span className="admin-skeleton h-3 w-36" />
                    <span className="admin-skeleton h-3 w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : loadError && !hasEntries ? (
          <div className="admin-alert admin-alert-danger">
            <FiAlertCircle className="flex-shrink-0 text-base" />
            <span className="min-w-0 flex-1">
              {t("status_history_load_error")}
            </span>
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-xs"
              onClick={() => fetchHistory()}
            >
              {t("status_history_retry")}
            </button>
          </div>
        ) : !hasEntries ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-4 py-8 text-center">
            <span className="admin-stat-icon !h-11 !w-11 admin-tone-gray text-lg">
              <FiClock />
            </span>
            <p className="mt-3 text-sm font-bold text-[var(--admin-ink)]">
              {t("no_status_history")}
            </p>
            <p className="mt-1 max-w-md text-xs leading-5 text-[var(--admin-muted)]">
              {t("no_status_history_description")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {loadError ? (
              <div className="admin-alert admin-alert-danger">
                <FiAlertCircle className="flex-shrink-0 text-base" />
                <span className="min-w-0 flex-1">
                  {t("status_history_refresh_error")}
                </span>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary admin-btn-xs"
                  onClick={() => fetchHistory({ silent: true })}
                >
                  {t("status_history_retry")}
                </button>
              </div>
            ) : null}

            <ol
              className="relative"
              aria-label={t("order_status_history")}
            >
              <span
                className="absolute bottom-3 start-[15px] top-3 w-px bg-[var(--admin-border)]"
                aria-hidden="true"
              />

              {entries.map((entry, index) => {
                const isCurrent = index === currentIndex;
                const StatusIcon = STATUS_ICONS[entry.state] ?? FiClock;
                const SourceIcon =
                  SOURCE_CONFIG[entry.source]?.icon ?? FiLink;

                return (
                  <li
                    key={
                      entry.orderStateHistoryId ??
                      `${entry.state}-${entry.changedDate}-${index}`
                    }
                    className="relative flex gap-3 pb-4 last:pb-0 sm:gap-4"
                  >
                    <span
                      className={`relative z-10 mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 bg-[var(--admin-surface)] text-xs ${
                        STATUS_NODE_TONES[entry.state] ??
                        "admin-tone-gray"
                      } ${
                        isCurrent
                          ? "border-[var(--admin-accent)] shadow-[0_0_0_3px_var(--admin-focus-ring)]"
                          : "border-[var(--admin-border)]"
                      }`}
                    >
                      <StatusIcon />
                    </span>

                    <div
                      className={`min-w-0 flex-1 rounded-xl border p-3 sm:p-4 ${
                        isCurrent
                          ? "border-[var(--admin-accent-soft-border)] bg-[var(--admin-surface)] shadow-[0_0_0_3px_var(--admin-focus-ring)]"
                          : "border-[var(--admin-border)] bg-[var(--admin-surface-muted)]"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                          <StatusBadge tone={badgeTone(entry.state)}>
                            {entry.state ? t(entry.state) : "--"}
                          </StatusBadge>
                          {isCurrent ? (
                            <span className="admin-badge border-[var(--admin-accent-soft-border)] bg-[var(--admin-accent-soft)] text-[var(--admin-accent-solid)]">
                              <span
                                className="admin-badge-dot"
                                aria-hidden="true"
                              />
                              {t("history_current")}
                            </span>
                          ) : null}
                        </div>

                        <time
                          dateTime={entry.changedDate || undefined}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--admin-muted)] tabular-nums"
                        >
                          <FiCalendar className="text-[11px]" />
                          {formatDateTime(entry.changedDate)}
                        </time>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="font-semibold text-[var(--admin-muted)]">
                          {t("history_previous_status")}:
                        </span>
                        {entry.previousState ? (
                          <StatusBadge
                            dot={false}
                            tone={badgeTone(entry.previousState)}
                          >
                            {t(entry.previousState)}
                          </StatusBadge>
                        ) : (
                          <span className="admin-badge admin-badge-gray">
                            {entry.source === "LEGACY"
                              ? t("history_previous_unknown")
                              : t("history_initial_status")}
                          </span>
                        )}
                        <ArrowIcon
                          className="text-[10px] text-[var(--admin-muted-soft)]"
                          aria-hidden="true"
                        />
                        <span className="font-semibold text-[var(--admin-muted)]">
                          {t("history_new_status")}:
                        </span>
                        <StatusBadge dot={false} tone={badgeTone(entry.state)}>
                          {entry.state ? t(entry.state) : "--"}
                        </StatusBadge>
                      </div>

                      <div className="mt-2.5 grid gap-1.5 border-t border-[var(--admin-border-subtle)] pt-2.5 text-[11.5px] text-[var(--admin-ink-soft)] sm:grid-cols-2">
                        <p className="flex min-w-0 items-center gap-1.5">
                          <FiUser className="flex-shrink-0 text-[11px] text-[var(--admin-muted-soft)]" />
                          <span className="text-[var(--admin-muted)]">
                            {t("history_changed_by")}:
                          </span>
                          <span className="truncate font-semibold text-[var(--admin-ink)]">
                            {actorLabel(entry)}
                          </span>
                        </p>
                        <p className="flex min-w-0 items-center gap-1.5">
                          <SourceIcon className="flex-shrink-0 text-[11px] text-[var(--admin-muted-soft)]" />
                          <span className="text-[var(--admin-muted)]">
                            {t("source")}:
                          </span>
                          <span className="truncate font-semibold text-[var(--admin-ink)]">
                            {sourceLabel(entry.source)}
                          </span>
                        </p>
                      </div>

                      {entry.notes ? (
                        <p className="mt-2 break-words rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2.5 py-2 text-[11.5px] leading-5 text-[var(--admin-ink-soft)]">
                          <span className="font-semibold text-[var(--admin-muted)]">
                            {t("history_notes")}:
                          </span>{" "}
                          {entry.notes}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}
