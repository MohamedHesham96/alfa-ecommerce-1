"use client";

import {
  MdAttachMoney,
  MdCancel,
  MdInfoOutline,
  MdLocalShipping,
  MdOutlineReceiptLong,
  MdPaid,
  MdPercent,
  MdShoppingBasket,
  MdShoppingCartCheckout,
  MdTrendingUp,
  MdUndo,
} from "react-icons/md";

import { useLanguage } from "../../../../../context/LanguageContext.js";
import StatCard from "../../../components/ui/StatCard";
import {
  formatMoney,
  formatNumber,
  formatPercent,
} from "../salesReportUtils";

function DeltaLine({ delta, money, locale, currency, inverse, t }) {
  if (!delta) return null;
  const absolute = Number(delta.absoluteDifference ?? 0);
  const percent = delta.percentageDifference;
  const positive = absolute > 0;
  const negative = absolute < 0;
  const tone = positive
    ? inverse
      ? "sales-report-delta--bad"
      : "sales-report-delta--good"
    : negative
      ? inverse
        ? "sales-report-delta--good"
        : "sales-report-delta--bad"
      : "sales-report-delta--flat";
  const prefix = positive ? "+" : "";
  const absoluteLabel = money
    ? formatMoney(absolute, locale, currency)
    : formatNumber(absolute, locale);
  const percentLabel =
    percent === null || percent === undefined ? "—" : formatPercent(percent, locale);
  return (
    <span className={`sales-report-delta ${tone}`}>
      {prefix}
      {absoluteLabel} ({percentLabel}) {t("sales_report_vs_previous")}
    </span>
  );
}

export default function SalesReportKpis({
  summary,
  onDrillDown,
}) {
  const { t, locale } = useLanguage();
  if (!summary) return null;
  const currency = summary.currency || t("currency");
  const comparison = summary.comparison;
  const metrics = summary.metrics;

  const cards = [
    {
      key: "grossSales",
      label: t("sales_report_kpi_gross"),
      tip: t("sales_report_tip_gross"),
      icon: <MdTrendingUp />,
      tone: "blue",
      value: formatMoney(metrics.grossSales, locale, currency),
      delta: comparison?.deltas?.grossSales,
      money: true,
      drill: {},
    },
    {
      key: "netSales",
      label: t("sales_report_kpi_net"),
      tip: t("sales_report_tip_net"),
      icon: <MdOutlineReceiptLong />,
      tone: "green",
      value: formatMoney(metrics.netSales, locale, currency),
      delta: comparison?.deltas?.netSales,
      money: true,
      drill: {},
    },
    {
      key: "deliveredRevenue",
      label: t("sales_report_kpi_delivered"),
      tip: t("sales_report_tip_delivered"),
      icon: <MdLocalShipping />,
      tone: "purple",
      value: formatMoney(metrics.deliveredRevenue, locale, currency),
      delta: comparison?.deltas?.deliveredRevenue,
      money: true,
      drill: { orderStates: ["DELIVERED"] },
    },
    {
      key: "totalOrders",
      label: t("sales_report_kpi_total_orders"),
      tip: t("sales_report_tip_total_orders"),
      icon: <MdShoppingCartCheckout />,
      tone: "amber",
      value: formatNumber(metrics.totalOrders, locale),
      delta: comparison?.deltas?.totalOrders,
      money: false,
      drill: {},
    },
    {
      key: "averageOrderValue",
      label: t("sales_report_kpi_aov"),
      tip: t("sales_report_tip_aov"),
      icon: <MdAttachMoney />,
      tone: "rose",
      value: formatMoney(metrics.averageOrderValue, locale, currency),
      delta: comparison?.deltas?.averageOrderValue,
      money: true,
      drill: {},
    },
    {
      key: "itemsSold",
      label: t("sales_report_kpi_items"),
      tip: t("sales_report_tip_items"),
      icon: <MdShoppingBasket />,
      tone: "blue",
      value: formatNumber(metrics.itemsSold, locale),
      delta: comparison?.deltas?.itemsSold,
      money: false,
      drill: {},
    },
    {
      key: "totalDiscounts",
      label: t("sales_report_kpi_discounts"),
      tip: t("sales_report_tip_discounts"),
      icon: <MdPercent />,
      tone: "amber",
      value: formatMoney(metrics.totalDiscounts, locale, currency),
      delta: comparison?.deltas?.totalDiscounts,
      money: true,
      drill: {},
    },
    {
      key: "shippingCharges",
      label: t("sales_report_kpi_shipping"),
      tip: t("sales_report_tip_shipping"),
      icon: <MdLocalShipping />,
      tone: "gray",
      value: formatMoney(metrics.shippingCharges, locale, currency),
      delta: comparison?.deltas?.shippingCharges,
      money: true,
      drill: { fulfillmentTypes: ["DELIVERY"] },
    },
    {
      key: "cancelledOrders",
      label: t("sales_report_kpi_cancelled_orders"),
      tip: t("sales_report_tip_cancelled_orders"),
      icon: <MdCancel />,
      tone: "rose",
      value: formatNumber(metrics.cancelledOrders, locale),
      delta: comparison?.deltas?.cancelledOrders,
      money: false,
      drill: { orderStates: ["CANCELLED"] },
      inverse: true,
    },
    {
      key: "cancelledValue",
      label: t("sales_report_kpi_cancelled_value"),
      tip: t("sales_report_tip_cancelled_value"),
      icon: <MdPaid />,
      tone: "rose",
      value: formatMoney(metrics.cancelledTotalValue, locale, currency),
      delta: comparison?.deltas?.cancelledTotalValue,
      money: true,
      drill: { orderStates: ["CANCELLED"] },
      inverse: true,
      hint: (
        <span className="sales-report-kpi-subhint">
          {t("sales_report_cancelled_merchandise")}:{" "}
          {formatMoney(metrics.cancelledMerchandiseValue, locale, currency)}
          {" · "}
          {t("sales_report_cancelled_shipping")}:{" "}
          {formatMoney(metrics.cancelledShippingValue, locale, currency)}
        </span>
      ),
    },
    {
      key: "returnedOrders",
      label: t("sales_report_kpi_returned_orders"),
      tip: t("sales_report_tip_returned_orders"),
      icon: <MdUndo />,
      tone: "purple",
      value: formatNumber(metrics.returnedOrders, locale),
      delta: comparison?.deltas?.returnedOrders,
      money: false,
      drill: {},
      inverse: true,
    },
  ];

  return (
    <div className="sales-report-kpi-grid">
      {cards.map((card) => (
        <StatCard
          key={card.key}
          label={
            <span className="sales-report-kpi-label">
              {card.label}
              <span
                className="sales-report-kpi-info"
                title={card.tip}
                aria-label={card.tip}
              >
                <MdInfoOutline aria-hidden="true" />
              </span>
            </span>
          }
          value={card.value}
          icon={card.icon}
          tone={card.tone}
          onClick={() => onDrillDown?.(card.drill ?? {}, card.key)}
          hint={
            <span className="sales-report-kpi-hint">
              {card.hint}
              {comparison?.enabled ? (
                <DeltaLine
                  delta={card.delta}
                  money={card.money}
                  locale={locale}
                  currency={currency}
                  inverse={card.inverse}
                  t={t}
                />
              ) : null}
            </span>
          }
        />
      ))}
    </div>
  );
}
