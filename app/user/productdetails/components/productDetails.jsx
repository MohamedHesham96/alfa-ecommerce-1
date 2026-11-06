"use client";
import { useEffect, useState, useCallback } from "react";
import { getProductDetails, getItemRatings } from "../../../../utils/functions";
import { postRequest } from "../../../../utils/requestsUtils";
import Image from "next/image";
import { useLanguage } from "../../../../context/LanguageContext";
import ProductImages from "./ProductImages"
import ProductInfo from "./ProductInfo"
import YouMightLike from "./YouMightLike"
import Specification from "./Specification"
import ProductRating from "./ProductRating"
import ReviewForm from "./ReviewForm"
import ReviewsList from "./ReviewsList";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { MdOutlineLocalShipping } from "react-icons/md";

import { LuShieldCheck } from "react-icons/lu";
import { IoIosCalendar } from "react-icons/io";
import Link from "next/link";
import { categoryPath } from "../../../../lib/seo";

const EMPTY_PRODUCT = {
  nameEn: "",
  nameAr: "",
  price: null,
  oldPrice: null,
  descriptionAr: "",
  descriptionEn: "",
  category: {
    id: null,
    nameAr: "",
    nameEn: "",
    seoCode: null,
  },
  code: "",
  mainImage: "",
  mainImagefile: "",
  available: null,
  images: [],
  averageRating: 0,
  ratingCount: 0,
  ram: "",
  flash: "",
  content: "",
  brand: "",
  releaseYear: "",
};

function mapProduct(data) {
  if (!data) return EMPTY_PRODUCT;
  return {
    ...EMPTY_PRODUCT,
    nameEn: data.nameEn || "",
    nameAr: data.nameAr || "",
    code: data.code || "",
    price: data.price,
    oldPrice: data.oldPrice,
    descriptionAr: data.descriptionAr || "",
    descriptionEn: data.descriptionEn || "",
    images: Array.isArray(data.images) ? data.images : [],
    ram: data.ram || "",
    flash: data.flash || "",
    content: data.contents || "",
    brand: data.brand || "",
    releaseYear: data.releaseYear || "",
    available: data.available,
    ratingCount: data.ratingCount || 0,
    averageRating: data.averageRating || 0,
    seoCode: data.seoCode || null,
    category: {
      id: data.itemCategory?.itemCategoryId || null,
      nameAr: data.itemCategory?.nameAr || "",
      nameEn: data.itemCategory?.nameEn || "",
      seoCode: data.itemCategory?.seoCode || null,
      imageURL: data.itemCategory?.imageURL || null,
    },
  };
}

