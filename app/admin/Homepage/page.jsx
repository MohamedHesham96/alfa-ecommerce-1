"use client";
import { useState } from "react";

import { useLanguage } from "../../../context/LanguageContext.js";
import AdminPageHeader from "../components/ui/AdminPageHeader";
import Sliders from "./components/Sliders";
import SliderForm from "./components/SliderForm";
import Ads from "./components/Ads";
import ProductAds from "./components/ProductAds";

export default function Homepage() {
  const { t } = useLanguage();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState(null);

  return (
    <div className="admin-page">
      <SliderForm
        setIsFormOpen={setIsFormOpen}
        isFormOpen={isFormOpen}
        sliderData={editingSlider}
      />
      <AdminPageHeader
        eyebrow={t("nav_overview")}
        title={t("page_homepage_title")}
        description={t("homepage_description")}
      />
      <Sliders
        setIsFormOpen={setIsFormOpen}
        setEditingSlider={setEditingSlider}
      />
      <div className="admin-divider" />
      <Ads />
      <div className="admin-divider" />
      <ProductAds />
    </div>
  );
}
