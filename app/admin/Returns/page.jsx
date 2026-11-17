"use client";

import { useLanguage } from "../../../context/LanguageContext.js";
import AdminPageHeader from "../components/ui/AdminPageHeader";
import Table from "./components/Table";

export default function Returns() {
  const { t } = useLanguage();

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow={t("nav_sales")}
        title={t("page_returns_title")}
        description={t("returns_description")}
      />
      <Table />
    </div>
  );
}
