"use client";

import Link from "next/link";

import { useLanguage } from "../../../context/LanguageContext";
import { categoryPath } from "../../../lib/seo";

function CategoryBranch({ category, depth, activeSlug, locale }) {
  const isActive = Boolean(activeSlug && category.seoCode === activeSlug);
  const name =
    locale === "ar"
      ? category.nameAr || category.nameEn
      : category.nameEn || category.nameAr;
  const children = Array.isArray(category.children) ? category.children : [];

  return (
    <li>
      <Link
        href={categoryPath(category)}
        className={`block rounded-md px-2 py-1.5 text-sm transition-colors ${
          isActive
            ? "bg-red-50 font-semibold text-red-600"
            : "text-gray-700 hover:bg-gray-50 hover:text-red-600"
        }`}
      >
        {name}
      </Link>
      {children.length > 0 ? (
        <ul className="ms-3 mt-1 space-y-0.5 border-s border-gray-200 ps-2">
          {children.map((child) => (
            <CategoryBranch
              key={child.itemCategoryId || child.seoCode}
              category={child}
              depth={depth + 1}
              activeSlug={activeSlug}
              locale={locale}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * Hierarchical navigation rendered only when the API returned nested
 * categories. The flat behavior is untouched because this component returns
 * null for a list without children.
 */
export default function CategoryTreeNav({ categories = [], activeSlug }) {
  const { t, locale } = useLanguage();
  const list = Array.isArray(categories) ? categories : [];
  const hasNested = list.some(
    (category) =>
      Array.isArray(category?.children) && category.children.length > 0,
  );

  if (!hasNested) return null;

  return (
    <nav
      aria-label={t("categories")}
      className="mt-4 w-full rounded-xl border border-gray-200 bg-white p-3"
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((category) => (
          <CategoryBranch
            key={category.itemCategoryId || category.seoCode}
            category={category}
            depth={0}
            activeSlug={activeSlug}
            locale={locale}
          />
        ))}
      </ul>
    </nav>
  );
}
