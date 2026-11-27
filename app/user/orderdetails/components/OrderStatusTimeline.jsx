"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiAlertCircle, FiClock } from "react-icons/fi";
import { FaBox, FaCheck, FaTimes, FaTruck } from "react-icons/fa";
import { TfiTimer } from "react-icons/tfi";

import { useLanguage } from "../../../../context/LanguageContext";
import { getRequest } from "../../../../utils/requestsUtils";

const STATUS_STYLES = {
  PENDING: {
    icon: TfiTimer,
    node: "border-amber-200 bg-amber-50 text-amber-600",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
  },
  PROCESSING: {
    icon: FaBox,
    node: "border-blue-200 bg-blue-50 text-blue-600",
    badge: "border-blue-200 bg-blue-50 text-blue-700",
  },
  SHIPPED: {
    icon: FaTruck,
    node: "border-purple-200 bg-purple-50 text-purple-600",
    badge: "border-purple-200 bg-purple-50 text-purple-700",
  },
  DELIVERED: {
    icon: FaCheck,
    node: "border-green-200 bg-green-50 text-green-600",
    badge: "border-green-200 bg-green-50 text-green-700",
  },
  CANCELLED: {
    icon: FaTimes,
    node: "border-red-200 bg-red-50 text-red-600",
    badge: "border-red-200 bg-red-50 text-red-700",
  },
};

const DEFAULT_STATUS_STYLE = {
  icon: FiClock,
  node: "border-gray-200 bg-gray-50 text-gray-500",
  badge: "border-gray-200 bg-gray-50 text-gray-600",
};

function toDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function OrderStatusTimeline({ orderId, currentState }) {
  const { t, locale } = useLanguage();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setLoadError(false);

    try {
      const response = await getRequest(`/api/orders/${orderId}/history`);
      setHistory(Array.isArray(response?.data) ? response.data : []);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Newest change first. The id breaks ties for entries recorded in the same
  // second, so the order stays stable between renders.
  const entries = useMemo(() => {
    return [...history].sort((a, b) => {
      const first = toDate(a.changedDate)?.getTime() ?? 0;
      const second = toDate(b.changedDate)?.getTime() ?? 0;
      if (second !== first) return second - first;
      return (b.orderStateHistoryId ?? 0) - (a.orderStateHistoryId ?? 0);
    });
  }, [history]);

  // The current state is the newest recorded state for the order. Falling back
  // to the first entry keeps the marker visible while the order is still
  // loading in the parent component.
  const currentIndex = useMemo(() => {
    if (!currentState) return entries.length > 0 ? 0 : -1;
    return entries.findIndex((entry) => entry.state === currentState);
  }, [currentState, entries]);

  const formatDateTime = (value) => {
    const date = toDate(value);
    if (!date) return "—";
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const hasEntries = entries.length > 0;

  return (
    <section
      className="mt-7 w-full rounded-3xl bg-white p-5 md:p-7"
      aria-labelledby={`order-status-history-title-${orderId}`}
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-lg text-[#e14a5c]">
          <FiClock />
        </span>
        <div className="min-w-0">
          <h2
            id={`order-status-history-title-${orderId}`}
            className="text-xl font-bold text-gray-900"
          >
            {t("order_status_history")}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {t("order_status_history_description")}
          </p>
        </div>
      </div>

      {loading ? (
        <div
          className="space-y-4"
          role="status"
          aria-live="polite"
          aria-label={t("status_history_loading")}
        >
          {[0, 1, 2].map((item) => (
            <div key={item} className="flex gap-4">
              <span className="mt-0.5 h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-100" />
              <div className="min-w-0 flex-1 rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                  <span className="h-3 w-28 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : loadError && !hasEntries ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <FiAlertCircle className="shrink-0 text-base" />
          <span className="min-w-0 flex-1">
            {t("status_history_load_error")}
          </span>
          <button
            type="button"
            onClick={fetchHistory}
            className="rounded-full bg-[#e14a5c] px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
          >
            {t("status_history_retry")}
          </button>
        </div>
      ) : !hasEntries ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-8 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-400">
            <FiClock />
          </span>
          <p className="mt-3 text-sm font-bold text-gray-900">
            {t("no_status_history")}
          </p>
          <p className="mt-1 max-w-md text-xs leading-5 text-gray-500">
            {t("no_status_history_description")}
          </p>
        </div>
      ) : (
        <ol className="relative" aria-label={t("order_status_history")}>
          <span
            className="absolute bottom-5 start-5 top-5 w-px bg-gray-200"
            aria-hidden="true"
          />

          {entries.map((entry, index) => {
            const style = STATUS_STYLES[entry.state] ?? DEFAULT_STATUS_STYLE;
            const StatusIcon = style.icon;
            const isCurrent = index === currentIndex;

            return (
              <li
                key={
                  entry.orderStateHistoryId ??
                  `${entry.state}-${entry.changedDate}-${index}`
                }
                className="relative flex gap-4 pb-6 last:pb-0"
              >
                <span
                  className={`relative z-10 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${style.node} ${
                    isCurrent
                      ? "ring-4 ring-red-100"
                      : "ring-4 ring-white"
                  }`}
                >
                  <StatusIcon className="text-base" />
                </span>

                <div
                  className={`min-w-0 flex-1 rounded-2xl border px-4 py-3 ${
                    isCurrent
                      ? "border-red-200 bg-red-50/50"
                      : "border-gray-100 bg-gray-50/60"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${style.badge}`}
                      >
                        {entry.state ? t(entry.state) : "—"}
                      </span>
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e14a5c] px-2.5 py-0.5 text-[10px] font-bold text-white">
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-white"
                            aria-hidden="true"
                          />
                          {t("history_current")}
                        </span>
                      ) : null}
                    </div>

                    <time
                      dateTime={entry.changedDate || undefined}
                      className="text-xs font-medium text-gray-500"
                    >
                      {formatDateTime(entry.changedDate)}
                    </time>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
