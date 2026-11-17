"use client";

import { useEffect, useState } from "react";
import { MdLanguage, MdMenu } from "react-icons/md";

import { useLanguage } from "../../../context/LanguageContext.js";
import { postRequest } from "../../../utils/requestsUtils.js";
import { useNamePageInAdminContext } from "../../../context/namePageInAdmin.jsx";
import ThemeSwitcher from "./ThemeSwitcher";

const PAGE_STATE_MAP = {
  "Categories Management": "categories_management",
  "Products Management": "products_management",
  "Orders Management": "orders_management",
  "Dashboard Overview": "dashboard_overview",
  "Homepage Management": "homepage_management",
  "Users Management": "users_management",
  "Admins Management": "admins_management",
  "Contact Management": "contact_management",
  "Returns Management": "returns_management",
  "ShippingCost Management": "ShippingCost_management",
  "System Settings": "system_settings",
  "Pickup Places Management": "pickup_places_management",
};

const SECTION_MAP = {
  dashboard_overview: "nav_overview",
  homepage_management: "nav_overview",
  categories_management: "nav_catalog",
  products_management: "nav_catalog",
  orders_management: "nav_sales",
  returns_management: "nav_sales",
  ShippingCost_management: "nav_sales",
  users_management: "nav_customers",
  admins_management: "nav_administration",
  contact_management: "nav_administration",
  system_settings: "nav_administration",
  pickup_places_management: "nav_administration",
};

function initialsOf(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "A";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function Header({ page_title, onMenuClick }) {
  const { locale, setLocale } = useLanguage();
  const { selectedNamePage, setSelectedNamePage } = useNamePageInAdminContext();
  const { t } = useLanguage();
  const [user, setUser] = useState({ name: "", role: "" });

  useEffect(() => {
    const mapped = PAGE_STATE_MAP[selectedNamePage];
    if (mapped && mapped !== selectedNamePage) {
      setSelectedNamePage(mapped);
    }
  }, [selectedNamePage, setSelectedNamePage]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const first = localStorage.getItem("firstName") || "";
    const last = localStorage.getItem("lastName") || "";
    setUser({
      name:
        `${first} ${last}`.trim() ||
        localStorage.getItem("username") ||
        localStorage.getItem("email") ||
        "",
      role: localStorage.getItem("role") || "",
    });
  }, []);

  const changeLanguage = async (newLang) => {
    const validLangs = ["ar", "en"];

    if (!validLangs.includes(newLang)) return;
    setLocale(newLang);
    try {
      await postRequest(`/api/users/language/${newLang}`, "", "");
      setLocale(newLang);

      localStorage.setItem("lang", newLang);
    } catch (err) {
      console.error("Failed to update language", err);
    }
  };

  const pageKey = PAGE_STATE_MAP[selectedNamePage] ?? selectedNamePage;
  const sectionKey = SECTION_MAP[pageKey];
  const title = sectionKey ? t(sectionKey) : t("platform_mang");
  const roleLabel = user.role
    ? t(user.role === "ADMIN" ? "super_admin" : "user_label")
    : t("admin");

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-heading">
        <button
          type="button"
          className="admin-icon-btn admin-mobile-only"
          onClick={onMenuClick}
          aria-label={t("open_menu")}
        >
          <MdMenu className="text-xl" />
        </button>
        <div className="min-w-0">
          <p className="admin-topbar-eyebrow">{t("platform_mang")}</p>
          <h1 id="page-title" className="admin-topbar-title">
            {title}
          </h1>
        </div>
      </div>

      <div className="admin-topbar-actions">
        <ThemeSwitcher />

        <button
          type="button"
          className="admin-language-switch"
          onClick={() => {
            const newLocale = locale === "ar" ? "en" : "ar";
            setLocale(newLocale);
            changeLanguage(newLocale);
          }}
          aria-label={t("change_language")}
          title={t("change_language")}
        >
          <MdLanguage className="text-base" />
          <span>{locale === "ar" ? "EN" : "AR"}</span>
        </button>

        <div className="admin-topbar-user">
          <span className="admin-topbar-avatar" aria-hidden="true">
            {initialsOf(user.name)}
          </span>
          <div className="min-w-0">
            <p className="admin-topbar-user-name">
              {user.name || t("admin")}
            </p>
            <p className="admin-topbar-user-role">{roleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
