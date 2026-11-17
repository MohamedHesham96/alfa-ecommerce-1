"use client";
import { useState } from "react";

import { useLanguage } from "../../../context/LanguageContext.js";
import AdminPageHeader from "../components/ui/AdminPageHeader";
import Admins_Table from "./components/AdminsTable";
import AdminForm from "./components/AdminForm";

export default function AdminsPage() {
  const { t } = useLanguage();
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="admin-page">
      <AdminForm isFormOpen={isFormOpen} setIsFormOpen={setIsFormOpen} />
      <AdminPageHeader
        eyebrow={t("nav_administration")}
        title={t("page_admins_title")}
        description={t("admins_description")}
      />
      <Admins_Table setIsFormOpen={setIsFormOpen} />
    </div>
  );
}
