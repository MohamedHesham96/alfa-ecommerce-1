"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  MdDownload,
  MdOpenInNew,
  MdPreview,
  MdPrint,
} from "react-icons/md";

import { useLanguage } from "../../../../context/LanguageContext.js";
import AdminPageHeader from "../../components/ui/AdminPageHeader";
import AdminModal from "../../components/ui/AdminModal";
import {
  buildSalesReportPrintUrl,
  createSavedReportFilter,
  decodeFiltersFromUrl,
  deleteSavedReportFilter,
  downloadSalesReport,
  fetchSavedReportFilters,
  setDefaultSavedReportFilter,
  updateSavedReportFilter,
} from "../../services/salesReportService";
import { createDefaultSalesReportFilter } from "../../types/salesReport.types";
import SalesReportFilters from "./components/SalesReportFilters";
import SavedReportFilters from "./components/SavedReportFilters";
import SalesReportKpis from "./components/SalesReportKpis";
import {
  DayHourHeatmap,
  SalesCategoryChart,
  SalesCompositionChart,
  SalesOverTimeChart,
  TopProductsCard,
} from "./components/SalesReportCharts";
import SalesReportTable from "./components/SalesReportTable";
import SalesReportPreview from "./components/SalesReportPreview";
import SalesReportFeatureGate from "./SalesReportFeatureGate";
import { useSalesReportSummary } from "./useSalesReportSummary";
import {
  cloneFilters,
  countActiveFilters,
  formatInstantInZone,
  formatNumber,
  formatRange,
  mergeAppliedFilters,
  orphanReturnCount,
} from "./salesReportUtils";