export default function ProductDetails({ itemId, initialProduct, categorySlug }) {
  const [loading, setLoading] = useState(!initialProduct);
  const [ratingRefreshKey, setRatingRefreshKey] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(false);
  const { t, locale } = useLanguage();
  const [product, setProduct] = useState(() => mapProduct(initialProduct));

  const productDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProductDetails(itemId);
      setProduct(mapProduct(res.data));
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    setReviewsError(false);
    try {
      const res = await getItemRatings(itemId);
      setReviews(res?.data.content || []);
    } catch (error) {
      console.error("Failed to load reviews:", error);
      setReviewsError(true);
    } finally {
      setReviewsLoading(false);
    }
  }, [itemId]);

  // عند فتح صفحة المنتج نضيفه لـ recentWatched (للمستخدم المسجل فقط)
  const recordRecentWatched = useCallback(async () => {
    const userId =
      typeof window !== "undefined" ? localStorage.getItem("id") : "";
    if (!userId) return;
    try {
      await postRequest(`/api/users/recentWatchedItems/${itemId}`, "", "");
    } catch (error) {
      console.error("Failed to record recent watched item:", error);
    }
  }, [itemId]);

  useEffect(() => {
    const track = setTimeout(() => {
      recordRecentWatched();
    }, 800);
    return () => clearTimeout(track);
  }, [recordRecentWatched]);

  useEffect(() => {
    if (initialProduct && Number(initialProduct.itemId) === Number(itemId)) {
      setProduct(mapProduct(initialProduct));
      setLoading(false);
      return;
    }
    productDetails();
  }, [initialProduct, itemId, productDetails]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const categoryName = locale === "ar" ? product.category.nameAr : product.category.nameEn;
  const productName = locale === "ar" ? product.nameAr : product.nameEn;
  const categoryHref = product.category.id
    ? categoryPath({
        ...product.category,
        seoCode: product.category.seoCode || categorySlug,
      })
    : null;

  return (
    <div className="min-w-0  ">
      <nav aria-label="Breadcrumb" className="border-b border-gray-100 py-3 sm:py-4 p-5">
        <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-gray-500 sm:text-sm">
          <li className="shrink-0">
            <Link
              href={"/"}
              className="transition-colors hover:text-[#E14A5C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E14A5C]"
            >
              {locale === "ar" ? "الرئيسية" : t("homepage")}
            </Link>
          </li>
          {product.category.id ? (
            <li className="flex min-w-0 items-center gap-x-1.5">
              <span aria-hidden className="text-gray-300">/</span>
              <Link
                href={categoryHref}
                className="max-w-[45vw] truncate transition-colors hover:text-[#E14A5C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E14A5C] sm:max-w-none"
              >
                {categoryName}
              </Link>
            </li>
          ) : null}
          <li className="flex min-w-0 items-center gap-x-1.5">
            <span aria-hidden className="text-gray-300">/</span>
            <span aria-current="page" className="max-w-[65vw] truncate font-semibold text-gray-900 sm:max-w-none">
              {productName}
            </span>
          </li>
        </ol>
      </nav>

      <div className="grid w-full grid-cols-1 items-start gap-6 py-5 p-5 sm:gap-8 lg:grid-cols-2 lg:gap-10 lg:py-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)]">
        {loading && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <Image
              src="/Images/logo.png"
              alt=""
              sizes="100vw"
              className="w-[100px] h-[100px]  border-t-transparent rounded-full animate-pulse"
              width={100}
              height={100}
            />
          </div>
        )}

        <ProductImages product={product} />

        <ProductInfo product={product} itemId={itemId} />

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 lg:col-start-2 xl:col-start-3 xl:sticky xl:top-6">
          <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
            {t("shipping") + " & " + t("delivery")}
          </h2>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="flex items-center gap-3 font-medium text-gray-800">
                <MdOutlineLocalShipping className="h-6 w-6 shrink-0 text-[#E14A5C]" aria-hidden />
                <span>{t("courier_delivery")}</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 sm:text-sm">
                {t("delivery_text")}
              </p>
            </div>
            <div className="shrink-0 text-center text-xs text-gray-500">
              <div className="text-sm font-semibold text-gray-800">2-3</div>
              <div>Days</div>
            </div>
          </div>
          <hr className="my-4 border-gray-200 sm:my-5" />
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-gray-700">
                <LuShieldCheck className="h-5 w-5 shrink-0 text-[#E14A5C]" aria-hidden />
                <span className="truncate">{t("warranty_text")}</span>
              </span>
              <Link
                href={"/user/about#Guarantee_Policy"}
                target="_blank"
                className="shrink-0 text-xs font-medium text-blue-500 transition-colors hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                {t("more_details")}
              </Link>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-gray-700">
                <IoIosCalendar className="h-5 w-5 shrink-0 text-[#E14A5C]" aria-hidden />
                <span className="truncate">{t("return_text")}</span>
              </span>
              <Link
                href={"/user/about#Return_Policy"}
                target="_blank"
                className="shrink-0 text-xs font-medium text-blue-500 transition-colors hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                {t("more_details")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100">
        <div className="grid w-full grid-cols-1 items-start p-5 gap-8 py-6 sm:py-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12 lg:py-10">
          <div className="flex min-w-0 flex-col">
            <Specification product={product} />
          </div>

          <div id="reviews" className="flex w-full min-w-0 scroll-mt-24 flex-col">
            <h2 className="text-center text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
              {t("CustomerReviews")}
            </h2>

            <div className="mt-6">
              <ProductRating product={product} itemId={itemId} refreshKey={ratingRefreshKey} />
            </div>

            <div className="mt-8">
              {reviewsLoading ? (
                <div className="flex flex-col gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-[#f6f5f8] rounded-3xl h-32 animate-pulse" />
                  ))}
                </div>
              ) : reviewsError ? (
                <p className="text-sm text-gray-500">{t("reviews_error")}</p>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-gray-500">{t("no_reviews")}</p>
              ) : (
                <ReviewsList reviews={reviews} />
              )}
            </div>

            <div className="mt-8">
              <ReviewForm
                product={product}
                itemId={itemId}
                onRatingSubmitted={() => {
                  setRatingRefreshKey((key) => key + 1);
                  fetchReviews();
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <YouMightLike categoryId={product.category.id} />
    </div>
  );
}
