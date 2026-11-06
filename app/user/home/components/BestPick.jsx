"use client";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Autoplay, Navigation } from "swiper/modules";

import { useLanguage } from "../../../../context/LanguageContext";
import { getThumbnailUrl } from "../../../../utils/functions";
import StarRating from "../../components/StarRating";
import { useIdContext } from "../../../../context/idContext";
import Link from "next/link";
import { useRef } from "react";
import { productPath } from "../../../../lib/seo";
import { MdOutlineArrowBackIosNew, MdOutlineArrowForwardIos } from "react-icons/md";

export default function BestPick({ Products }) {
  const { locale } = useLanguage()
  const { t } = useLanguage()
  const swiperRef = useRef()

  const { setSelectedProductId } = useIdContext()
  const truncateText = (text) => {
    if (text.length > 20) {
      return text.slice(0, 18) + "...";
    }

    return text;
  };
  return (
    <div className="w-full  bg-white rounded-2xl p-4 relative group/BestPick">
      <div className="w-full flex justify-between items-center">
        <h2 className="font-semibold text-base  sticky z-10 ">{t("Best_pick_of_the_week")}</h2>
        <div className="text-xs font-semibold">
          <Link href="/user/products/section/topLast30Days">{t("shopMore")} </Link>
          <hr className="bg-red-500 h-[2px] border-none w-auto " />
        </div>
      </div>
      <div className="w-full mt-10 ">
        <Swiper
          key={locale}
          dir={locale === "ar" ? "rtl" : "ltr"}
          slidesPerView={1}
          spaceBetween={5}
          modules={[Navigation]}
          navigation={{
            prevEl: ".custom-prev-BestPick",
            nextEl: ".custom-next-BestPick",
          }}
          breakpoints={{
            720: { slidesPerView: 4 },
            1024: { slidesPerView: 3 },
            1440: { slidesPerView: 4 },
          }}
          className="w-full "
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
        >
          {Products?.slice(0, 4).map((product, index) => {
            const nameProduct = locale === "ar" ? product.nameAr : product.nameEn
            return (
              <SwiperSlide key={index} className="">
                <Link
                  href={productPath(product)}
                  className="flex items-center  cursor-pointer gap-1 select-none w-full"
                  onClick={() => setSelectedProductId(product.itemId)}
                >
                  <div className="relative w-[50px] h-[50px]  rounded-full hover:scale-105 duration-200 shrink-0">
                    <Image
                      src={
                        process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL +
                            getThumbnailUrl(product.images?.[0]?.imageUrl)
                      }
                      alt=""
                      fill
                      loading="lazy"
                      quality={85}
                      sizes="50px"
                      className="object-fill "
                    />
                  </div>
                  <div className="flex flex-col gap-2 w-full min-w-0">
                    <span className="text-[13px] font-medium cursor-pointer truncate" title={nameProduct}
                    >{truncateText(nameProduct)}</span>
                    {product.averageRating === 0 ? "" : <StarRating rating={product.averageRating || 0} />}

                    <div className="flex w-full  justify-start gap-2 items-center ">
                      {product.oldPrice ? (
                        <div className="w-auto">
                          <span className=" line-through text-xs  w-auto text-gray-500">
                            {product.oldPrice?.toLocaleString("en-US")}
                          </span>
                        </div>
                      ) : (
                        <span className=""></span>
                      )}

                      <span className="text-sm font-bold w-full text-red-600 ">
                        {product.price?.toLocaleString("en-US")}.00 {t("currency")}
                      </span>

                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            );
          })
          }
        </Swiper>
        <div className=" opacity-0 invisible
           group-hover/BestPick:opacity-100 group-hover/BestPick:visible
           
            transition-all duration-300 ">
          <button
            type="button"
            onClick={() => swiperRef.current?.slidePrev()}
            className="custom-prev-BestPick absolute left-2 top-1/2  z-50
                        
                        flex items-center justify-center 
                        text-gray-700 hover:text-black"
          >
            < MdOutlineArrowBackIosNew />
          </button>
          <button
            type="button"
            onClick={() => swiperRef.current?.slideNext()}
            className="custom-next-BestPick absolute right-2 top-1/2  z-50
                      
                                                flex items-center justify-center  text-gray-700 hover:text-black"
          >
            < MdOutlineArrowForwardIos />
          </button>
        </div>
      </div>
    </div>
  )
}
