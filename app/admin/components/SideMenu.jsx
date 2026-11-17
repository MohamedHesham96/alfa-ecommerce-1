"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation.js";
import {
  MdAdminPanelSettings,
  MdCategory,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdContactSupport,
  MdDashboard,
  MdOutlineShoppingCart,
  MdSettings,
  MdStorefront,
} from "react-icons/md";
import { IoFileTray } from "react-icons/io5";
import { ImUsers } from "react-icons/im";
import { RiMoneyDollarCircleLine, RiPagesFill } from "react-icons/ri";
import { PiSignOutBold } from "react-icons/pi";
import { TbTruckReturn } from "react-icons/tb";

import { useLanguage } from "../../../context/LanguageContext.js";
import { useNamePageInAdminContext } from "../../../context/namePageInAdmin.jsx";
import { useAppConfig } from "../../../context/AppConfigContext.jsx";
import { useSystemSettingsAccess } from "../context/SystemSettingsAccessContext.jsx";
import { logoutRequest } from "../../../utils/requestsUtils";

const SECTIONS = [
  {
    id: "overview",
    labelKey: "nav_overview",
    items: [
      {
        href: "/admin/Dashboard",
        labelKey: "dashboard",
        icon: <MdDashboard />,
        activeKey: "dashboard_overview",
        displayName: "Dashboard Overview",
        id: "dashboardTab",
      },
      {
        href: "/admin/Homepage",
        labelKey: "homepage",
        icon: <RiPagesFill />,
        activeKey: "homepage_management",
        displayName: "Homepage Management",
      },
    ],
  },
  {
    id: "catalog",
    labelKey: "nav_catalog",
    items: [
      {
        href: "/admin/Categories",
        labelKey: "categories",
        icon: <MdCategory />,
        activeKey: "categories_management",
        displayName: "Categories Management",
      },
      {
        href: "/admin/Products",
        labelKey: "products",
        icon: <IoFileTray />,
        activeKey: "products_management",
        displayName: "Products Management",
      },
    ],
  },
  {
    id: "sales",
    labelKey: "nav_sales",
    items: [
      {
        href: "/admin/orders",
        labelKey: "orders",
        icon: <MdOutlineShoppingCart />,
        activeKey: "orders_management",
        displayName: "Orders Management",
      },
      {
        href: "/admin/Returns",
        labelKey: "returns",
        icon: <TbTruckReturn />,
        activeKey: "returns_management",
        displayName: "Returns Management",
      },
      {
        href: "/admin/ShippingCost",
        labelKey: "shippingcost",
        icon: <RiMoneyDollarCircleLine />,
        activeKey: "ShippingCost_management",
        displayName: "ShippingCost Management",
      },
    ],
  },
  {
    id: "customers",
    labelKey: "nav_customers",
    items: [
      {
        href: "/admin/UsersPage/Users",
        labelKey: "users",
        icon: <ImUsers />,
        activeKey: "users_management",
        displayName: "Users Management",
      },
    ],
  },
  {
    id: "administration",
    labelKey: "nav_administration",
    items: [
      {
        href: "/admin/Admins",
        labelKey: "admins",
        icon: <MdAdminPanelSettings />,
        activeKey: "admins_management",
        displayName: "Admins Management",
        id: "adminsTab",
      },
      {
        href: "/admin/Contact",
        labelKey: "contact",
        icon: <MdContactSupport />,
        activeKey: "contact_management",
        displayName: "Contact Management",
      },
    ],
  },
];

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

