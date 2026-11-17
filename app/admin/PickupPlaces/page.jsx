"use client";

import Link from "next/link";
import { useState } from "react";

import { useAppConfig } from "../../../context/AppConfigContext";
import { useLanguage } from "../../../context/LanguageContext";
import { useSystemSettingsAccess } from "../context/SystemSettingsAccessContext";
import PickupPlaceForm from "./components/PickupPlaceForm";
import PickupPlaceTable from "./components/PickupPlaceTable";
import AdminPageHeader from "../components/ui/AdminPageHeader";

export default function PickupPlacesPage() {
  const { t } = useLanguage();
  const pickupEnabled = useAppConfig("pickup.enabled", false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const { canAccess: systemSettingsAccess } = useSystemSettingsAccess();

  const openCreate = () => {
    setSelectedPlace(null);
    setFormOpen(true);
  };

  const openEdit = (place) => {
    setSelectedPlace(place);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setSelectedPlace(null);
  };

  if (!pickupEnabled) {
    return (
      <div className="admin-page">
        <AdminPageHeader
          eyebrow={t("nav_administration")}
          title={t("pickup_places")}
          description={t("pickup_places_description")}
        />
        <div className="admin-alert admin-alert-warning mx-auto mt-4 max-w-xl flex-col items-start gap-3 p-8 text-center">
          <h2 className="text-xl font-bold">
            {t("pickup_places_disabled_title")}
          </h2>
          <p className="text-sm leading-6">{t("pickup_places_disabled")}</p>
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
        eyebrow={t("nav_administration")}
        title={t("pickup_places")}
        description={t("pickup_places_description")}
      />

      <PickupPlaceTable onCreate={openCreate} onEdit={openEdit} />

      {formOpen ? (
        <PickupPlaceForm place={selectedPlace} onClose={closeForm} />
      ) : null}
    </div>
  );
}
