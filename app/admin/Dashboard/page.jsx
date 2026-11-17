"use client";

import { useEffect, useState } from "react";

import { useLanguage } from "../../../context/LanguageContext.js";
import AdminPageHeader from "../components/ui/AdminPageHeader";
import Dashboard_Details from "./components/Details";
import RecentOrders_Table from "./components/Table";
import QuicksAction from "./components/QuicksAction";

export default function Dashboard() {
  const { t, locale } = useLanguage();
  const [firstName, setFirstName] = useState("");
  const isArabic = locale === "ar";

  useEffect(() => {
    if (typeof window === "undefined") return;
    setFirstName(localStorage.getItem("firstName") || "");
  }, []);

  return (
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
      <QuicksAction />
      <RecentOrders_Table />
    </div>
  );
}
