"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import Select from "react-select";
import ProductCard from "../user/components/ProductCard";
import CategoriesSideMenu from "../user/components/CategoriseSideMenu";
import Pagination from "../user/search/[searchInput]/components/Pagination";
import { postRequest } from "../../utils/requestsUtils";
import { useLanguage } from "../../context/LanguageContext";
import { categoryPath } from "../../lib/seo";

const PAGE_SIZE = 40;

function normalizePage(payload, fallbackSize) {
  const data = payload?.data ?? payload ?? {};
  const page = data?.page ?? data ?? {};
  const content = Array.isArray(data)
    ? data
    : Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data?.items)
        ? data.items
        : [];
  const size = Number(page?.size ?? data?.size ?? fallbackSize) || fallbackSize;
  const totalElements =
    Number(
      page?.totalElements ??
        page?.totalItems ??
        page?.totalCount ??
        page?.total ??
        data?.totalElements ??
        data?.totalItems ??
        data?.totalCount ??
        data?.total ??
        0,
    ) || 0;
  const totalPages =
    Number(
      page?.totalPages ??
        page?.totalPage ??
        data?.totalPages ??
        data?.totalPage ??
        0,
    ) || (content.length > 0 ? Math.max(1, Math.ceil(totalElements / size)) : 0);
  const number =
    Number(
      page?.number ??
        page?.pageNumber ??
        page?.currentPage ??
        data?.number ??
        data?.pageNumber ??
        data?.currentPage ??
        0,
    ) || 0;
  return { content, number, size, totalElements, totalPages };
}

export default function CategoryProductsClient({
  category = null,
  categories = [],
  initialProducts = [],
  initialPage = 0,
  initialTotalPages = 0,
  initialTotalElements = 0,
  basePath,
  description,
}) {
  const { t, locale } = useLanguage();
  const [products, setProducts] = useState(initialProducts);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [totalElements, setTotalElements] = useState(initialTotalElements);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState();
  const [ascending, setAscending] = useState();

  const categoryName =
    locale === "ar"
      ? category?.nameAr || category?.nameEn
      : category?.nameEn || category?.nameAr;
  const heading = categoryName || t("all_products") || "كل المنتجات";

  const sortOptions = [
    { value: "true,price", label: t("priceLowToHigh") },
    { value: "false,price", label: t("priceHighToLow") },
  ];
  const currentValue = sortBy
    ? sortOptions.find((option) => option.value === `${ascending},${sortBy}`)
    : null;

  const fetchPage = useCallback(
    async (page, nextSortBy, nextAscending) => {
      try {
        setLoading(true);
        const response = await postRequest(
          "/api/public/items/search",
          {
            page,
            size: PAGE_SIZE,
            categoryId: category?.itemCategoryId ?? null,
            sortBy: nextSortBy || null,
            ascending: nextAscending ?? true,
          },
          "",
        );
        const normalized = normalizePage(response, PAGE_SIZE);
        setProducts(normalized.content);
        setCurrentPage(normalized.number);
        setTotalPages(normalized.totalPages);
        setTotalElements(normalized.totalElements);
      } catch {
        // The shared request helper already reports the error.
      } finally {
        setLoading(false);
      }
    },
    [category?.itemCategoryId],
  );

  const handleSortChange = async (selectedOption) => {
    const nextAscending = selectedOption?.value.split(",")[0];
    const nextSortBy = selectedOption?.value.split(",")[1];
    setAscending(nextAscending);
    setSortBy(nextSortBy);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", basePath || categoryPath(category));
    }
    await fetchPage(0, nextSortBy, nextAscending);
  };

  const totalResultsText = () => {
    if (!totalElements) return `0 ${t("results")}`;
    const start = currentPage * PAGE_SIZE + 1;
    const end = Math.min((currentPage + 1) * PAGE_SIZE, totalElements);
    return t("showing_results")
      .replace("{start}", start)
      .replace("{end}", end)
      .replace("{total}", totalElements);
  };

  return (
    <div className="w-full">
      <nav
        aria-label="Breadcrumb"
        className="border-b border-gray-100 bg-white px-4 py-3 text-xs text-gray-500 sm:text-sm"
      >
        <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
          <li>
            <Link href="/" className="hover:text-[#E14A5C]">
              {locale === "ar" ? "الرئيسية" : t("homepage")}
            </Link>
          </li>
          <li aria-hidden className="text-gray-300">/</li>
          <li>
            <Link href="/products" className="hover:text-[#E14A5C]">
              {t("all_products") || "كل المنتجات"}
            </Link>
          </li>
          {category ? (
            <>
              <li aria-hidden className="text-gray-300">/</li>
              <li aria-current="page" className="font-semibold text-gray-900">
                {heading}
              </li>
            </>
          ) : null}
        </ol>
      </nav>

      <div className="flex flex-col items-start justify-start">
        <CategoriesSideMenu
          categories={categories}
          activeSlug={category?.seoCode}
          category={category ? null : "all"}
        />

        <div className="w-full p-3">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              {heading}
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-gray-600">
              {description ||
                (category
                  ? `تصفح ${heading} من ألفا جروب تكنولوجي بأسعار تنافسية ومواصفات واضحة.`
                  : "تصفح كل منتجات ألفا جروب تكنولوجي بأسعار تنافسية ومواصفات واضحة.")}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex h-10 items-center gap-4 rounded-full border bg-white px-3">
              <Select
                isSearchable={false}
                options={sortOptions}
                value={currentValue}
                onChange={handleSortChange}
                className="z-50 h-full w-[200px] rounded-full"
                placeholder={t("select")}
                styles={{
                  control: (provided) => ({
                    ...provided,
                    border: "none",
                    boxShadow: "none",
                    background: "transparent",
                    fontWeight: "600",
                    height: "100%",
                    width: "100%",
                  }),
                  input: (base) => ({ ...base, color: "#374151" }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "#dc2626"
                      : state.isFocused
                        ? "#fee2e2"
                        : "#ffffff",
                    color: state.isSelected ? "#ffffff" : "#374151",
                    cursor: "pointer",
                    padding: "10px",
                  }),
                }}
              />
            </div>
            {!loading && totalElements > 0 ? (
              <p className="text-sm text-gray-600">{totalResultsText()}</p>
            ) : null}
          </div>

          {loading ? (
            <div className="mt-5 grid gap-5 xs:grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {[...Array(6)].map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="h-[280px] w-full animate-pulse rounded bg-gray-100"
                />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div>
              <div className="mt-5 grid gap-5 p-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {products.map((product, index) => (
                  <div key={product.itemId || index}>
                    <ProductCard
                      productInfo={product}
                      priority={index < 2}
                    />
                  </div>
                ))}
              </div>
              {totalPages > 1 ? (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={
                    sortBy
                      ? (page) => fetchPage(page, sortBy, ascending)
                      : undefined
                  }
                  buildHref={
                    sortBy
                      ? undefined
                      : (page) =>
                          page === 0
                            ? basePath
                            : `${basePath}?page=${page + 1}`
                  }
                />
              ) : null}
            </div>
          ) : (
            <div className="mt-5 w-full rounded bg-white p-8 text-center text-gray-600">
              {t("no_data")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
