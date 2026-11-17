"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { useFeature } from "../../../context/AppConfigContext";
import { getCategories, getCategoryTree } from "../../../utils/functions";
import { categoryPath } from "../../../lib/seo";
import { useMenuOpen } from "../../../context/MenuOpenContext";
import { useAuthRole } from "../../../utils/authRole";
import {
  MdDashboard,
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

function MobileCategoryNode({ item, depth = 0, locale, closeMenu }) {
  const children = Array.isArray(item.children) ? item.children : [];
  const name =
    locale === "ar"
      ? item.nameAr || item.nameEn
      : item.nameEn || item.nameAr;

  return (
    <>
      <Link
        href={categoryPath(item)}
        onClick={closeMenu}
        className="flex items-center gap-3 border-b border-gray-200 hover:bg-gray-50"
        style={{
          paddingInlineStart: 16 + depth * 20,
          paddingInlineEnd: 16,
          minHeight: depth === 0 ? 56 : 46,
        }}
      >
        <span
          className={`shrink-0 text-gray-500 ${
            depth === 0 ? "text-2xl" : "text-base"
          }`}
        >
          {depth === 0 ? (
            getCategoryIcon(item.nameEn)
          ) : (
            <span className="block h-1.5 w-1.5 rounded-full bg-gray-400" />
          )}
        </span>
        <span
          className={`text-gray-800 ${
            depth === 0 ? "text-sm font-semibold" : "text-xs font-medium"
          }`}
        >
          {name}
        </span>
      </Link>
      {children.map((child) => (
        <MobileCategoryNode
          key={child.itemCategoryId || child.seoCode}
          item={child}
          depth={depth + 1}
          locale={locale}
          closeMenu={closeMenu}
        />
      ))}
    </>
  );
}

export default function Menu() {
  const { t, locale } = useLanguage();
  const { isMenuOpen, closeMenu } = useMenuOpen();
  const { canInstall, openInstallPrompt } = usePwa();
  const wishlistEnabled = useFeature("features.wishlist.enabled");
  const categoriesTreeEnabled = useFeature("ENABLE_CATEGORIES_TREE");
  const { isAdmin } = useAuthRole();
  const [activeTab, setActiveTab] = useState("categories");
  const [categoriesList, setCategoriesList] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const categoriesLoaded = useRef(false);
  const categoriesMode = useRef(categoriesTreeEnabled);

  useEffect(() => {
    if (categoriesMode.current === categoriesTreeEnabled) return;
    categoriesMode.current = categoriesTreeEnabled;
    categoriesLoaded.current = false;
    setCategoriesList([]);
  }, [categoriesTreeEnabled]);

  const getCategoriesList = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      if (categoriesTreeEnabled) {
        const tree = await getCategoryTree();
        setCategoriesList(Array.isArray(tree) ? tree : []);
      } else {
        const res = await getCategories();
        setCategoriesList(res.data.content || []);
      }
    } catch (err) {
      console.error("Failed to get categories", err);
    } finally {
      setCategoriesLoading(false);
    }
  }, [categoriesTreeEnabled]);

  useEffect(() => {
    if (!isMenuOpen) return;
    setActiveTab("categories");
    if (!categoriesLoaded.current) {
      categoriesLoaded.current = true;
      getCategoriesList();
    }
  }, [isMenuOpen, getCategoriesList]);

  const customerMenuLinks = [
    ...(wishlistEnabled
      ? [{ href: "/user/wishlist", label: t("wishlist"), icon: <FiHeart /> }]
      : []),
    { href: "/user/cart", label: t("cart"), icon: <MdOutlineShoppingCart /> },
    { href: "/user/profile", label: t("my_account"), icon: <PiUser /> },
    { href: "/user/ordershistory", label: t("orders"), icon: <RiShoppingBag4Fill /> },
    { href: "/user/returnorders", label: t("returns"), icon: <RiTruckLine /> },
  ];

  const menuLinks = [
    { href: "/", label: t("homepage"), icon: <PiHouse /> },
    ...(isAdmin
      ? [{ href: "/admin/Dashboard", label: t("dashboard"), icon: <MdDashboard /> }]
      : customerMenuLinks),
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
            ) : categoriesTreeEnabled ? (
              categoriesList.map((item) => (
                <MobileCategoryNode
                  key={item.itemCategoryId || item.seoCode}
                  item={item}
                  locale={locale}
                  closeMenu={closeMenu}
                />
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