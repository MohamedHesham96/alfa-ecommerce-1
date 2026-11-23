"use client";

import { useMemo, useState } from "react";
import { FiInbox } from "react-icons/fi";

import { useLanguage } from "../../../../../context/LanguageContext.js";
import {
  bucketEndDate,
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  formatPercent,
} from "../salesReportUtils";

const CHART_WIDTH = 900;
const CHART_HEIGHT = 300;
const PADDING = { top: 24, right: 24, bottom: 42, left: 56 };

function ChartCard({ title, description, children, actions }) {
  return (
    <section className="admin-card sales-report-chart-card">
      <div className="admin-card-header">
        <div>
          <h2 className="admin-card-title">{title}</h2>
          {description ? <p className="admin-card-description">{description}</p> : null}
        </div>
        {actions ? <div className="sales-report-chart-actions">{actions}</div> : null}
      </div>
      <div className="admin-card-body">{children}</div>
    </section>
  );
}

function ChartEmpty({ title }) {
  return (
    <div className="admin-table-empty sales-report-chart-empty">
      <span className="admin-empty-icon" aria-hidden="true">
        <FiInbox />
      </span>
      <p className="admin-empty-title">{title}</p>
    </div>
  );
}

function shortDate(value, locale) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function SalesOverTimeChart({ summary, onDrillDown }) {
  const { t, locale } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(null);
  const points = useMemo(
    () => summary?.salesOverTime ?? [],
    [summary?.salesOverTime],
  );
  const range = summary?.range;
  const hasValues = points.some(
    (point) => Number(point.netSales) > 0 || Number(point.deliveredRevenue) > 0,
  );
  const model = useMemo(() => {
    if (!points.length) return null;
    const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
    const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
    const maxValue = Math.max(
      1,
      ...points.map((point) =>
        Math.max(Number(point.netSales) || 0, Number(point.deliveredRevenue) || 0),
      ),
    );
    const band = innerWidth / Math.max(points.length, 1);
    const xAt = (index) => PADDING.left + (index + 0.5) * band;
    const yAt = (value) =>
      PADDING.top + innerHeight - ((Number(value) || 0) / maxValue) * innerHeight;
    const pathFor = (key) =>
      points
        .map((point, index) => {
          const x = xAt(index);
          const y = yAt(point[key]);
          return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(" ");
    const tickStep = Math.max(1, Math.ceil(points.length / 7));
    const tickIndexes = points
      .map((_, index) => index)
      .filter(
        (index) =>
          index === 0 ||
          index === points.length - 1 ||
          index % tickStep === 0,
      );
    return {
      innerWidth,
      innerHeight,
      maxValue,
      band,
      xAt,
      yAt,
      netPath: pathFor("netSales"),
      deliveredPath: pathFor("deliveredRevenue"),
      tickIndexes,
    };
  }, [points]);

  const active = activeIndex === null ? null : points[activeIndex];

  return (
    <ChartCard
      title={t("sales_report_chart_over_time")}
      description={t("sales_report_chart_over_time_desc")}
    >
      {!hasValues || !model ? (
        <ChartEmpty title={t("sales_report_no_sales_chart_data")} />
      ) : (
        <div className="sales-report-line-chart" dir="ltr">
          <div className="sales-report-chart-legend">
            <span>
              <i className="sales-report-legend-dot sales-report-legend-dot--net" />
              {t("sales_report_kpi_net")}
            </span>
            <span>
              <i className="sales-report-legend-dot sales-report-legend-dot--delivered" />
              {t("sales_report_kpi_delivered")}
            </span>
          </div>
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            role="img"
            aria-label={t("sales_report_chart_over_time")}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
              const y =
                PADDING.top + model.innerHeight - fraction * model.innerHeight;
              return (
                <g key={`grid-${fraction}`}>
                  <line
                    x1={PADDING.left}
                    x2={CHART_WIDTH - PADDING.right}
                    y1={y}
                    y2={y}
                    className="sales-report-chart-grid"
                  />
                  <text
                    x={PADDING.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="sales-report-chart-axis"
                  >
                    {formatMoneyCompact(model.maxValue * fraction, locale)}
                  </text>
                </g>
              );
            })}

            <path d={model.netPath} className="sales-report-line sales-report-line--net" />
            <path
              d={model.deliveredPath}
              className="sales-report-line sales-report-line--delivered"
            />

            {points.map((point, index) => (
              <g key={`${point.bucketStart}-${index}`}>
                <circle
                  cx={model.xAt(index)}
                  cy={model.yAt(point.netSales)}
                  r={activeIndex === index ? 4 : 2.5}
                  className="sales-report-dot sales-report-dot--net"
                />
                <circle
                  cx={model.xAt(index)}
                  cy={model.yAt(point.deliveredRevenue)}
                  r={activeIndex === index ? 4 : 2.5}
                  className="sales-report-dot sales-report-dot--delivered"
                />
                <rect
                  x={PADDING.left + index * model.band}
                  y={PADDING.top}
                  width={model.band}
                  height={model.innerHeight}
                  fill="transparent"
                  tabIndex={0}
                  role="button"
                  aria-label={`${point.bucketStart}: ${formatMoney(
                    point.netSales,
                    locale,
                    summary.currency,
                  )}`}
                  onPointerEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={() => setActiveIndex(null)}
                  onClick={() => {
                    const end = bucketEndDate(point.bucketStart, point.granularity);
                    const toDate =
                      range?.endDateInclusive && end > range.endDateInclusive
                        ? range.endDateInclusive
                        : end;
                    onDrillDown?.({
                      datePreset: "CUSTOM",
                      fromDate: point.bucketStart,
                      toDate,
                    });
                  }}
                />
              </g>
            ))}

            {model.tickIndexes.map((index) => (
              <text
                key={`label-${index}`}
                x={model.xAt(index)}
                y={CHART_HEIGHT - 14}
                textAnchor="middle"
                className="sales-report-chart-axis"
              >
                {shortDate(points[index].bucketStart, locale)}
              </text>
            ))}
          </svg>

          {active ? (
            <div
              className="sales-report-chart-tooltip"
              style={{
                left: `${Math.min(88, Math.max(12, (model.xAt(activeIndex) / CHART_WIDTH) * 100))}%`,
              }}
              role="status"
            >
              <p className="sales-report-chart-tooltip-title">
                {active.bucketStart} · {formatNumber(active.orders, locale)}{" "}
                {t("sales_report_orders")}
              </p>
              <p>
                <i className="sales-report-legend-dot sales-report-legend-dot--net" />
                {t("sales_report_kpi_net")}:{" "}
                {formatMoney(active.netSales, locale, summary.currency)}
              </p>
              <p>
                <i className="sales-report-legend-dot sales-report-legend-dot--delivered" />
                {t("sales_report_kpi_delivered")}:{" "}
                {formatMoney(active.deliveredRevenue, locale, summary.currency)}
              </p>
              <p>
                {t("sales_report_kpi_items")}:{" "}
                {formatNumber(active.itemsSold, locale)}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </ChartCard>
  );
}

export function SalesCompositionChart({ summary, onDrillDown }) {
  const { t, locale } = useLanguage();
  const [dimension, setDimension] = useState("PAYMENT_METHOD");
  const slices =
    dimension === "PAYMENT_METHOD"
      ? summary?.composition?.byPaymentMethod
      : dimension === "FULFILLMENT_TYPE"
        ? summary?.composition?.byFulfillmentType
        : summary?.composition?.byOrderStatus;
  const rows = slices ?? [];
  const maxShare = Math.max(1, ...rows.map((row) => Number(row.sharePercent) || 0));

  return (
    <ChartCard
      title={t("sales_report_chart_composition")}
      description={t("sales_report_chart_composition_desc")}
      actions={
        <div className="sales-report-segmented" role="group">
          {[
            ["PAYMENT_METHOD", "sales_report_composition_payment"],
            ["FULFILLMENT_TYPE", "sales_report_composition_fulfillment"],
            ["ORDER_STATUS", "sales_report_composition_status"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`sales-report-segmented-button ${
                dimension === key ? "sales-report-segmented-button--active" : ""
              }`}
              aria-pressed={dimension === key}
              onClick={() => setDimension(key)}
            >
              {t(label)}
            </button>
          ))}
        </div>
      }
    >
      {rows.length === 0 ? (
        <ChartEmpty title={t("sales_report_no_sales_chart_data")} />
      ) : (
        <div className="sales-report-composition">
          <p className="sales-report-chart-note">
            {t("sales_report_composition_note")}
          </p>
          {dimension === "PAYMENT_METHOD" ? (
            <p className="sales-report-chart-note">{t("sales_report_payment_note")}</p>
          ) : null}
          <ul>
            {rows.map((row) => {
              const partial =
                dimension === "PAYMENT_METHOD"
                  ? { paymentMethods: [row.key] }
                  : dimension === "FULFILLMENT_TYPE"
                    ? { fulfillmentTypes: [row.key] }
                    : { orderStates: [row.key] };
              return (
                <li key={row.key}>
                  <button
                    type="button"
                    className="sales-report-composition-row"
                    onClick={() => onDrillDown?.(partial)}
                  >
                    <span className="sales-report-composition-top">
                      <span className="sales-report-composition-label">
                        {t(row.key)}
                      </span>
                      <span className="sales-report-composition-value">
                        {formatMoney(row.merchandiseValue, locale, summary.currency)}
                      </span>
                    </span>
                    <span className="sales-report-progress">
                      <span
                        className="sales-report-progress-fill"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, (Number(row.sharePercent) / maxShare) * 100),
                          )}%`,
                        }}
                      />
                    </span>
                    <span className="sales-report-composition-meta">
                      {formatNumber(row.orders, locale)} {t("sales_report_orders")} ·{" "}
                      {formatPercent(row.sharePercent, locale)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}

export function SalesCategoryChart({ summary, onDrillDown }) {
  const { t, locale } = useLanguage();
  const rows = summary?.salesByCategory ?? [];
  const maxValue = Math.max(1, ...rows.map((row) => Number(row.merchandiseValue) || 0));
  return (
    <ChartCard
      title={t("sales_report_chart_by_category")}
      description={t("sales_report_chart_by_category_desc")}
    >
      {rows.length === 0 ? (
        <ChartEmpty title={t("sales_report_no_sales_chart_data")} />
      ) : (
        <ul className="sales-report-category-list">
          {rows.map((row) => (
            <li key={row.categoryId}>
              <button
                type="button"
                className="sales-report-category-row"
                onClick={() => onDrillDown?.({ categoryIds: [row.categoryId] })}
              >
                <span className="sales-report-category-top">
                  <span className="sales-report-category-name">
                    {locale === "ar" && row.nameAr ? row.nameAr : row.nameEn}
                  </span>
                  <span className="sales-report-category-value">
                    {formatMoney(row.merchandiseValue, locale, summary.currency)}
                  </span>
                </span>
                <span className="sales-report-progress">
                  <span
                    className="sales-report-progress-fill sales-report-progress-fill--category"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, (Number(row.merchandiseValue) / maxValue) * 100),
                      )}%`,
                    }}
                  />
                </span>
                <span className="sales-report-composition-meta">
                  {formatNumber(row.quantity, locale)} {t("sales_report_units")} ·{" "}
                  {formatPercent(row.sharePercent, locale)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}

export function TopProductsCard({ summary, onDrillDown }) {
  const { t, locale } = useLanguage();
  const rows = summary?.topProducts ?? [];
  return (
    <ChartCard
      title={t("sales_report_chart_top_products")}
      description={t("sales_report_chart_top_products_desc")}
    >
      {rows.length === 0 ? (
        <ChartEmpty title={t("sales_report_no_sales_chart_data")} />
      ) : (
        <ol className="sales-report-top-products">
          {rows.map((row, index) => (
            <li key={row.itemId}>
              <button
                type="button"
                className="sales-report-top-product-row"
                onClick={() => onDrillDown?.({ productIds: [row.itemId] })}
              >
                <span className="sales-report-rank">{index + 1}</span>
                <span className="sales-report-top-product-main">
                  <span className="sales-report-top-product-name">
                    {locale === "ar" && row.nameAr ? row.nameAr : row.nameEn}
                  </span>
                  <span className="sales-report-top-product-code">{row.code}</span>
                </span>
                <span className="sales-report-top-product-numbers">
                  <strong>{formatNumber(row.quantity, locale)}</strong>
                  <span>
                    {formatMoney(row.merchandiseValue, locale, summary.currency)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </ChartCard>
  );
}

function weekdayLabels(locale) {
  const formatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
  return [1, 2, 3, 4, 5, 6, 7].map((day) =>
    formatter.format(new Date(Date.UTC(2024, 0, day))),
  );
}

export function DayHourHeatmap({ summary }) {
  const { t, locale } = useLanguage();
  const rows = useMemo(
    () => summary?.salesByDayHour ?? [],
    [summary?.salesByDayHour],
  );
  const byKey = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => map.set(`${row.dayOfWeek}:${row.hour}`, row));
    return map;
  }, [rows]);
  const maxValue = Math.max(
    1,
    ...rows.map((row) => Number(row.merchandiseValue) || 0),
  );
  const days = weekdayLabels(locale);
  const hasValues = rows.some((row) => Number(row.merchandiseValue) > 0);

  return (
    <ChartCard
      title={t("sales_report_chart_day_hour")}
      description={t("sales_report_chart_day_hour_desc")}
    >
      {!hasValues ? (
        <ChartEmpty title={t("sales_report_no_sales_chart_data")} />
      ) : (
        <div className="sales-report-heatmap-scroll">
          <div className="sales-report-heatmap">
            <div className="sales-report-heatmap-corner" />
            {Array.from({ length: 24 }).map((_, hour) => (
              <span key={`hour-${hour}`} className="sales-report-heatmap-hour">
                {hour % 3 === 0 ? hour : ""}
              </span>
            ))}
            {days.map((dayLabel, dayIndex) => (
              <div key={dayLabel} className="sales-report-heatmap-row">
                <span className="sales-report-heatmap-day">{dayLabel}</span>
                {Array.from({ length: 24 }).map((_, hour) => {
                  const row = byKey.get(`${dayIndex + 1}:${hour}`);
                  const value = Number(row?.merchandiseValue) || 0;
                  const orders = Number(row?.orders) || 0;
                  const opacity = value > 0 ? 0.12 + (value / maxValue) * 0.88 : 0;
                  return (
                    <span
                      key={`${dayIndex}-${hour}`}
                      className="sales-report-heatmap-cell"
                      title={`${dayLabel} ${hour}:00 — ${formatNumber(
                        orders,
                        locale,
                      )} ${t("sales_report_orders")} — ${formatMoney(
                        value,
                        locale,
                        summary.currency,
                      )}`}
                    >
                      <span
                        className="sales-report-heatmap-fill"
                        style={{ opacity }}
                      />
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="sales-report-heatmap-legend">
            <span>{t("sales_report_heatmap_low")}</span>
            <span className="sales-report-heatmap-scale" />
            <span>{t("sales_report_heatmap_high")}</span>
          </div>
        </div>
      )}
    </ChartCard>
  );
}
