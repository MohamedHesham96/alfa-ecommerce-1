"use client";

import { useEffect, useState } from "react";

import { useLanguage } from "../../../context/LanguageContext.js";
import AdminPageHeader from "../components/ui/AdminPageHeader";
import Dashboard_Details from "./components/Details";
import DashboardInsights from "./components/DashboardInsights";
import RecentOrders_Table from "./components/Table";
import { DashboardSummaryProvider } from "./context/DashboardSummaryContext";

export default function Dashboard() {
  const { t, locale } = useLanguage();
  const [firstName, setFirstName] = useState("");
  const isArabic = locale === "ar";

  useEffect(() => {
    if (typeof window === "undefined") return;
    setFirstName(localStorage.getItem("firstName") || "");
  }, []);

  return (
    <DashboardSummaryProvider>
      <div className="admin-page">
        <AdminPageHeader
          eyebrow={t("overview")}
          title={
            firstName
              ? isArabic
                ? `${firstName}، ${t("dashboard_welcome")}`
                : `${t("dashboard_welcome")}, ${firstName}`
              : t("dashboard_welcome")
          }
          description={t("dashboard_subtitle")}
        />
        <Dashboard_Details />
        <DashboardInsights />
        <RecentOrders_Table />
      </div>
    </DashboardSummaryProvider>
  );
}
