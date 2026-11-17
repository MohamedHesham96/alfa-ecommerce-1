"use client";

import { useLanguage } from "../../../../context/LanguageContext.js";
import AdminPageHeader from "../../components/ui/AdminPageHeader";
import Users_Table from "../components/Users_Table";

export default function UsersPage() {
  const { t } = useLanguage();

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow={t("nav_customers")}
        title={t("page_users_title")}
        description={t("users_description")}
      />
      <Users_Table />
    </div>
  );
}
