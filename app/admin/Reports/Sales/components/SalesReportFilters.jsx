"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncSelect from "react-select/async";
import Select from "react-select";
import { MdFilterList, MdRefresh } from "react-icons/md";

import { useLanguage } from "../../../../../context/LanguageContext.js";
import {
  fetchCategoryOptions,
  searchCustomerOptions,
  searchProductOptions,
} from "../../../services/salesReportService";
import { countActiveFilters, cloneFilters } from "../salesReportUtils";
import { salesReportSelectStyles } from "../salesReportSelectStyles";
import { createDefaultSalesReportFilter } from "../../../types/salesReport.types";

const PRESETS = [
  "TODAY",
  "YESTERDAY",
  "LAST_7_DAYS",
  "LAST_30_DAYS",
  "LAST_90_DAYS",
  "THIS_WEEK",
  "LAST_WEEK",
  "THIS_MONTH",
  "LAST_MONTH",
  "THIS_YEAR",
  "CUSTOM",
];

const ORDER_STATES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAYMENT_METHODS = ["CASH_ON_DELIVERY", "INSTAPAY", "CREDIT_CARD"];
const FULFILLMENT_TYPES = ["DELIVERY", "PICKUP"];

function selectedOptions(values, choices) {
  return (values ?? []).map((value) => {
    const existing = choices.find(
      (choice) => String(choice.value) === String(value),
    );
    if (existing) return existing;
    return { value, label: `#${value}` };
  });
}

function mergeChoices(previous, incoming) {
  const map = new Map(previous.map((choice) => [Number(choice.value), choice]));
  incoming.forEach((choice) => map.set(Number(choice.value), choice));
  return Array.from(map.values());
}