function SalesReportPageContent() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [filtersReady, setFiltersReady] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(() =>
    createDefaultSalesReportFilter(),
  );
  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0);
  const [tableSearch, setTableSearch] = useState("");
  const [tableRefreshKey, setTableRefreshKey] = useState(0);
  const [savedFilters, setSavedFilters] = useState([]);
  const [selectedSavedId, setSelectedSavedId] = useState(null);
  const [savedBusy, setSavedBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveMode, setSaveMode] = useState("create");
  const [saveName, setSaveName] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  const {
    summary,
    loading: summaryLoading,
    error: summaryError,
  } = useSalesReportSummary({
    filters: appliedFilters,
    enabled: filtersReady,
    refreshKey: summaryRefreshKey,
  });

  useEffect(() => {
    if (summaryLoading) setPreviewOpen(false);
  }, [summaryLoading]);

  useEffect(() => {
    let cancelled = false;
    const initialize = async () => {
      let initial = createDefaultSalesReportFilter();
      let selectedId = null;

      let list = [];
      try {
        list = await fetchSavedReportFilters();
      } catch {
        list = [];
      }
      if (!cancelled) setSavedFilters(list);

      const params =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : new URLSearchParams();
      const urlFilters = decodeFiltersFromUrl(params.get("filters"));
      if (urlFilters) {
        initial = cloneFilters({ ...initial, ...urlFilters });
      } else {
        const defaultFilter = list.find(
          (item) => item.defaultFilter && item.valid && item.filters,
        );
        if (defaultFilter?.filters) {
          initial = cloneFilters(defaultFilter.filters);
          selectedId = defaultFilter.savedFilterId;
        }
      }

      if (!cancelled) {
        setAppliedFilters(initial);
        setSelectedSavedId(selectedId);
        setFiltersReady(true);
      }
    };
    void initialize();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshSavedFilters = useCallback(async () => {
    const list = await fetchSavedReportFilters();
    setSavedFilters(list);
    return list;
  }, []);

  const scrollToTable = useCallback(() => {
    window.setTimeout(() => {
      document
        .getElementById("sales-report-details")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, []);

  const applyFilters = useCallback(
    (nextFilters) => {
      setPreviewOpen(false);
      setAppliedFilters(cloneFilters(nextFilters));
      setSelectedSavedId(null);
      setTableSearch("");
      setTableRefreshKey((value) => value + 1);
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setPreviewOpen(false);
    setAppliedFilters(createDefaultSalesReportFilter());
    setSelectedSavedId(null);
    setTableSearch("");
    setTableRefreshKey((value) => value + 1);
  }, []);

  const handleDrillDown = useCallback(
    (partial, key) => {
      if (!partial || Object.keys(partial).length === 0) {
        scrollToTable();
        return;
      }
      setPreviewOpen(false);
      setAppliedFilters((current) => mergeAppliedFilters(current, partial));
      setSelectedSavedId(null);
      setTableSearch("");
      setTableRefreshKey((value) => value + 1);
      scrollToTable();
      if (key) {
        toast.info(t("sales_report_drilldown_applied"), { autoClose: 1800 });
      }
    },
    [scrollToTable, t],
  );

  const handleExport = async () => {
    if (!summary || summaryLoading || exporting) return;
    setExporting(true);
    try {
      const { blob, filename } = await downloadSalesReport(
        appliedFilters,
        locale === "ar" ? "ar" : "en",
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      // The shared request layer already shows the backend message.
    } finally {
      setExporting(false);
    }
  };

  const openReportTab = () => {
    window.open(
      buildSalesReportPrintUrl(appliedFilters),
      "_blank",
      "noopener,noreferrer",
    );
  };

  const printReport = () => {
    window.open(
      `${buildSalesReportPrintUrl(appliedFilters)}&autoPrint=1`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const openOrder = useCallback((orderId) => {
    router.push(`/admin/orders/OrdersDetails/${orderId}`);
  }, [router]);

  const openSaveDialog = (mode) => {
    const selected = savedFilters.find(
      (item) => Number(item.savedFilterId) === Number(selectedSavedId),
    );
    setSaveMode(mode);
    setSaveName(mode === "update" ? selected?.name ?? "" : "");
    setSaveAsDefault(mode === "update" ? Boolean(selected?.defaultFilter) : false);
    setSaveError("");
    setSaveDialogOpen(true);
  };

  const submitSave = async () => {
    if (!saveName.trim()) {
      setSaveError(t("sales_report_saved_name_required"));
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        name: saveName.trim(),
        filters: appliedFilters,
        defaultFilter: saveAsDefault,
      };
      const saved =
        saveMode === "update" && selectedSavedId
          ? await updateSavedReportFilter(selectedSavedId, payload)
          : await createSavedReportFilter(payload);
      setSelectedSavedId(saved.savedFilterId);
      setSaveDialogOpen(false);
      toast.success(
        saveMode === "update"
          ? t("sales_report_saved_filter_updated")
          : t("sales_report_saved_filter_created"),
      );
      refreshSavedFilters().catch(() => {});
    } catch (error) {
      setSaveError(
        error?.response?.data?.error?.message ||
          t("sales_report_saved_filter_save_failed"),
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteSelected = async () => {
    const selected = savedFilters.find(
      (item) => Number(item.savedFilterId) === Number(selectedSavedId),
    );
    if (!selected) return;
    setSavedBusy(true);
    try {
      await deleteSavedReportFilter(
        selected.savedFilterId,
        t("sales_report_delete_confirm").replace("{name}", selected.name),
      );
      setSelectedSavedId(null);
      toast.success(t("sales_report_saved_filter_deleted"));
      refreshSavedFilters().catch(() => {});
    } catch {
      // Request layer reports the error.
    } finally {
      setSavedBusy(false);
    }
  };

  const setDefault = async () => {
    if (!selectedSavedId) return;
    setSavedBusy(true);
    try {
      await setDefaultSavedReportFilter(selectedSavedId);
      toast.success(t("sales_report_saved_filter_default_updated"));
      refreshSavedFilters().catch(() => {});
    } catch {
      // Request layer reports the error.
    } finally {
      setSavedBusy(false);
    }
  };

  const loadSaved = (filters) => {
    if (!filters) return;
    setPreviewOpen(false);
    setAppliedFilters(cloneFilters(filters));
    setTableSearch("");
    setTableRefreshKey((value) => value + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeCount = useMemo(
    () => countActiveFilters(appliedFilters),
    [appliedFilters],
  );
  const reportDataReady = Boolean(summary) && !summaryLoading;
  const appliedRange = summary ? formatRange(summary.range) : "";
  const lastUpdatedLabel = summary
    ? formatInstantInZone(summary.generatedAt, locale, summary.timezone)
    : "";
  const currency = summary?.currency || t("currency");
  const dataQuality = summary?.dataQuality;
  const dataQualityUnavailable = reportDataReady && !dataQuality;
  const globalMissingDates =
    dataQuality?.global?.ordersMissingCreatedDate ??
    dataQuality?.ordersMissingCreatedDate ??
    0;
  const globalOrphanReturns = orphanReturnCount(dataQuality);
  const orphanReturnsUnavailable =
    Boolean(dataQuality) && globalOrphanReturns === null;
  const financialQualityIssues = sumQualityValues(dataQuality?.financial);
  const orderItemQualityIssues = sumQualityValues(dataQuality?.orderItems);
  const scopedReturnQualityIssues =
    (dataQuality?.returns?.returnsWithInvalidQuantity ?? 0) +
    (dataQuality?.returns?.linesWithReturnedQuantityExceedingPurchased ?? 0) +
    (dataQuality?.returns?.returnsWithInvalidState ?? 0) +
    (dataQuality?.returns?.returnsWithNegativeRefund ?? 0) +
    (dataQuality?.returns?.refundAmountMismatches ?? 0);
  const returnQualityIssues = scopedReturnQualityIssues;
  const expandedQualityIssues =
    financialQualityIssues + orderItemQualityIssues + returnQualityIssues;
  const hasDataQualityWarning =
    dataQuality &&
    (orphanReturnsUnavailable ||
      globalMissingDates > 0 ||
      (globalOrphanReturns ?? 0) > 0 ||
      dataQuality?.ordersMissingTotal > 0 ||
      dataQuality?.ordersWithLegacyNetTotalMismatch > 0 ||
      expandedQualityIssues > 0);

  return (
    <div className="admin-page sales-report-page">
      <AdminPageHeader
        eyebrow={t("nav_sales")}
        title={t("sales_report")}
        description={t("sales_report_subtitle")}
        actions={
          <div className="sales-report-header-actions sales-report-no-print">
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              onClick={() => setPreviewOpen(true)}
              disabled={!reportDataReady}
            >
              <MdPreview aria-hidden="true" />
              {t("sales_report_preview")}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              onClick={openReportTab}
              disabled={!reportDataReady}
            >
              <MdOpenInNew aria-hidden="true" />
              {t("sales_report_open_tab")}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              onClick={printReport}
              disabled={!reportDataReady}
            >
              <MdPrint aria-hidden="true" />
              {t("sales_report_print")}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary admin-btn-sm"
              onClick={handleExport}
              disabled={!reportDataReady || exporting}
              aria-busy={exporting}
            >
              <MdDownload aria-hidden="true" />
              {exporting
                ? t("sales_report_exporting")
                : t("sales_report_export_excel")}
            </button>
          </div>
        }
      />

      <section className="admin-card sales-report-saved-card sales-report-no-print">
        <div className="admin-card-body">
          <SavedReportFilters
            savedFilters={savedFilters}
            selectedId={selectedSavedId}
            onSelect={setSelectedSavedId}
            onLoad={loadSaved}
            onSaveCurrent={() => openSaveDialog("create")}
            onUpdateSelected={() => openSaveDialog("update")}
            onDeleteSelected={deleteSelected}
            onSetDefault={setDefault}
            busy={savedBusy || saving}
          />
        </div>
      </section>

      <SalesReportFilters
        value={appliedFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        appliedRange={appliedRange}
        lastUpdatedLabel={lastUpdatedLabel}
        loading={summaryLoading}
      />

      {summaryError && !summary ? (
        <div className="admin-alert admin-alert-danger" role="alert">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t("sales_report_error_title")}</p>
            <p>{t("sales_report_error_description")}</p>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={() => setSummaryRefreshKey((value) => value + 1)}
          >
            {t("sales_report_retry")}
          </button>
        </div>
      ) : null}

      {dataQualityUnavailable ? (
        <div className="admin-alert admin-alert-info" role="status">
          <div className="min-w-0">
            <p className="font-semibold">{t("sales_report_data_quality_title")}</p>
            <p>{t("sales_report_data_quality_unavailable")}</p>
          </div>
        </div>
      ) : null}

      {hasDataQualityWarning ? (
        <div className="admin-alert admin-alert-info" role="status">
          <div className="min-w-0">
            <p className="font-semibold">{t("sales_report_data_quality_title")}</p>
            <p>
              {t("sales_report_data_quality_description")
                .replace(
                  "{missingDates}",
                  formatNumber(globalMissingDates, locale),
                )
                .replace(
                  "{missingTotals}",
                  formatNumber(dataQuality?.ordersMissingTotal ?? 0, locale),
                )
                .replace(
                  "{legacyNetTotal}",
                  formatNumber(
                    dataQuality?.ordersWithLegacyNetTotalMismatch ?? 0,
                    locale,
                  ),
                )}
            </p>
            {expandedQualityIssues > 0 ? (
              <p>
                {t("sales_report_data_quality_expanded")
                  .replace(
                    "{lineIssues}",
                    formatNumber(orderItemQualityIssues, locale),
                  )
                  .replace(
                    "{returnIssues}",
                    formatNumber(returnQualityIssues, locale),
                  )
                  .replace(
                    "{financialIssues}",
                    formatNumber(financialQualityIssues, locale),
                  )}
              </p>
            ) : null}
            {orphanReturnsUnavailable ? (
              <p>{t("sales_report_data_quality_orphans_unavailable")}</p>
            ) : null}
            {globalOrphanReturns !== null && globalOrphanReturns > 0 ? (
              <p>
                {t("sales_report_data_quality_global_returns").replace(
                  "{count}",
                  formatNumber(globalOrphanReturns, locale),
                )}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {!summary && summaryLoading ? <SalesReportSkeleton /> : null}

      {summary ? (
        <>
          <div className="sales-report-applied-bar">
            <span>
              {t("sales_report_active_filters")}: <strong>{activeCount}</strong>
            </span>
            <span>
              {t("sales_report_applied_range")}: <strong>{appliedRange}</strong>
            </span>
            <span>
              {t("sales_report_last_updated")}:{" "}
              <strong>{lastUpdatedLabel}</strong>
            </span>
            {summaryLoading ? (
              <span className="sales-report-refreshing">
                {t("sales_report_refreshing")}
              </span>
            ) : null}
          </div>

          <SalesReportKpis summary={summary} onDrillDown={handleDrillDown} />

          <div className="sales-report-charts-grid">
            <SalesOverTimeChart summary={summary} onDrillDown={handleDrillDown} />
            <SalesCompositionChart summary={summary} onDrillDown={handleDrillDown} />
            <SalesCategoryChart summary={summary} onDrillDown={handleDrillDown} />
            <TopProductsCard summary={summary} onDrillDown={handleDrillDown} />
            <DayHourHeatmap summary={summary} />
          </div>

          <p className="sales-report-limitation">
            {t("sales_report_unsupported_note")}
          </p>

          <SalesReportTable
            key={`${tableRefreshKey}:${tableSearch}`}
            filters={appliedFilters}
            searchTerm={tableSearch}
            onSearch={setTableSearch}
            onOpenOrder={openOrder}
            refreshKey={tableRefreshKey}
            currency={currency}
            timezone={summary.timezone}
          />
        </>
      ) : null}

      <SalesReportPreview
        open={previewOpen && reportDataReady}
        summary={summary}
        onClose={() => setPreviewOpen(false)}
        onOpenTab={openReportTab}
        onPrint={printReport}
      />

      <AdminModal
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        title={
          saveMode === "update"
            ? t("sales_report_update_saved_filter")
            : t("sales_report_save_current_filter")
        }
        description={t("sales_report_save_filter_description")}
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => setSaveDialogOpen(false)}
              disabled={saving}
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={submitSave}
              disabled={saving}
            >
              {t("save")}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="admin-field">
            <span className="admin-label">{t("sales_report_saved_filter_name")}</span>
            <input
              type="text"
              className="admin-input"
              value={saveName}
              onChange={(event) => setSaveName(event.target.value)}
              maxLength={120}
              placeholder={t("sales_report_saved_filter_name_placeholder")}
            />
          </label>
          <label className="sales-report-checkbox">
            <input
              type="checkbox"
              checked={saveAsDefault}
              onChange={(event) => setSaveAsDefault(event.target.checked)}
            />
            <span>{t("sales_report_save_as_default")}</span>
          </label>
          {saveError ? (
            <p className="sales-report-filter-error" role="alert">
              {saveError}
            </p>
          ) : null}
        </div>
      </AdminModal>
    </div>
  );
}

export default function SalesReportPage() {
  return (
    <SalesReportFeatureGate>
      <SalesReportPageContent />
    </SalesReportFeatureGate>
  );
}

function sumQualityValues(group) {
  if (!group) return 0;
  return Object.values(group).reduce(
    (total, value) => total + (Number(value) || 0),
    0,
  );
}

function SalesReportSkeleton() {
  return (
    <div className="sales-report-skeleton" aria-busy="true">
      <div className="sales-report-kpi-grid">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={`kpi-skeleton-${index}`} className="admin-stat-card">
            <div className="admin-skeleton h-3 w-24" />
            <div className="admin-skeleton mt-3 h-7 w-20" />
            <div className="admin-skeleton mt-2 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="admin-card">
        <div className="admin-card-body">
          <div className="admin-skeleton h-[280px] w-full" />
        </div>
      </div>
    </div>
  );
}
