"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FaArrowLeft, FaArrowRight, FaHeart } from "react-icons/fa";
import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import Link from "next/link";

import { getRequest, postRequest } from "../../../../utils/requestsUtils";
import ProductCard from "../../components/ProductCard";
import { useLanguage } from "../../../../context/LanguageContext";

const GRID_CLASSES =
  "grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5";

export default function WishList() {
  const { t, locale } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("id") : null;
  const synced = useRef(false);

  const getWishList = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      if (userId) {
        const response = await getRequest("/api/users/favoriteItems", {
          suppressErrorToast: true,
        });
        const content = response?.data?.content;
        setProducts(Array.isArray(content) ? content : []);
      } else {
        const favoriteItems = JSON.parse(
          localStorage.getItem("favoriteItems") || "[]",
        );

        // One stale guest item must not hide the rest of the list.
        const results = await Promise.allSettled(
          favoriteItems.map((item) =>
            getRequest(`/api/public/items/${item.id}`, {
              suppressErrorToast: true,
            }),
          ),
        );

        const items = results
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value?.data)
          .filter(Boolean);

        setProducts(items);
      }
    } catch {
      setProducts([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const syncFavorite = async () => {
      try {
        if (!userId) return;
        if (synced.current) return;

        const favoriteItems = JSON.parse(
          localStorage.getItem("favoriteItems") || "[]",
        );

        if (!favoriteItems.length) return;

        await Promise.all(
          favoriteItems.map((item) =>
            postRequest(`/api/users/favoriteItems/${item.id}`, "", ""),
          ),
        );
        getWishList();
        localStorage.removeItem("favoriteItems");

        synced.current = true;
      } catch {
        // Keep the local list for the next attempt.
      }
    };

    syncFavorite();
  }, [userId, getWishList]);

  useEffect(() => {
    getWishList();
  }, [getWishList]);

  const handleFavoriteRemoved = useCallback(
    (itemId) => {
      setProducts((previous) =>
        previous.filter((product) => {
          const productId = userId ? product?.item?.itemId : product?.itemId;
          return String(productId) !== String(itemId);
        }),
      );
    },
    [userId],
  );

  const ContinueArrow = locale === "ar" ? FaArrowLeft : FaArrowRight;
  const countLabel =
    `${t("inYourList").trim()} ${products.length} ${t("products")}`.trim();

  return (
    <div className="w-full py-6 md:py-8">
      <header className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fff5f6] px-3 py-1 text-xs font-bold text-[#CD4354]">
            <FaHeart className="text-sm" aria-hidden="true" />
            {countLabel}
          </span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
            {t("wishlist")}
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-6 text-gray-500">
            {t("wishlistSubtitle")}
          </p>
        </div>

        <Link
          href="/"
          prefetch={false}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:border-[#CD4354]/30 hover:text-[#CD4354] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CD4354]/30"
        >
          {t("continueShopping")}
          <ContinueArrow aria-hidden="true" />
        </Link>
      </header>

      {loading ? (
        <div className={GRID_CLASSES} aria-busy="true" aria-label={t("loading")}>
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={`wishlist-skeleton-${index}`}
              className="min-h-[360px] rounded-3xl border border-gray-100 bg-white p-4"
            >
              <div className="aspect-square animate-pulse rounded-2xl bg-gray-100" />
              <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50 px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl text-red-500 shadow-sm">
            <FiAlertCircle aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm font-bold text-red-800">
            {t("wishlist_load_error")}
          </p>
          <button
            type="button"
            onClick={getWishList}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#CD4354] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#b53a49]"
          >
            <FiRefreshCw aria-hidden="true" />
            {t("retry")}
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fff5f6] text-2xl text-[#CD4354]">
            <FaHeart aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-gray-900">
            {t("wishlist_empty_title")}
          </h2>
          <p className="mt-1 max-w-md text-sm leading-6 text-gray-500">
            {t("wishlist_empty_desc")}
          </p>
          <Link
            href="/"
            prefetch={false}
            className="mt-5 rounded-full bg-[#E76E7D] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#CD4354] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CD4354]/40"
          >
            {t("shopNow")}
          </Link>
        </div>
      ) : (
        <div className={GRID_CLASSES}>
          {products.map((product) => {
            const productInfo = userId ? product.item : product;
            return (
              <ProductCard
                key={productInfo?.itemId}
                productInfo={productInfo}
                favorite={true}
                onFavoriteRemoved={handleFavoriteRemoved}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
