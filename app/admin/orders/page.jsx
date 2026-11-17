"use client";

import { useLanguage } from "../../../context/LanguageContext.js";
import AdminPageHeader from "../components/ui/AdminPageHeader";
import Orders_Details from "./components/Orders_Details";
import Orders_Table from "./components/Orders_Table";

export default function Orders() {
  const { t } = useLanguage();

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow={t("nav_sales")}
        title={t("page_orders_title")}
        description={t("orders_description")}
      />
      <Orders_Details />
      <Orders_Table />
    </div>
  );
}
