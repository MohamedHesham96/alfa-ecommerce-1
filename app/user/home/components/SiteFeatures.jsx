"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
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
        slidesPerView={"auto"}
        slidesOffsetBefore={10}
        slidesOffsetAfter={10}
        modules={[Navigation, Autoplay]}
        navigation={true}
        dir={locale === "ar" ? "rtl" : "ltr"}
        spaceBetween={10}
        className="w-full h-full"
      >
        {FEATURES.map(({ key, Icon }) => (
          <SwiperSlide key={key} className="!w-full md:!w-[270px] text-center">
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
