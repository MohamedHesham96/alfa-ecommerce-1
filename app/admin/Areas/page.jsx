"use client";

import Link from "next/link";
import { useState } from "react";
import { MdLocationCity } from "react-icons/md";

import { useAppConfig } from "../../../context/AppConfigContext";
import { useLanguage } from "../../../context/LanguageContext";
import { useSystemSettingsAccess } from "../context/SystemSettingsAccessContext";
import AdminPageHeader from "../components/ui/AdminPageHeader";
import AreaForm from "./components/AreaForm";
import AreaTable from "./components/AreaTable";

export default function AreasPage() {
  const { t } = useLanguage();
  const areasEnabled = useAppConfig("shipping.areas.enabled", false);
  const { canAccess: systemSettingsAccess } = useSystemSettingsAccess();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);

  const openCreate = () => {
    setSelectedArea(null);
    setFormOpen(true);
  };

  const openEdit = (area) => {
    setSelectedArea(area);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setSelectedArea(null);
  };

  if (!areasEnabled) {
    return (
      <div className="admin-page">
        <AdminPageHeader
          eyebrow={t("nav_sales")}
          title={t("areas_management")}
          description={t("areas_description")}
          icon={<MdLocationCity />}
        />
        <div className="admin-alert admin-alert-warning mx-auto mt-4 max-w-xl flex-col items-start gap-3 p-8 text-center">
          <h2 className="text-xl font-bold">
            {t("areas_disabled_title")}
          </h2>
          <p className="text-sm leading-6">{t("areas_disabled")}</p>
          {systemSettingsAccess ? (
            <Link
              href="/admin/SystemSettings"
              className="admin-btn admin-btn-primary mt-3"
            >
              {t("system_settings")}
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow={t("nav_sales")}
        title={t("areas_management")}
        description={t("areas_description")}
        icon={<MdLocationCity />}
      />
      <AreaTable onCreate={openCreate} onEdit={openEdit} />
      {formOpen ? (
        <AreaForm area={selectedArea} onClose={closeForm} />
      ) : null}
    </div>
  );
}
