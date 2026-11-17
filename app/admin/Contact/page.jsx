"use client";

import { useLanguage } from "../../../context/LanguageContext.js";
import AdminPageHeader from "../components/ui/AdminPageHeader";
import Form_contact from "./components/contactForm.jsx";

export default function ContactPage() {
  const { t } = useLanguage();

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow={t("nav_administration")}
        title={t("page_contact_title")}
        description={t("contact_description")}
      />
      <Form_contact />
    </div>
  );
}
