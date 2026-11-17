"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { TbLivePhotoFilled } from "react-icons/tb";
import { LuEye } from "react-icons/lu";

import { useLanguage } from "../../../../context/LanguageContext";

export default function ProductPreview({ sliderImages }) {
  const { t } = useLanguage();
  const lang =
    typeof window !== "undefined" ? localStorage.getItem("lang") || "ar" : "ar";

  return (
    <div className="admin-card w-full max-w-[840px] overflow-hidden">
      <div className="admin-card-header">
        <div className="flex items-center gap-2">
          <span className="admin-section-title-icon !h-8 !w-8 text-sm">
            <LuEye />
          </span>
          <h2 className="admin-card-title text-sm">{t("live_previwe")}</h2>
        </div>
        <span className="admin-badge admin-badge-green">
          <TbLivePhotoFilled />
          {t("live")}
        </span>
      </div>

      <div className="bg-[var(--admin-surface-muted)] p-4">
        <Swiper
          key={lang}
          pagination={{ clickable: true }}
          dir={lang === "ar" ? "rtl" : "ltr"}
          spaceBetween={16}
          modules={[Pagination]}
          className="w-full"
        >
          {sliderImages.map((img, index) => (
            <SwiperSlide key={index}>
              <Image
                src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL + (img.imageUrl || "")}`}
                alt=""
                width={840}
                height={360}
                className="h-[290px] w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] object-contain"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}
