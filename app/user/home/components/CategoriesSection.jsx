"use client";
import Image from "next/image";
import Link from "next/link";

import { useLanguage } from "../../../../context/LanguageContext";
import { getThumbnailUrl } from "../../../../utils/functions";
import { AiFillFire } from "react-icons/ai";
import { categoryPath } from "../../../../lib/seo";

export default function CategorySection({ categories = [] }) {
  const { locale, t } = useLanguage();

  return (
    <div className="flex h-full w-full min-w-0 flex-col rounded-2xl bg-white p-4 md:h-[350px]">
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-xl text-[#7354EF]" aria-hidden="true">
            <AiFillFire />
          </span>
          <h2 className="truncate text-base font-semibold">{t("hot_categorios")}</h2>
        </div>

        <div className="shrink-0 text-xs font-semibold">
          <Link prefetch={false} href="/products">
            {t("shopMore")}{" "}
          </Link>
          <hr className="h-[2px] w-auto border-none bg-red-500" />
        </div>
      </div>

      <div className="mt-3 grid flex-1 grid-cols-3 content-center gap-2 sm:gap-3">
        {categories.map((category, index) => {
          const name =
            locale === "ar"
              ? category.nameAr || category.nameEn
              : category.nameEn || category.nameAr;

          return (
            <Link
              key={category.itemCategoryId || category.seoCode || index}
              href={categoryPath(category)}
              prefetch={false}
              className="group flex min-w-0 flex-col items-center justify-start gap-2 rounded-xl px-1 py-1 text-center transition-colors duration-200 hover:bg-gray-50"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full duration-200 group-hover:scale-105 sm:h-16 sm:w-16 md:h-12 md:w-12 lg:h-[72px] lg:w-[72px]">
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${
                    getThumbnailUrl(category.imageURL) || ""
                  }`}
                  alt={name || ""}
                  fill
                  quality={65}
                  sizes="72px"
                  className="rounded-full object-cover"
                />
              </div>
              <h3 className="line-clamp-2 min-h-[2.5em] w-full break-words text-xs font-semibold leading-tight sm:text-sm">
                {name}
              </h3>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
