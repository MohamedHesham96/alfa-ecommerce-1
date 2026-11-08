"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAppConfig } from "../../../context/AppConfigContext";
import { useLanguage } from "../../../context/LanguageContext";
import PickupPlaceForm from "./components/PickupPlaceForm";
import PickupPlaceTable from "./components/PickupPlaceTable";

export default function PickupPlacesPage() {
  const { t } = useLanguage();
  const pickupEnabled = useAppConfig("pickup.enabled", false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [systemSettingsAccess, setSystemSettingsAccess] = useState(false);

  useEffect(() => {
    setSystemSettingsAccess(
      typeof window !== "undefined" &&
        localStorage.getItem("systemSettingsAccess") === "true",
    );
  }, []);

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
      <div className="p-4 sm:p-6">
        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <h1 className="text-xl font-bold text-amber-900">
            {t("pickup_places_disabled_title")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-amber-800">
            {t("pickup_places_disabled")}
          </p>
          {systemSettingsAccess ? (
            <Link
              href="/admin/SystemSettings"
              className="mt-6 inline-flex rounded-lg bg-[#204272] px-4 py-2 text-sm font-semibold text-white hover:bg-[#19345a]"
            >
              {t("system_settings")}
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">
            {t("pickup_places")}
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">
            {t("pickup_places_description")}
          </p>
        </div>
      </header>

      <PickupPlaceTable onCreate={openCreate} onEdit={openEdit} />

      {formOpen ? (
        <PickupPlaceForm place={selectedPlace} onClose={closeForm} />
      ) : null}
    </div>
  );
}
