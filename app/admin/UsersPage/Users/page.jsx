"use client";

import { useCallback, useState } from "react";

import { useLanguage } from "../../../../context/LanguageContext.js";
import AdminPageHeader from "../../components/ui/AdminPageHeader";
import Users_Table from "../components/Users_Table";
import UsersStats from "../components/UsersStats";

export default function UsersPage() {
  const { t } = useLanguage();
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  const refreshStats = useCallback(() => {
    setStatsRefreshKey((key) => key + 1);
  }, []);

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow={t("nav_customers")}
        title={t("page_users_title")}
        description={t("users_description")}
      />
      <UsersStats refreshKey={statsRefreshKey} />
      <Users_Table onStatsChange={refreshStats} />
    </div>
  );
}
