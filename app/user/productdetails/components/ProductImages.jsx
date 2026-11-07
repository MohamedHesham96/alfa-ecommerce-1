"use client";
import { getThumbnailUrl } from "../../../../utils/functions";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Mousewheel, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../../../context/LanguageContext";
import { IoImageOutline } from "react-icons/io5";
import { MdOutlineArrowBackIosNew, MdOutlineArrowForwardIos } from "react-icons/md";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 768px)").matches
      : true
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (event) => setIsDesktop(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}

export default function ProductImages({ product, layout = "THUMBNAILS_SIDE" }) {
  const urlImage = process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL;
  const swiperRef = useRef(null);
  const thumbsSwiperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedThumbs, setFailedThumbs] = useState({});
  const { locale } = useLanguage();
  const isDesktop = useIsDesktop();
  const thumbsAtBottom = layout === "THUMBNAILS_BOTTOM";
  const showThumbnails = layout !== "SLIDER_ONLY";
  const thumbDirection = thumbsAtBottom
    ? "horizontal"
    : isDesktop
      ? "vertical"
      : "horizontal";
  const images = Array.isArray(product.images) ? product.images : [];
  const productName = locale === "ar" ? product.nameAr : product.nameEn;

  return (
    <div
      className={`flex w-full min-w-0 gap-3 sm:gap-4 sm:mx-auto sm:max-w-[620px] lg:sticky md:top-6 lg:mx-0 lg:max-w-none ${
        thumbsAtBottom ? "flex-col" : "flex-col md:flex-row"
      }`}
    >
      {showThumbnails && images.length > 1 && (
<Swiper
          key={`${locale}-${thumbDirection}-${layout}`}
          dir={locale === "ar" ? "rtl" : "ltr"}
          direction={thumbDirection}
          slidesPerView="auto"
          slidesPerGroup={1}
          spaceBetween={8}
          modules={[Mousewheel]}
          mousewheel={{ forceToAxis: true, threshold: 40 }}
          initialSlide={activeIndex}
          onSwiper={(swiper) => {
            thumbsSwiperRef.current = swiper;
          }}
          aria-label={`${productName || "Product"} images`}
          className={
            thumbsAtBottom
              ? "order-2 min-h-0 w-full shrink-0 overflow-hidden h-16"
              : "lg:order-1 xs:order-2 min-h-0 w-full shrink-0 overflow-hidden md:h-[360px] md:w-[110px] lg:h-[520px]"
          }
        >
          {images.map((img, index) => (
            <SwiperSlide
              key={img?.itemImageId ?? img?.imageUrl ?? index}
              className="!h-14 !w-14 sm:!h-20 sm:!w-20"
            >
              <button
                type="button"
                onClick={() => swiperRef.current?.slideTo(index)}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-current={index === activeIndex}
                className={`relative h-full w-full overflow-hidden rounded-xl border-2 bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E14A5C] focus-visible:ring-offset-1 ${
                  index === activeIndex
                    ? "border-[#E14A5C]"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <Image
                  src={
                    urlImage +
                    (failedThumbs[index]
                      ? img.imageUrl
                      : getThumbnailUrl(img.imageUrl))
                  }
                  alt={`${productName} - ${locale === "ar" ? "صورة مصغرة" : "thumbnail"} ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-contain p-1"
                  onError={() =>
                    setFailedThumbs((prev) => ({ ...prev, [index]: true }))
                  }
                />
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
      <div
        className={`relative min-w-0 flex-1 overflow-hidden rounded-2xl bg-white sm:rounded-3xl ${
          thumbsAtBottom ? "order-1" : "lg:order-2 xs:order-1"
        }`}
      >
        {images.length > 0 ? (
          <div className="group/swiperImage ">
          <Swiper
            key={locale}
            slidesPerView={1}
                modules={[Navigation, Autoplay]}
    navigation={{
      prevEl: ".custom-prev",
      nextEl: ".custom-next",
    }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            onSlideChange={(swiper) => {
              setActiveIndex(swiper.activeIndex);
              thumbsSwiperRef.current?.slideTo(swiper.activeIndex);
            }}
            dir={locale === "ar" ? "rtl" : "ltr"}
            spaceBetween={10}
            className="aspect-square w-full max-h-[360px] select-none lg:max-h-[520px]"
          >
            {images.map((img, index) => (
              <SwiperSlide
                key={img?.itemImageId ?? img?.imageUrl ?? index}
                className="group relative"
              >
                <Image
                  src={urlImage + img.imageUrl}
                  alt={
                    productName
                      ? `${productName} - ${locale === "ar" ? "صورة" : "image"} ${index + 1}`
                      : locale === "ar"
                        ? `صورة المنتج ${index + 1}`
                        : `Product image ${index + 1}`
                  }
                  fill
                  priority={index === 0}
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px"
                  className="object-contain transition-transform duration-300 lg:group-hover:scale-[1.05]"
                />
              </SwiperSlide>
            ))}
          </Swiper>
           <div className=" lg:opacity-0 lg:invisible
              lg:group-hover/swiperImage:opacity-100 lg:group-hover/swiperImage:visible
              xs:opacity-100 xs:visible
              transition-all duration-300 ">
                    <button
                type="button"
                aria-label={locale === "ar" ? "الصورة السابقة" : "Previous image"}
                onClick={() => swiperRef.current?.slidePrev()}
                className="absolute left-0 top-1/3 -translate-y-1/2 z-50
                            text-2xl
                          flex items-center justify-center
                          text-gray-700 hover:text-black"
              >
                < MdOutlineArrowBackIosNew />
              </button>
                  <button
                type="button"
                aria-label={locale === "ar" ? "الصورة التالية" : "Next image"}
                onClick={() => swiperRef.current?.slideNext()}
                className="absolute right-0 top-1/3 -translate-y-1/2 z-50

                          text-2xl
                          flex items-center justify-center  text-gray-700 hover:text-black"
              >
                < MdOutlineArrowForwardIos />
              </button>
                </div>
                </div>
        ) : (
          <div className="flex aspect-square w-full items-center justify-center text-gray-300">
            <IoImageOutline className="h-20 w-20" aria-hidden />
          </div>
        )}
      </div>


    </div>
  );
}