export default function SideMenu({
  mobileOpen = false,
  onMobileClose,
  collapsed = false,
  onToggleCollapse,
}) {
  const navigate = useRouter();
  const { t } = useLanguage();
  const { canAccess: systemSettingsAccess } = useSystemSettingsAccess();
  const { selectedNamePage, setSelectedNamePage } = useNamePageInAdminContext();
  const pickupEnabled = useAppConfig("pickup.enabled", false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const first = localStorage.getItem("firstName") || "";
    const last = localStorage.getItem("lastName") || "";
    const displayName =
      `${first} ${last}`.trim() ||
      localStorage.getItem("username") ||
      localStorage.getItem("email") ||
      "";
    setUsername(displayName);
    setRole(localStorage.getItem("role") || "");

    const lastPort = window.location.pathname.split("/").filter(Boolean).pop();
    setSelectedNamePage(
      lastPort === "Dashboard"
        ? `${lastPort} Overview`
        : window.location.pathname.includes("User")
          ? "Users Management"
          : window.location.pathname.includes("orders")
            ? "Orders Management"
            : window.location.pathname.includes("returnorderdetails")
              ? "Returns Management"
              : window.location.pathname.includes("SystemSettings")
                ? "System Settings"
                : window.location.pathname.includes("PickupPlaces")
                  ? "Pickup Places Management"
                  : `${lastPort} Management`,
    );
  }, [setSelectedNamePage]);

  const sections = SECTIONS.map((section) => ({
    ...section,
    items: [...section.items],
  }));

  const administration = sections.find(
    (section) => section.id === "administration",
  );
  if (systemSettingsAccess) {
    administration.items.push({
      href: "/admin/SystemSettings",
      labelKey: "system_settings",
      icon: <MdSettings />,
      activeKey: "system_settings",
      displayName: "System Settings",
    });
  }
  if (pickupEnabled) {
    administration.items.push({
      href: "/admin/PickupPlaces",
      labelKey: "pickup_places",
      icon: <MdStorefront />,
      activeKey: "pickup_places_management",
      displayName: "Pickup Places Management",
    });
  }

  const handleNavigate = (displayName) => {
    setSelectedNamePage(displayName);
    onMobileClose?.();
  };

  const handleLogout = async () => {
    await logoutRequest();
    localStorage.setItem("id", "");
    localStorage.setItem("accessToken", "");
    localStorage.setItem("refreshToken", "");
    localStorage.setItem("address", "");
    localStorage.setItem("email", "");
    localStorage.setItem("firstName", "");
    localStorage.setItem("lastName", "");
    localStorage.setItem("phone", "");
    localStorage.setItem("role", "");
    localStorage.setItem("systemSettingsAccess", "false");
    localStorage.setItem("username", "");
    navigate.push("/");
  };

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="admin-sidebar-overlay"
          aria-label={t("close")}
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        className={`admin-sidebar ${mobileOpen ? "admin-sidebar--mobile-open" : ""} ${
          collapsed ? "admin-sidebar--collapsed" : ""
        }`}
        aria-label={t("platform_mang")}
      >
        <div className="admin-sidebar-brand">
          <span className="admin-sidebar-logo">
            <Image
              src="/Images/logo.png"
              alt="Alfa"
              width={34}
              height={34}
              priority
              className="h-[30px] w-[30px] object-contain"
            />
          </span>
          <div className="admin-sidebar-brand-text">
            <p className="admin-sidebar-brand-title">Alfa Admin</p>
            <p className="admin-sidebar-brand-subtitle">
              {t("platform_mang")}
            </p>
          </div>
          <button
            type="button"
            className="admin-sidebar-collapse"
            onClick={onToggleCollapse}
            aria-label={collapsed ? t("expand_sidebar") : t("collapse_sidebar")}
            title={collapsed ? t("expand_sidebar") : t("collapse_sidebar")}
          >
            {collapsed ? <MdChevronRight /> : <MdChevronLeft />}
          </button>
          <button
            type="button"
            className="admin-sidebar-mobile-close ml-1"
            onClick={onMobileClose}
            aria-label={t("close")}
          >
            <MdClose />
          </button>
        </div>

        <nav className="admin-nav" aria-label={t("platform_mang")}>
          {sections.map((section) => (
            <React.Fragment key={section.id}>
              <p className="admin-nav-section">{t(section.labelKey)}</p>
              {section.items.map((item) => {
                const active = selectedNamePage === item.activeKey;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => handleNavigate(item.displayName)}
                    title={t(item.labelKey)}
                    aria-current={active ? "page" : undefined}
                  >
                    <div
                      id={item.id}
                      className={`admin-nav-link ${active ? "admin-nav-link--active" : ""}`}
                    >
                      <span className="admin-nav-icon" aria-hidden="true">
                        {item.icon}
                      </span>
                      <span className="admin-nav-label">{t(item.labelKey)}</span>
                    </div>
                  </Link>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <span className="admin-sidebar-user-avatar" aria-hidden="true">
              {initialsOf(username)}
            </span>
            <div className="min-w-0">
              <p className="admin-sidebar-user-name">
                {username || t("admin")}
              </p>
              <p className="admin-sidebar-user-role">
                {role ? t(role === "ADMIN" ? "super_admin" : role) : t("admin")}
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="admin-sidebar-footer-link"
            title={t("view_storefront")}
          >
            <span className="text-lg" aria-hidden="true">
              <MdStorefront />
            </span>
            <span className="admin-sidebar-footer-label">{t("view_storefront")}</span>
          </Link>

          <button
            type="button"
            className="admin-sidebar-footer-link admin-sidebar-footer-link--danger w-full"
            onClick={handleLogout}
            title={t("logout")}
          >
            <span className="text-lg" aria-hidden="true">
              <PiSignOutBold />
            </span>
            <span className="admin-sidebar-footer-label">{t("logout")}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
