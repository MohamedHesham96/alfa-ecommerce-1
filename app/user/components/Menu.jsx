"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { getCategories } from "../../../utils/functions";
import { categoryPath } from "../../../lib/seo";
import { useMenuOpen } from "../../../context/MenuOpenContext";
import {
  MdDevices,
  MdInstallMobile,
  MdOutlineKitchen,
  MdYard,
  MdChildCare,
  MdOutlineSpa,
  MdOutlineShoppingCart,
} from "react-icons/md";
import { FiHeart } from "react-icons/fi";
import { PiUser, PiHouse, PiSquaresFour } from "react-icons/pi";
import { RiShoppingBag4Fill, RiTruckLine } from "react-icons/ri";
import { usePwa } from "../../components/pwa/PwaProvider";

const getCategoryIcon = (name) => {
  const n = (name || "").toLowerCase();
  if (n.includes("electron")) return <MdDevices />;
  if (n.includes("appliance")) return <MdOutlineKitchen />;
  if (n.includes("home") || n.includes("garden") || n.includes("furniture"))
    return <MdYard />;
  if (n.includes("baby") || n.includes("kid") || n.includes("toy") || n.includes("children"))
    return <MdChildCare />;
  if (n.includes("beauty") || n.includes("care") || n.includes("cosme") || n.includes("spa"))
    return <MdOutlineSpa />;
  return <PiSquaresFour />;
};

export default function Menu() {
  const { t, locale } = useLanguage();
  const { isMenuOpen, closeMenu } = useMenuOpen();
  const { canInstall, openInstallPrompt } = usePwa();
  const [activeTab, setActiveTab] = useState("categories");
  const [categoriesList, setCategoriesList] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const categoriesLoaded = useRef(false);

  const getCategoriesList = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const res = await getCategories();
      setCategoriesList(res.data.content || []);
    } catch (err) {
      console.error("Failed to get categories", err);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    setActiveTab("categories");
    if (!categoriesLoaded.current) {
      categoriesLoaded.current = true;
      getCategoriesList();
    }
  }, [isMenuOpen, getCategoriesList]);

  const menuLinks = [
    { href: "/", label: t("homepage"), icon: <PiHouse /> },
    { href: "/user/wishlist", label: t("wishlist"), icon: <FiHeart /> },
    { href: "/user/cart", label: t("cart"), icon: <MdOutlineShoppingCart /> },
    { href: "/user/profile", label: t("my_account"), icon: <PiUser /> },
    { href: "/user/ordershistory", label: t("orders"), icon: <RiShoppingBag4Fill /> },
    { href: "/user/returnorders", label: t("returns"), icon: <RiTruckLine /> },
    { href: "/user/about", label: t("about_us") },
    { href: "/#footer", label: t("contact_us") },
  ];

  if (!isMenuOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={closeMenu}
      ></div>
      <div
        className={`absolute top-0 bottom-0 ${
          locale === "ar" ? "right-0" : "left-0"
        } w-[85%] max-w-[360px] pt-5 bg-white flex flex-col`}
      >
        <div className="flex w-full border-b border-gray-300 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`flex-1 h-12 flex items-center justify-center text-sm font-semibold uppercase tracking-wide transition-colors ${
              activeTab === "categories"
                ? "bg-gray-200 text-gray-900 border-b-2 border-red-600"
                : "bg-gray-100 text-gray-500 border-b-2 border-transparent"
            }`}
          >
            {t("categories")}
          </button>
          <button
            type="button"
            data-testid="menu-tab-menu"
            onClick={() => setActiveTab("menu")}
            className={`flex-1 h-12 flex items-center justify-center text-sm font-semibold uppercase tracking-wide transition-colors ${
              activeTab === "menu"
                ? "bg-gray-200 text-gray-900 border-b-2 border-red-600"
                : "bg-gray-100 text-gray-500 border-b-2 border-transparent"
            }`}
          >
            {t("menu")}
          </button>
        </div>

        {activeTab === "categories" ? (
          <div className="flex-1 overflow-y-auto bg-white">
            <Link
              href="/products"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 h-14 border-b border-gray-200"
            >
              <span className="text-2xl text-gray-500 shrink-0">
                <PiSquaresFour />
              </span>
              <span className="text-sm font-semibold text-gray-800">
                {t("all")}
              </span>
            </Link>
            {categoriesLoading ? (
              [...Array(4)].map((_, i) => (
                <div
                  key={`cat-skeleton-${i}`}
                  className="h-14 border-b border-gray-200 bg-gray-100 animate-pulse"
                ></div>
              ))
            ) : (
              categoriesList.map((item) => (
                <Link
                  key={item.itemCategoryId}
                  href={categoryPath(item)}
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 h-14 border-b border-gray-200 hover:bg-gray-50"
                >
                  <span className="text-2xl text-gray-500 shrink-0">
                    {getCategoryIcon(item.nameEn)}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {locale === "ar" ? item.nameAr : item.nameEn}
                  </span>
                </Link>
              ))
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-white py-2">
            {canInstall ? (
              <button
                type="button"
                data-testid="install-menu-entry"
                onClick={() => {
                  closeMenu();
                  openInstallPrompt();
                }}
                className="flex w-full items-center gap-3 border-b border-gray-200 px-4 py-3.5 text-start hover:bg-gray-50"
              >
                <span className="shrink-0 text-xl text-[#CD4354]">
                  <MdInstallMobile />
                </span>
                <span className="text-sm font-semibold text-[#CD4354]">
                  {t("install_app")}
                </span>
              </button>
            ) : null}
            {menuLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-200 hover:bg-gray-50"
              >
                {link.icon && (
                  <span className="text-xl text-gray-600 shrink-0">
                    {link.icon}
                  </span>
                )}
                <span className="text-sm font-semibold text-gray-800">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}