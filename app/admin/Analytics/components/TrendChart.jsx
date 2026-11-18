"use client";

import { useMemo, useState } from "react";

import SectionEmpty from "./SectionEmpty";

const WIDTH = 820;
const HEIGHT = 290;
const PADDING = { top: 24, right: 46, bottom: 38, left: 46 };

function bucketParts(bucketStart) {
  if (typeof bucketStart !== "string") return null;
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(bucketStart);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };
}

function toSiteDate(bucketStart) {
  const parts = bucketParts(bucketStart);
  if (!parts) return null;
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute));
}

export default function TrendChart({
  points = [],
  granularity = "DAY",
  locale = "en",
  t,
  formatNumber,
}) {
  const [activeIndex, setActiveIndex] = useState(null);

  const values = useMemo(
    () => points.map((point) => ({
      ...point,
      visitorsValue: Number(point.visitors) || 0,
      pageViewsValue: Number(point.pageViews) || 0,
    })),
    [points],
  );

  const hasValues = values.some(
    (point) => point.visitorsValue > 0 || point.pageViewsValue > 0,
  );

  const formatShort = (bucketStart) => {
    const date = toSiteDate(bucketStart);
    if (!date) return "";
    if (granularity === "HOUR") {
      return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      }).format(date);
    }
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }).format(date);
  };

  const formatLong = (bucketStart) => {
    const date = toSiteDate(bucketStart);
    if (!date) return "";
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      ...(granularity === "HOUR"
        ? { hour: "2-digit", minute: "2-digit" }
        : {}),
      timeZone: "UTC",
    }).format(date);
  };

  if (!hasValues) {
    return (
      <SectionEmpty
        title={t("analytics_empty_chart")}
        icon={<MdChartFallback />}
      />
    );
  }

  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const maxVisitors = Math.max(
    1,
    ...values.map((point) => point.visitorsValue),
  );
  const maxPageViews = Math.max(
    1,
    ...values.map((point) => point.pageViewsValue),
  );
  const band = innerWidth / Math.max(values.length, 1);
  const barWidth = Math.max(2, Math.min(18, band * 0.52));
  const xAt = (index) => PADDING.left + (index + 0.5) * band;
  const yVisitors = (value) =>
    PADDING.top + innerHeight - (value / maxVisitors) * innerHeight;
  const yPageViews = (value) =>
    PADDING.top + innerHeight - (value / maxPageViews) * innerHeight;

  const linePath = values
    .map((point, index) => {
      const x = xAt(index);
      const y = yPageViews(point.pageViewsValue);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  const tickStep = Math.max(1, Math.ceil(values.length / 6));
  const tickIndexes = values
    .map((_, index) => index)
    .filter(
      (index) =>
        index === 0 ||
        index === values.length - 1 ||
        index % tickStep === 0,
    );

  const active = activeIndex == null ? null : values[activeIndex];
  const tooltipLeft =
    activeIndex == null
      ? 0
      : Math.min(
          88,
          Math.max(12, (xAt(activeIndex) / WIDTH) * 100),
        );

  return (
    <div className="analytics-chart">
      <div className="analytics-legend">
        <span className="analytics-legend-item">
          <span
            className="analytics-legend-swatch analytics-legend-swatch--bar"
            aria-hidden="true"
          />
          {t("analytics_legend_visitors")}
        </span>
        <span className="analytics-legend-item">
          <span
            className="analytics-legend-swatch analytics-legend-swatch--line"
            aria-hidden="true"
          />
          {t("analytics_legend_page_views")}
        </span>
      </div>

      <div className="analytics-chart-canvas">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`${t("analytics_traffic_trend")}: ${t("analytics_legend_visitors")} / ${t("analytics_legend_page_views")}`}
          onMouseLeave={() => setActiveIndex(null)}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = PADDING.top + innerHeight - fraction * innerHeight;
            return (
              <g key={`grid-${fraction}`}>
                <line
                  x1={PADDING.left}
                  x2={WIDTH - PADDING.right}
                  y1={y}
                  y2={y}
                  className="analytics-chart-grid"
                />
                <text
                  x={PADDING.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="analytics-chart-axis"
                >
                  {formatNumber(Math.round(maxVisitors * fraction))}
                </text>
                <text
                  x={WIDTH - PADDING.right + 8}
                  y={y + 4}
                  textAnchor="start"
                  className="analytics-chart-axis analytics-chart-axis--right"
                >
                  {formatNumber(Math.round(maxPageViews * fraction))}
                </text>
              </g>
            );
          })}

          {values.map((point, index) => {
            const x = xAt(index);
            const barY = yVisitors(point.visitorsValue);
            const barHeight = Math.max(
              0,
              PADDING.top + innerHeight - barY,
            );
            return (
              <rect
                key={`bar-${point.bucketStart}-${index}`}
                x={x - barWidth / 2}
                y={barY}
                width={barWidth}
                height={barHeight}
                rx={Math.min(4, barWidth / 2)}
                className="analytics-chart-bar"
              />
            );
          })}

          <path d={linePath} className="analytics-chart-line" />

          {activeIndex != null ? (
            <line
              x1={xAt(activeIndex)}
              x2={xAt(activeIndex)}
              y1={PADDING.top}
              y2={PADDING.top + innerHeight}
              className="analytics-chart-guide"
            />
          ) : null}

          {values.map((point, index) => (
            <g key={`hit-${point.bucketStart}-${index}`}>
              <circle
                cx={xAt(index)}
                cy={yPageViews(point.pageViewsValue)}
                r={activeIndex === index ? 4.5 : 3}
                className="analytics-chart-dot"
              />
              <rect
                x={PADDING.left + index * band}
                y={PADDING.top}
                width={band}
                height={innerHeight}
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`${formatLong(point.bucketStart)}: ${formatNumber(point.visitorsValue)} ${t("analytics_legend_visitors")}, ${formatNumber(point.pageViewsValue)} ${t("analytics_legend_page_views")}`}
                onPointerEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(null)}
              />
            </g>
          ))}

          {tickIndexes.map((index) => (
            <text
              key={`label-${index}`}
              x={xAt(index)}
              y={HEIGHT - 14}
              textAnchor="middle"
              className="analytics-chart-axis"
            >
              {formatShort(values[index].bucketStart)}
            </text>
          ))}
        </svg>

        {active ? (
          <div
            className="analytics-chart-tooltip"
            style={{ left: `${tooltipLeft}%` }}
            role="status"
          >
            <p className="analytics-chart-tooltip-title">
              {formatLong(active.bucketStart)}
            </p>
            <p>
              <span className="analytics-dot analytics-dot--accent" aria-hidden="true" />
              {formatNumber(active.visitorsValue)} {t("analytics_legend_visitors")}
            </p>
            <p>
              <span className="analytics-dot analytics-dot--info" aria-hidden="true" />
              {formatNumber(active.pageViewsValue)} {t("analytics_legend_page_views")}
            </p>
          </div>
        ) : null}
      </div>

      <table className="sr-only">
        <caption>{t("analytics_traffic_trend")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("analytics_period_today")}</th>
            <th scope="col">{t("analytics_legend_visitors")}</th>
            <th scope="col">{t("analytics_legend_page_views")}</th>
          </tr>
        </thead>
        <tbody>
          {values.map((point) => (
            <tr key={`sr-${point.bucketStart}`}>
              <th scope="row">{formatLong(point.bucketStart)}</th>
              <td>{formatNumber(point.visitorsValue)}</td>
              <td>{formatNumber(point.pageViewsValue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MdChartFallback() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 19V5m0 14h16M7 15l3-4 3 2 4-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
