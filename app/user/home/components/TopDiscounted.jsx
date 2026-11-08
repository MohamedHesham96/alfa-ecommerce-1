"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation ,Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { IoIosArrowRoundBack, IoIosArrowRoundForward } from "react-icons/io";
import { useLanguage } from "../../../../context/LanguageContext";
import ProductCard from "../../components/ProductCard";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import { MdOutlineArrowBackIosNew, MdOutlineArrowForwardIos } from "react-icons/md";

export default function TopDiscounted({ Products }) {
  const { locale ,t } = useLanguage();
const swiperRef = useRef()
  const isRtl = locale === "ar";
  // Swiper's slideNext() advances in data order. In RTL that next slide is
  // visually on the left, so the left arrow means "next" and the right arrow
  // means "previous". Keep the handlers semantic and map them per direction.
  const showPreviousProducts = () => swiperRef.current?.slidePrev();
  const showNextProducts = () => swiperRef.current?.slideNext();
  useEffect(() => {
  }, []);
  return (
    <div className="relative w-full  md:h-[450px] xs:h-[630px] my-10 flex justify-center items-center rounded-3xl ">
        <Image
    src="/Images/img2.png"
    alt="banner"
    fill
    loading="lazy"
    sizes="(max-width: 1023px) calc(100vw - 24px), (max-width: 1499px) calc(100vw - 324px), 1176px"
    quality={85}
    className="object-cover rounded-3xl"
  />
      <div className="w-full h-full absolute top-0  flex md:flex-row xs:flex-col px-2 justify-center items-center ">
<div className=" w-full  h-full  flex xs:flex-row md:flex-col gap-5 p-5 xs:justify-between md:justify-center items-center">
   <div className=" md:order-1 xs:order-2 flex justify-end  ">
     <div className="w-20 h-20 rounded-full bg-red-700 shadow-lg shadow-red-700/40 flex flex-col items-center justify-center text-white gap-1">
       <span className="text-[10px] font-medium leading-none tracking-wide">Save up to</span>
       <span dir="ltr" className="text-xl font-bold leading-none">-45%</span>
     </div>
   </div>
   <div className=" md:order-2 xs:order-1 w-full flex flex-col md:items-center xs:items-start justify-center">
    <div className=" md:text-center xs:text-start  w-full text-white ">
          <h2 className="text-4xl font-bold mb-3"> {t("top_discount")} </h2>
          <h2 className="text-sm xs:w-2/3 md:w-full">{t("text_for_discounts")} </h2>
        </div>
      
          <Link prefetch={false} href="/user/products/section/all"
           className="bg-white rounded-full w-[100px] text-xs py-2 text-center font-medium  mt-5">
          {t("shopNow")} 
       </Link>
   </div>
   
    
</div>
       
      <div className="group/swiper relative overflow-visible  md:w-3/4 xs:w-full h-full flex justify-center items-center ">
      <Swiper
          key={locale}
          slidesPerView={"auto"}
          // slidesOffsetBefore={5}
          // slidesOffsetAfter={5}
                  // pagination={true}

          modules={[Navigation, Autoplay ]}
    navigation={{
      prevEl: ".custom-prev",
      nextEl: ".custom-next",
    }}          dir={locale === "ar" ? "rtl" : "ltr"}
          spaceBetween={10}
           onSwiper={(swiper) => {
      swiperRef.current = swiper;
    }}
          className="w-full h-full "
        >   
          { Products.map((product) => {
            return (
              <SwiperSlide
                key={product.itemId}
                className="my-10 !w-[235px] rounded-lg select-none"
              >
                <div className="rounded-lg  flex justify-center  cursor-pointer">
                  <ProductCard productInfo={product} favorite={false} />
                </div>
              </SwiperSlide>
            );
          })
      
        }
    
         
      </Swiper>
      <div className=" lg:opacity-0 lg:invisible
    lg:group-hover/swiper:opacity-100 lg:group-hover/swiper:visible
   
    transition-all duration-300 ">
          <button
      type="button"
      aria-label={isRtl ? "المنتجات التالية" : "Previous products"}
      onClick={isRtl ? showNextProducts : showPreviousProducts}
      className="absolute left-0 top-1/2 -translate-y-1/2 z-50
                  text-2xl
                flex items-center justify-center 
                text-gray-700 hover:text-black"
    >
      < MdOutlineArrowBackIosNew />
    </button>
        <button
      type="button"
      aria-label={isRtl ? "المنتجات السابقة" : "Next products"}
      onClick={isRtl ? showPreviousProducts : showNextProducts}
      className="absolute right-0 top-1/2 -translate-y-1/2 z-50
              
                text-2xl
                flex items-center justify-center  text-gray-700 hover:text-black"
    >
      < MdOutlineArrowForwardIos />
    </button>
      </div>
      

  {/* السهم الشمال */}
  
      </div>


      </div>
    </div>
  );
}
