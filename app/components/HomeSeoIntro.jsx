"use client";

import Image from "next/image";
import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";
import { useLanguage } from "../../context/LanguageContext";
import { categoryPath, productPath, productDisplayName } from "../../lib/seo";
import { getThumbnailUrl } from "../../utils/functions";

export default function HomeSeoIntro({ categories = [], products = [] }) {
  const { locale, t } = useLanguage();
  const visibleCategories = categories
    .filter((category) => Number(category.itemsCount || 0) > 0)
    .slice(0, 6);
  const visibleProducts = products.slice(0, 4);

  return (
    <section
      aria-labelledby="home-seo-title"
      className="mx-auto flex w-full items-start pt-6 sm:pt-12"
    >
      <div className="relative flex w-full flex-col self-stretch overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(135deg,#ffffff_0%,#fffafb_100%)] px-4 py-5 shadow-[0_24px_60px_-48px_rgba(56,24,35,0.45)] sm:px-7 sm:py-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -end-16 -top-16 h-40 w-40 rounded-full bg-[#CD4354]/[0.06] blur-3xl"
        />

        <div className="relative flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <span
              aria-hidden="true"
              className="mt-1 h-9 w-1 shrink-0 rounded-full bg-[#CD4354]"
            />
            <div className="min-w-0">
              <h1
                id="home-seo-title"
                className="text-[17px] font-semibold leading-7 text-[#20161a] sm:text-[19px]"
              >
                {t("home_seo_title")}
              </h1>
              <p className="mt-1.5 max-w-2xl text-[12px] leading-6 text-slate-600 sm:text-[13px]">
                {t("home_seo_description")}
              </p>
            </div>
          </div>

          <Link
            href="/products"
            prefetch={false}
            className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full bg-[#CD4354] px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#b53646] sm:mt-1"
          >
            {t("all_products")}
            <FiArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>

        {visibleCategories.length > 0 ? (
          <nav aria-label={t("browse_store_categories")} className="relative mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {t("shop_by_category")}
            </p>
            <ul className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {visibleCategories.map((category) => (
                <li key={category.itemCategoryId || category.seoCode}>
                  <Link
                    href={categoryPath(category)}
                    prefetch={false}
                    className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white/80 p-2 transition-colors hover:border-[#CD4354]/30 hover:bg-[#CD4354]/[0.04] sm:flex-col sm:text-center"
                  >
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#f3f1f5] sm:h-14 sm:w-14">
                      {category.imageURL ? (
                        <Image
                          src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${getThumbnailUrl(category.imageURL)}`}
                          alt=""
                          width={56}
                          height={56}
                          quality={65}
                          sizes="56px"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </span>
                    <span className="line-clamp-2 min-w-0 text-[13px] font-medium leading-5 text-slate-700 sm:text-sm">
                      {locale === "ar"
                        ? category.nameAr || category.nameEn
                        : category.nameEn || category.nameAr}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {visibleProducts.length > 0 ? (
          <div className="relative mt-4 border-t border-slate-100 pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {t("latest_products")}
            </p>
            <ul className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {visibleProducts.map((product) => {
                const imageUrl = product.images?.[0]?.imageUrl;
                return (
                  <li key={product.itemId} className="min-w-0">
                    <Link
                      href={productPath(product)}
                      prefetch={false}
                      className="flex min-h-16 items-center gap-2 rounded-2xl border border-slate-100 bg-white/80 p-2 transition-colors hover:border-[#CD4354]/30 hover:bg-[#CD4354]/[0.04]"
                    >
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#f3f1f5]">
                        {imageUrl ? (
                          <Image
                            src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${getThumbnailUrl(imageUrl)}`}
                            alt=""
                            width={48}
                            height={48}
                            quality={65}
                            sizes="48px"
                            className="h-full w-full object-contain"
                          />
                        ) : null}
                      </span>
                      <span className="line-clamp-2 min-w-0 text-[11px] font-medium leading-4 text-slate-700">
                        {productDisplayName(product, locale)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
