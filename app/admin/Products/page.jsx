"use client";
import { useState } from "react";

import { useLanguage } from "../../../context/LanguageContext.js";
import AdminPageHeader from "../components/ui/AdminPageHeader";
import FormProduct from "./components/ProductForm";
import ProductsTable from "./components/ProductsTable";

export default function Products() {
  const { t } = useLanguage();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

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
      <ProductsTable
        setIsFormOpen={setIsFormOpen}
        setIsEditMode={setIsEditMode}
      />
    </div>
  );
}
