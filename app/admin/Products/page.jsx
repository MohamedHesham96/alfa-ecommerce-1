"use client";
import { useCallback, useState } from "react";

import { useLanguage } from "../../../context/LanguageContext.js";
import { useRefresh } from "../../../context/refreshContext.jsx";
import AdminPageHeader from "../components/ui/AdminPageHeader";
import FormProduct from "./components/ProductForm";
import ProductsTable from "./components/ProductsTable";
import ProductsStats from "./components/ProductsStats";

export default function Products() {
  const { t } = useLanguage();
  const { refreshKey } = useRefresh();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  const refreshStats = useCallback(() => {
    setStatsRefreshKey((key) => key + 1);
  }, []);

  return (
    <div className="admin-page">
      <FormProduct
        isFormOpen={isFormOpen}
        setIsFormOpen={setIsFormOpen}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
      />
      <AdminPageHeader
        eyebrow={t("nav_catalog")}
        title={t("page_products_title")}
        description={t("products_description")}
      />
      <ProductsStats refreshKey={`${refreshKey}:${statsRefreshKey}`} />
      <ProductsTable
        setIsFormOpen={setIsFormOpen}
        setIsEditMode={setIsEditMode}
        onStatsChange={refreshStats}
      />
    </div>
  );
}
