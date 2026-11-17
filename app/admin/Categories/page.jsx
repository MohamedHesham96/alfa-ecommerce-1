"use client";
import { useState } from "react";

import { useLanguage } from "../../../context/LanguageContext.js";
import AdminPageHeader from "../components/ui/AdminPageHeader";
import Table_Category from "./components/CategoryTable";
import FormCategory from "./components/CategoryForm";

export default function Categorys() {
  const { t } = useLanguage();
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="admin-page">
      <FormCategory isFormOpen={isFormOpen} setIsFormOpen={setIsFormOpen} />
      <AdminPageHeader
        eyebrow={t("nav_catalog")}
        title={t("page_categories_title")}
        description={t("categories_description")}
      />
      <Table_Category setIsFormOpen={setIsFormOpen} />
    </div>
  );
}
