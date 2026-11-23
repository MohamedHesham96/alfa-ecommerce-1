"use client";

import ForbiddenScreen from "../../../components/forbidden/ForbiddenScreen";
import { useAppConfig } from "../../../../context/AppConfigContext";
import { useLanguage } from "../../../../context/LanguageContext";

/**
 * Client-side capability gate for the Sales Report. The backend also enforces
 * the same feature flag, so hiding the menu is not the only control.
 */
export default function SalesReportFeatureGate({ children }) {
  const enabled = useAppConfig("features.salesReport.enabled", false);
  const { t } = useLanguage();

  if (!enabled) {
    return (
      <ForbiddenScreen
        title={t("sales_report_disabled_title")}
        description={t("sales_report_disabled_description")}
        actionLabel={t("sales_report_disabled_action")}
        countdownLabel={t("sales_report_disabled_countdown")}
        redirectTo="/admin/Dashboard"
        durationMs={4000}
        testId="sales-report-disabled"
      />
    );
  }

  return children;
}
