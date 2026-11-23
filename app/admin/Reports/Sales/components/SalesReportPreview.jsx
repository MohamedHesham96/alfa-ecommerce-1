"use client";

import { MdOpenInNew, MdPrint } from "react-icons/md";

import { useLanguage } from "../../../../../context/LanguageContext.js";
import AdminModal from "../../../components/ui/AdminModal";
import SalesReportKpis from "./SalesReportKpis";
import {
  DayHourHeatmap,
  SalesCategoryChart,
  SalesCompositionChart,
  SalesOverTimeChart,
  TopProductsCard,
} from "./SalesReportCharts";
import { formatInstantInZone, formatRange } from "../salesReportUtils";

export default function SalesReportPreview({
  open,
  summary,
  onClose,
  onOpenTab,
  onPrint,
}) {
  const { t, locale } = useLanguage();
  if (!open || !summary) return null;

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={t("sales_report_preview_title")}
      description={t("sales_report_preview_description")}
      size="full"
      bodyClassName="max-h-[72vh] overflow-y-auto"
      footer={
        <div className="sales-report-preview-footer">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={onOpenTab}
          >
            <MdOpenInNew aria-hidden="true" />
            {t("sales_report_open_tab")}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={onPrint}
          >
            <MdPrint aria-hidden="true" />
            {t("sales_report_print")}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={onClose}
          >
            {t("close")}
          </button>
        </div>
      }
    >
      <div className="sales-report-preview">
        <div className="sales-report-preview-meta">
          <div>
            <span>{t("sales_report_applied_range")}</span>
            <strong>{formatRange(summary.range)}</strong>
          </div>
          <div>
            <span>{t("sales_report_timezone")}</span>
            <strong>{summary.timezone}</strong>
          </div>
          <div>
            <span>{t("sales_report_last_updated")}</span>
            <strong>
              {formatInstantInZone(
                summary.generatedAt,
                locale,
                summary.timezone,
              )}
            </strong>
          </div>
        </div>

        <SalesReportKpis summary={summary} />
        <div className="sales-report-charts-grid">
          <SalesOverTimeChart summary={summary} />
          <SalesCompositionChart summary={summary} />
          <SalesCategoryChart summary={summary} />
          <TopProductsCard summary={summary} />
          <DayHourHeatmap summary={summary} />
        </div>

        <p className="sales-report-limitation">
          {t("sales_report_unsupported_note")}
        </p>
      </div>
    </AdminModal>
  );
}
