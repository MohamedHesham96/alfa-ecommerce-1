"use client";
import { useState } from "react";

import { useLanguage } from "../../../context/LanguageContext.js";
import AdminPageHeader from "../components/ui/AdminPageHeader";
import Table from "./components/Table";
import ShippingCostForm from "./components/ShippingCost_Form";

export default function ShippingCost() {
  const { t } = useLanguage();
  const [governorate, setGovernorate] = useState();
  const [governorateId, setGovernorateId] = useState();
  const [governoratePrice, setGovernoratePrice] = useState();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="admin-page">
      {showForm && (
        <ShippingCostForm
          govName={governorate}
          govId={governorateId}
          govPrice={governoratePrice}
          setShowForm={setShowForm}
        />
      )}
      <AdminPageHeader
        eyebrow={t("nav_sales")}
        title={t("page_shipping_title")}
        description={t("shipping_description")}
      />
      <Table
        setGovernorate={setGovernorate}
        setGovernorateId={setGovernorateId}
        setGovernoratePrice={setGovernoratePrice}
        setShowForm={setShowForm}
      />
    </div>
  );
}