export default function SalesReportFilters({
  value,
  onApply,
  onReset,
  appliedRange,
  lastUpdatedLabel,
  loading,
}) {
  const { t, locale } = useLanguage();
  const [draft, setDraft] = useState(() => cloneFilters(value));
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [customerChoices, setCustomerChoices] = useState([]);
  const [productChoices, setProductChoices] = useState([]);
  const [error, setError] = useState("");
  const customerTimer = useRef(null);
  const productTimer = useRef(null);
  const customerResolvers = useRef([]);
  const productResolvers = useRef([]);

  useEffect(() => {
    setDraft(cloneFilters(value));
    setError("");
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    fetchCategoryOptions(locale)
      .then((options) => {
        if (!cancelled) setCategoryOptions(options);
      })
      .catch(() => {
        if (!cancelled) setCategoryOptions([]);
      });
    return () => {
      cancelled = true;
      window.clearTimeout(customerTimer.current);
      window.clearTimeout(productTimer.current);
      customerResolvers.current = [];
      productResolvers.current = [];
    };
  }, [locale]);

  const loadCustomerOptions = useCallback((input) => {
    return new Promise((resolve) => {
      customerResolvers.current.push(resolve);
      window.clearTimeout(customerTimer.current);
      customerTimer.current = window.setTimeout(async () => {
        const resolvers = customerResolvers.current;
        customerResolvers.current = [];
        try {
          const options = await searchCustomerOptions(input);
          setCustomerChoices((previous) => mergeChoices(previous, options));
          resolvers.forEach((done) => done(options));
        } catch {
          resolvers.forEach((done) => done([]));
        }
      }, 300);
    });
  }, []);

  const loadProductOptions = useCallback((input) => {
    return new Promise((resolve) => {
      productResolvers.current.push(resolve);
      window.clearTimeout(productTimer.current);
      productTimer.current = window.setTimeout(async () => {
        const resolvers = productResolvers.current;
        productResolvers.current = [];
        try {
          const options = await searchProductOptions(input, locale);
          setProductChoices((previous) => mergeChoices(previous, options));
          resolvers.forEach((done) => done(options));
        } catch {
          resolvers.forEach((done) => done([]));
        }
      }, 300);
    });
  }, [locale]);

  const activeCount = useMemo(() => countActiveFilters(value), [value]);
  const stateChoices = useMemo(
    () => ORDER_STATES.map((state) => ({ value: state, label: t(state) })),
    [t],
  );
  const paymentChoices = useMemo(
    () => PAYMENT_METHODS.map((method) => ({ value: method, label: t(method) })),
    [t],
  );
  const fulfillmentChoices = useMemo(
    () => FULFILLMENT_TYPES.map((type) => ({ value: type, label: t(type) })),
    [t],
  );

  const update = (partial) => setDraft((previous) => ({ ...previous, ...partial }));

  const apply = () => {
    if (draft.datePreset === "CUSTOM") {
      if (!draft.fromDate || !draft.toDate) {
        setError(t("sales_report_custom_dates_required"));
        return;
      }
      if (draft.toDate < draft.fromDate) {
        setError(t("sales_report_custom_dates_invalid"));
        return;
      }
    }
    if (
      draft.minOrderValue !== null &&
      draft.maxOrderValue !== null &&
      Number(draft.minOrderValue) > Number(draft.maxOrderValue)
    ) {
      setError(t("sales_report_order_value_invalid"));
      return;
    }
    setError("");
    onApply(cloneFilters(draft));
  };

  const reset = () => {
    setDraft(createDefaultSalesReportFilter());
    setError("");
    onReset();
  };

  return (
    <section className="admin-card sales-report-filter-card">
      <div className="admin-card-header">
        <div>
          <h2 className="admin-card-title flex items-center gap-2">
            <MdFilterList aria-hidden="true" />
            {t("sales_report_filters_title")}
            {activeCount > 0 ? (
              <span className="admin-badge admin-badge-blue">
                {t("sales_report_filters_applied").replace(
                  "{count}",
                  String(activeCount),
                )}
              </span>
            ) : null}
          </h2>
          <p className="admin-card-description">
            {t("sales_report_filters_description")}
          </p>
        </div>
        <div className="sales-report-filter-meta">
          <span>
            {t("sales_report_applied_range")}:{" "}
            <strong>{appliedRange || "—"}</strong>
          </span>
          {lastUpdatedLabel ? (
            <span>
              {t("sales_report_last_updated")}:{" "}
              <strong>{lastUpdatedLabel}</strong>
            </span>
          ) : null}
        </div>
      </div>

      <div className="admin-card-body sales-report-filter-body">
        <div>
          <span className="admin-label">{t("sales_report_date_range")}</span>
          <div className="sales-report-preset-grid">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`sales-report-preset ${
                  draft.datePreset === preset ? "sales-report-preset--active" : ""
                }`}
                aria-pressed={draft.datePreset === preset}
                onClick={() => update({ datePreset: preset })}
              >
                {t(`sales_report_preset_${preset}`)}
              </button>
            ))}
          </div>
          {draft.datePreset === "CUSTOM" ? (
            <div className="sales-report-date-inputs">
              <label className="admin-field">
                <span className="admin-label">{t("sales_report_from")}</span>
                <input
                  type="date"
                  className="admin-input"
                  value={draft.fromDate ?? ""}
                  onChange={(event) => update({ fromDate: event.target.value || null })}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">{t("sales_report_to")}</span>
                <input
                  type="date"
                  className="admin-input"
                  value={draft.toDate ?? ""}
                  min={draft.fromDate ?? undefined}
                  onChange={(event) => update({ toDate: event.target.value || null })}
                />
              </label>
            </div>
          ) : null}
        </div>

        <div className="sales-report-filter-grid">
          <label className="admin-field">
            <span className="admin-label">{t("sales_report_order_status")}</span>
            <Select
              isMulti
              isClearable
              isSearchable
              options={stateChoices}
              value={selectedOptions(draft.orderStates, stateChoices)}
              onChange={(selected) =>
                update({ orderStates: (selected ?? []).map((item) => item.value) })
              }
              placeholder={t("sales_report_all")}
              styles={salesReportSelectStyles}
              classNamePrefix="admin-select"
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />
          </label>

          <label className="admin-field">
            <span className="admin-label">{t("sales_report_payment_method")}</span>
            <Select
              isMulti
              isClearable
              isSearchable={false}
              options={paymentChoices}
              value={selectedOptions(draft.paymentMethods, paymentChoices)}
              onChange={(selected) =>
                update({ paymentMethods: (selected ?? []).map((item) => item.value) })
              }
              placeholder={t("sales_report_all")}
              styles={salesReportSelectStyles}
              classNamePrefix="admin-select"
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />
          </label>

          <label className="admin-field">
            <span className="admin-label">{t("sales_report_fulfillment_type")}</span>
            <Select
              isMulti
              isClearable
              isSearchable={false}
              options={fulfillmentChoices}
              value={selectedOptions(draft.fulfillmentTypes, fulfillmentChoices)}
              onChange={(selected) =>
                update({ fulfillmentTypes: (selected ?? []).map((item) => item.value) })
              }
              placeholder={t("sales_report_all")}
              styles={salesReportSelectStyles}
              classNamePrefix="admin-select"
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />
          </label>

          <label className="admin-field">
            <span className="admin-label">{t("sales_report_customer")}</span>
            <AsyncSelect
              isMulti
              isClearable
              cacheOptions
              defaultOptions={false}
              loadOptions={loadCustomerOptions}
              value={selectedOptions(draft.userIds, customerChoices)}
              onChange={(selected) =>
                update({ userIds: (selected ?? []).map((item) => Number(item.value)) })
              }
              placeholder={t("sales_report_search_customer")}
              styles={salesReportSelectStyles}
              classNamePrefix="admin-select"
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />
          </label>

          <label className="admin-field">
            <span className="admin-label">{t("sales_report_product")}</span>
            <AsyncSelect
              key={`sales-product-${locale}`}
              isMulti
              isClearable
              cacheOptions
              defaultOptions={false}
              loadOptions={loadProductOptions}
              value={selectedOptions(draft.productIds, productChoices)}
              onChange={(selected) =>
                update({ productIds: (selected ?? []).map((item) => Number(item.value)) })
              }
              placeholder={t("sales_report_search_product")}
              styles={salesReportSelectStyles}
              classNamePrefix="admin-select"
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />
          </label>

          <label className="admin-field">
            <span className="admin-label">{t("sales_report_category")}</span>
            <Select
              isMulti
              isClearable
              isSearchable
              options={categoryOptions}
              value={selectedOptions(draft.categoryIds, categoryOptions)}
              onChange={(selected) =>
                update({ categoryIds: (selected ?? []).map((item) => Number(item.value)) })
              }
              placeholder={t("sales_report_all")}
              styles={salesReportSelectStyles}
              classNamePrefix="admin-select"
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />
          </label>

          <label className="admin-field">
            <span className="admin-label">{t("sales_report_min_order_value")}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="admin-input"
              value={draft.minOrderValue ?? ""}
              onChange={(event) =>
                update({
                  minOrderValue:
                    event.target.value === "" ? null : Number(event.target.value),
                })
              }
              placeholder="0.00"
            />
          </label>

          <label className="admin-field">
            <span className="admin-label">{t("sales_report_max_order_value")}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="admin-input"
              value={draft.maxOrderValue ?? ""}
              onChange={(event) =>
                update({
                  maxOrderValue:
                    event.target.value === "" ? null : Number(event.target.value),
                })
              }
              placeholder="0.00"
            />
          </label>
        </div>

        <label className="sales-report-checkbox">
          <input
            type="checkbox"
            checked={draft.compare}
            onChange={(event) => update({ compare: event.target.checked })}
          />
          <span>{t("sales_report_compare_previous")}</span>
        </label>

        {error ? (
          <p className="sales-report-filter-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="sales-report-filter-actions">
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={apply}
            disabled={loading}
          >
            {t("sales_report_apply_filters")}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={reset}
            disabled={loading}
          >
            <MdRefresh aria-hidden="true" />
            {t("sales_report_reset_filters")}
          </button>
          <span className="sales-report-filter-count">
            {t("sales_report_active_filters")}: <strong>{activeCount}</strong>
          </span>
          {appliedRange ? (
            <span className="sales-report-filter-range">
              {t("sales_report_displayed_range")}: {appliedRange}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
