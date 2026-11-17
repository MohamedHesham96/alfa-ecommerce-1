"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { useLanguage } from "../../../context/LanguageContext";
import { getCategories, getThumbnailUrl } from "../../../utils/functions";
import { categoryPath } from "../../../lib/seo";
import CategoryTreeNav from "./CategoryTreeNav";

export default function CategoriesSideMenu({
  category,
  categories: initialCategories,
  activeSlug,
}) {
  const { t, locale } = useLanguage();
  const [categoriesList, setCategoriesList] = useState(
    Array.isArray(initialCategories) ? initialCategories : [],
  );
  const [loading, setLoading] = useState(!Array.isArray(initialCategories));

  useEffect(() => {
    if (Array.isArray(initialCategories)) {
      setCategoriesList(initialCategories);
      setLoading(false);
      return;
    }

    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getCategories();
        if (active) setCategoriesList(res?.data?.content || []);
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [initialCategories]);

  const isAllActive = !activeSlug && category === "all";

  return (
    <div
      id="catego-sideMenu"
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="w-full bg-[#f6f6f7] px-4 py-5 sm:px-6"
    >
      <div className="w-full">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            {t("categories")}
          </h2>
        </div>

        {loading ? (
          <div className="my-4 flex w-full items-start justify-between gap-6 overflow-hidden sm:justify-start">
            {[...Array(6)].map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="flex shrink-0 flex-col items-center gap-3"
              >
                <div className="h-[80px] w-[80px] animate-pulse rounded-full bg-gray-200/70 lg:h-[100px] lg:w-[100px]" />
                <div className="h-4 w-20 animate-pulse rounded-full bg-gray-200/70" />
              </div>
            ))}
          </div>
        ) : (
          <div className="my-4 w-full">
            <Swiper
              slidesPerView="auto"
              spaceBetween={5}
              breakpoints={{
                640: { spaceBetween: 16 },
                1024: { spaceBetween: 24 },
              }}
              dir={locale === "ar" ? "rtl" : "ltr"}
              className="w-full"
            >
              <SwiperSlide className="!my-3 !h-auto !w-auto px-2">
                <Link
                  href="/products"
                  className="group flex cursor-pointer flex-col items-center gap-3 text-center"
                >
                  <span
                    className={`flex h-[100px] w-[100px] items-center justify-center rounded-full transition-all duration-300 group-hover:scale-105 group-hover:shadow-md xs:h-[80px] xs:w-[80px] lg:h-[100px] lg:w-[100px] ${
                      isAllActive
                        ? "bg-white ring-2 ring-red-500"
                        : "bg-gray-100/80"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-gray-300" />
                  </span>
                  <span
                    className={`line-clamp-2 text-base font-medium leading-tight ${
                      isAllActive ? "text-red-500" : "text-gray-800"
                    }`}
                  >
                    {t("all")}
                  </span>
                </Link>
              </SwiperSlide>

              {categoriesList.map((item) => {
                const isActive =
                  (activeSlug && item.seoCode === activeSlug) ||
                  (!activeSlug && category === item.nameEn);
                return (
                  <SwiperSlide
                    key={item.itemCategoryId || item.seoCode}
                    className="!my-3 !h-auto !w-auto"
                  >
                    <Link
                      href={categoryPath(item)}
                      className="group flex w-[124px] cursor-pointer flex-col items-center gap-3 text-center sm:w-[152px]"
                    >
                      <span
                        className={`relative rounded-full p-3 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md xs:h-[80px] xs:w-[80px] lg:h-[100px] lg:w-[100px] lg:p-4 ${
                          isActive
                            ? "bg-white ring-2 ring-red-500"
                            : "bg-white"
                        }`}
                      >
                        <Image
                          src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${
                            getThumbnailUrl(item.imageURL) || ""
                          }`}
                          alt={
                            locale === "ar" ? item.nameAr : item.nameEn
                          }
                          quality={85}
                          fill
                          sizes="100px"
                          className="rounded-full object-fill"
                        />
                      </span>
                      <span
                        className={`line-clamp-2 w-full text-sm font-medium leading-tight ${
                          isActive ? "text-red-500" : "text-gray-800"
                        }`}
                      >
                        {locale === "ar" ? item.nameAr : item.nameEn}
                      </span>
                    </Link>
                  </SwiperSlide>
                );
              })}
            </Swiper>
            <CategoryTreeNav
              categories={categoriesList}
              activeSlug={activeSlug}
            />
          </div>
        )}
      </div>
    </div>
  );
}
