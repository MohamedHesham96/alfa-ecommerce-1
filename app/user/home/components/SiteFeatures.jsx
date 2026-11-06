"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import { useLanguage } from "../../../../context/LanguageContext";
import { FaShippingFast } from "react-icons/fa";
import { IoPricetagsOutline } from "react-icons/io5";
import { LuShieldCheck } from "react-icons/lu";
import { RiLoopRightFill } from "react-icons/ri";
import { LiaCertificateSolid } from "react-icons/lia";
import "swiper/css";
import "swiper/css/navigation";
import { ImPriceTags } from "react-icons/im";
import { IoMdPricetags } from "react-icons/io";
export default function SiteFeatures() {
    const { locale } = useLanguage()
    const { t } = useLanguage()
    return (
        <div className=" text-white bg-[#0d0625] w-full rounded-full mt-5  p-5 flex justify-center items-center ">

            <Swiper
                key={locale}
                slidesPerView={"auto"}
                slidesOffsetBefore={10}
                slidesOffsetAfter={10}
                modules={[Navigation, Autoplay]}
                navigation={true}
                dir={locale === "ar" ? "rtl" : "ltr"}
                spaceBetween={10}
                className="w-full h-full">


                <SwiperSlide className="!w-full md:!w-[270px]   text-center">
                    <div className="h-full sm:w-full xs:w-5/6 flex   gap-1 justify-center items-center">
                        <span className="text-3xl p-1">

                            <LiaCertificateSolid className="w-full h-full text-[#e14a5c] " />
                        </span>
                        <h2 className=" w-3/4 text-sm ">{t("High_Quality")}</h2>
                    </div>
                </SwiperSlide>

                <SwiperSlide className="!w-full md:!w-[270px]   text-center">
                    <div className="h-full sm:w-full xs:w-5/6 flex  gap-1 justify-center items-center">
                        <span className="text-3xl p-1">
                            <FaShippingFast className="w-full h-full  text-[#e14a5c] " />
                        </span>
                        <h2 className="sm:w-full xs:w-1/2 text-sm">{t("Fast_Delivery")}</h2>
                    </div>
                </SwiperSlide>

                <SwiperSlide className="!w-full md:!w-[270px]   text-center">

                    <div className="h-full  sm:w-full xs:w-5/6 flex   gap-1 justify-center items-center">
                        <span className="text-3xl p-1">

                            <RiLoopRightFill className="w-full h-full  text-[#e14a5c] " />
                        </span>
                        <h2 className="sm:w-full xs:w-1/2 text-sm ">{t("Easy_Returns")}</h2>
                    </div>
                </SwiperSlide>
                
                <SwiperSlide className="!w-full md:!w-[270px]   text-center">
                    <div className="h-full  flex  sm:w-full xs:w-5/6 gap-1 justify-center items-center">
                        <span className="text-3xl p-1">

                            <LuShieldCheck className="w-full h-full  text-[#e14a5c]  " />
                        </span>
                        <h2 className="sm:w-full xs:w-1/2 text-sm ">{t("Original_Products")}</h2>
                    </div>
                </SwiperSlide>
<SwiperSlide className="!w-full md:!w-[270px]   text-center">

                    <div className="h-full  flex sm:w-full xs:w-5/6 justify-center gap-1 items-center">
                        <span className="text-3xl p-1 ">

                            <IoMdPricetags className="w-full h-full text-[#e14a5c] " />
                        </span>
                        <h2 className="sm:w-full xs:w-1/2 text-sm">{t("Best_Prices")}</h2>

                    </div>
                </SwiperSlide>
            </Swiper>
        </div>

    )

}
