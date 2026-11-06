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
    <div className="w-full">
       <div className="w-full px-5  flex justify-between items-center gap-2 text-center">
          <div className="flex items-center gap-2">
           
            <span className="text-[#7354EF] text-xl"> <AiFillFire/> </span>
             <h2 className="flex items-center font-semibold gap-2 text-2xl  ">
              {t("hot_categorios")}
            </h2>
          </div>
        
        </div>
      <div className="w-full grid grid-cols-3 gap-x-2 gap-y-1 mt-2">
        {categories.map((category, index) => (
          <Link
            key={category.itemCategoryId || category.seoCode || index}
            href={categoryPath(category)}
            prefetch={false}
            className="mt-4 flex  justify-center items-center text-center cursor-pointer rounded-md min-w-0 px-1"
          >
            <div className="w-full min-w-0 flex xl:flex-row xs:flex-col justify-center items-center gap-2">
              <div className="relative shrink-0 rounded-full h-[80px] w-[80px] hover:scale-105 duration-200">
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${getThumbnailUrl(category.imageURL) || ""
                    }`}
                  alt={locale === "ar" ? category.nameAr : category.nameEn}
                  fill
                  quality={65}
                  sizes="64px"
                  className="object-cover rounded-full"
                />
              </div>
              <h2 className="min-w-0 flex-1 font-semibold text-sm break-words line-clamp-2">
                {locale === "ar"
                  ? category.nameAr || category.nameEn
                  : category.nameEn || category.nameAr}
              </h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
