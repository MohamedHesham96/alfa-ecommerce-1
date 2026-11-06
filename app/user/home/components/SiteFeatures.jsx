"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { useLanguage } from "../../../../context/LanguageContext";
import { FaShippingFast } from "react-icons/fa";
import { LuShieldCheck } from "react-icons/lu";
import { RiLoopRightFill } from "react-icons/ri";
import { LiaCertificateSolid } from "react-icons/lia";
import { IoMdPricetags } from "react-icons/io";
import "swiper/css";
import "swiper/css/navigation";

const FEATURES = [
  { key: "High_Quality", Icon: LiaCertificateSolid },
  { key: "Fast_Delivery", Icon: FaShippingFast },
  { key: "Easy_Returns", Icon: RiLoopRightFill },
  { key: "Original_Products", Icon: LuShieldCheck },
  { key: "Best_Prices", Icon: IoMdPricetags },
];

export default function SiteFeatures() {
  const { t, locale } = useLanguage();

  return (
    <div className="mt-5 flex w-full items-center justify-center rounded-full bg-[#0d0625] p-5 text-white">
      <Swiper
        key={locale}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          1280: { slidesPerView: 5 },
        }}
        spaceBetween={0}
        modules={[Navigation]}
        navigation={true}
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="w-full h-full xl:[&_.swiper-button-prev]:hidden xl:[&_.swiper-button-next]:hidden"
      >
        {FEATURES.map(({ key, Icon }) => (
          <SwiperSlide key={key} className="w-full text-center">
            <div className="flex w-full items-center justify-center gap-2.5">
              <Icon
                aria-hidden="true"
                className="h-6 w-6 shrink-0 text-[#e14a5c]"
              />
              <span className="text-sm leading-5">{t(key)}</span>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
