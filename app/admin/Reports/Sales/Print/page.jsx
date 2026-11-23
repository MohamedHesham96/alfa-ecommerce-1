"use client";

import { useEffect, useMemo, useState } from "react";
import { MdPrint } from "react-icons/md";

import { useLanguage } from "../../../../../context/LanguageContext.js";
import {
  decodeFiltersFromUrl,
  fetchSalesReportOrders,
  fetchSalesReportSummary,
} from "../../../services/salesReportService";
import { createDefaultSalesReportFilter } from "../../../types/salesReport.types";
import SalesReportKpis from "../components/SalesReportKpis";
import SalesReportFeatureGate from "../SalesReportFeatureGate";
import {
  DayHourHeatmap,
  SalesCategoryChart,
  SalesCompositionChart,
  SalesOverTimeChart,
  TopProductsCard,
} from "../components/SalesReportCharts";
import {
  customerLabel,
  formatInstantInZone,
  formatMoney,
  formatNumber,
  formatOrderDate,
  formatRange,
  orderDisplayDate,
} from "../salesReportUtils";

function SalesReportPrintPageContent() {
  const { t, locale } = useLanguage();
  const [filters, setFilters] = useState(null);
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const decoded = decodeFiltersFromUrl(params.get("filters"));
    setFilters(
      decoded
        ? { ...createDefaultSalesReportFilter(), ...decoded }
        : createDefaultSalesReportFilter(),
    );
    setAutoPrint(params.get("autoPrint") === "1");
  }, []);

  useEffect(() => {
    if (!filters) return undefined;
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(false);

    const loadOrders = async () => {
      const pageSize = 100;
      const maxPrintRows = 1000;
      let page = 0;
      let allRows = [];
      let total = 0;
      let totalPages = 1;
      do {
        const ordersData = await fetchSalesReportOrders(
          {
            filters,
            page,
            size: pageSize,
            sorting: [{ field: "createdDate", direction: "DESC" }],
          },
          controller.signal,
        );
        allRows = allRows.concat(ordersData.content);
        total = ordersData.page.totalElements;
        totalPages = ordersData.page.totalPages;
        page += 1;
      } while (page < totalPages && allRows.length < maxPrintRows && !cancelled);
      return { rows: allRows.slice(0, maxPrintRows), total };
    };

    Promise.all([
      fetchSalesReportSummary(filters, controller.signal, {
        includeDataQuality: false,
      }),
      loadOrders(),
    ])
      .then(([summaryData, ordersData]) => {
        if (cancelled) return;
        setSummary(summaryData);
        setOrders(ordersData.rows);
        setTotalOrders(ordersData.total);
      })
      .catch((requestError) => {
        if (cancelled || requestError?.name === "CanceledError") return;
        setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [filters]);

  useEffect(() => {
    if (!autoPrint || loading || !summary) return undefined;
    const timer = window.setTimeout(() => window.print(), 700);
    return () => window.clearTimeout(timer);
  }, [autoPrint, loading, summary]);

  const filterSummary = useMemo(() => {
    if (!filters) return [];
    return [
      {
        label: t("sales_report_date_range"),
        value: summary ? formatRange(summary.range) : filters.datePreset,
      },
      {
        label: t("sales_report_order_status"),
        value: filters.orderStates.length
          ? filters.orderStates.map((state) => t(state)).join(", ")
          : t("sales_report_all"),
      },
      {
        label: t("sales_report_payment_method"),
        value: filters.paymentMethods.length
          ? filters.paymentMethods.map((method) => t(method)).join(", ")
          : t("sales_report_all"),
      },
      {
        label: t("sales_report_fulfillment_type"),
        value: filters.fulfillmentTypes.length
          ? filters.fulfillmentTypes.map((type) => t(type)).join(", ")
          : t("sales_report_all"),
      },
      {
        label: t("sales_report_customers"),
        value: filters.userIds.length ? filters.userIds.join(", ") : t("sales_report_all"),
      },
      {
        label: t("sales_report_products"),
        value: filters.productIds.length ? filters.productIds.join(", ") : t("sales_report_all"),
      },
      {
        label: t("sales_report_categories"),
        value: filters.categoryIds.length ? filters.categoryIds.join(", ") : t("sales_report_all"),
      },
      {
        label: t("sales_report_order_value"),
        value:
          (filters.minOrderValue === null || filters.minOrderValue === undefined) &&
          (filters.maxOrderValue === null || filters.maxOrderValue === undefined)
            ? t("sales_report_all")
            : `${filters.minOrderValue ?? "0"} — ${filters.maxOrderValue ?? "∞"}`,
      },
      {
        label: t("sales_report_compare_previous"),
        value: filters.compare ? t("sales_report_yes") : t("sales_report_no"),
      },
    ];
  }, [filters, summary, t]);

  return (
    <div className="admin-page sales-report-print-page">
      <div className="sales-report-print-toolbar sales-report-no-print">
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={() => window.print()}
          disabled={!summary || loading}
        >
          <MdPrint aria-hidden="true" />
          {t("sales_report_print")}
        </button>
        <span>{t("sales_report_print_hint")}</span>
      </div>

      {error ? (
        <div className="admin-alert admin-alert-danger" role="alert">
          <p className="font-semibold">{t("sales_report_error_title")}</p>
          <p>{t("sales_report_error_description")}</p>
        </div>
      ) : null}

      {loading && !summary ? (
        <div className="admin-alert admin-alert-info">{t("loading")}</div>
      ) : null}

      {summary ? (
        <div className="sales-report-print-document">
          <header className="sales-report-print-header">
            <div>
              <p className="sales-report-print-eyebrow">{t("sales_report_print_eyebrow")}</p>
              <h1>{t("sales_report")}</h1>
              <p>
                {formatRange(summary.range)} · {summary.timezone}
              </p>
            </div>
            <div className="sales-report-print-generated">
              <span>{t("sales_report_last_updated")}</span>
              <strong>
                {summary.generatedAtDisplay ||
                  formatInstantInZone(summary.generatedAt, locale, summary.timezone)}
              </strong>
              {summary.timestampMetadata ? (
                <span>
                  {t("sales_report_timestamp_mode")}:{" "}
                  {summary.timestampMetadata.configuredMode}
                  {" → "}
                  {summary.timestampMetadata.resolvedMode}
                </span>
              ) : null}
              <span>
                {t("sales_report_currency")}:{" "}
                {locale === "ar" ? t("currency") : summary.currency}
              </span>
            </div>
          </header>

          <section className="sales-report-print-filters">
            <h2>{t("sales_report_filters_title")}</h2>
            <dl>
              {filterSummary.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <SalesReportKpis summary={summary} />

          <div className="sales-report-charts-grid sales-report-print-charts">
            <SalesOverTimeChart summary={summary} />
            <SalesCompositionChart summary={summary} />
            <SalesCategoryChart summary={summary} />
            <TopProductsCard summary={summary} />
            <DayHourHeatmap summary={summary} />
          </div>

          <section className="sales-report-print-table">
            <h2>{t("sales_report_table_title")}</h2>
            <p className="sales-report-print-note">
              {t("sales_report_showing")
                .replace("{from}", orders.length ? "1" : "0")
                .replace("{to}", formatNumber(orders.length, locale))
                .replace("{total}", formatNumber(totalOrders, locale))}
              {totalOrders > orders.length
                ? ` — ${t("sales_report_print_first_page_note")}`
                : ""}
            </p>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("sales_report_order_number")}</th>
                  <th>{t("sales_report_order_date")}</th>
                  <th>{t("sales_report_customer")}</th>
                  <th>{t("sales_report_order_status")}</th>
                  <th>{t("sales_report_payment_method")}</th>
                  <th>{t("sales_report_fulfillment_type")}</th>
                  <th>{t("sales_report_items_count")}</th>
                  <th>{t("sales_report_subtotal")}</th>
                  <th>{t("sales_report_discount")}</th>
                  <th>{t("sales_report_shipping")}</th>
                  <th>{t("sales_report_total")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderId}>
                    <td>{order.code}</td>
                    <td>{formatOrderDate(orderDisplayDate(order), locale)}</td>
                    <td>{customerLabel(order.customer)}</td>
                    <td>{t(order.state)}</td>
                    <td>{order.paymentMethod ? t(order.paymentMethod) : "—"}</td>
                    <td>{order.fulfillmentType ? t(order.fulfillmentType) : "—"}</td>
                    <td>{formatNumber(order.itemsCount, locale)}</td>
                    <td>{formatMoney(order.subtotal, locale, summary.currency)}</td>
                    <td>{formatMoney(order.discount, locale, summary.currency)}</td>
                    <td>{formatMoney(order.shipping, locale, summary.currency)}</td>
                    <td>{formatMoney(order.total, locale, summary.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <footer className="sales-report-print-footer">
            <p>{t("sales_report_unsupported_note")}</p>
            <p>{t("sales_report_print_footer_note")}</p>
          </footer>
        </div>
      ) : null}
    </div>
  );
}

export default function SalesReportPrintPage() {
  return (
    <SalesReportFeatureGate>
      <SalesReportPrintPageContent />
    </SalesReportFeatureGate>
  );
}
