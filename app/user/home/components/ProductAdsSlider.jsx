"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

import { useLanguage } from "../../../../context/LanguageContext";
import { getRequest } from "../../../../utils/requestsUtils";
import {
  getProductDetails,
  getThumbnailUrl,
} from "../../../../utils/functions";

import ProductCard from "../../components/ProductCard";

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL;
const PRODUCT_ADS_MIN_NUMBER = 6;

// Keep the outer shell identical across loading, empty, and loaded states.
// React reuses this DOM node; changing its animation/class while replacing
// its children makes Chrome report the old composited layer as a 4967px shift.
const SHELL_CLASS_NAME =
  "w-full h-full flex justify-between rounded-3xl relative";

const resolveProductImage = (product) =>
  product?.mainImageURL || product?.images?.[0]?.imageUrl || "";

export default function ProductAdsSlider({ offers = [] }) {
  const { t, locale } = useLanguage();

  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const shellRef = useRef(null);

  const [productSwiper, setProductSwiper] = useState(null);
  const [imageSwiper, setImageSwiper] = useState(null);

  const [activeIndex, setActiveIndex] = useState(0);

  // This section sits well below the fold. Do not spend six API requests on
  // it until the user is close enough to see it.
  useEffect(() => {
    const node = shellRef.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const fetchSlides = useCallback(async () => {
    try {
      setLoading(true);

      let offersList = offers;
      if (!offersList.length) {
        const res = await getRequest("/api/public/offers");
        offersList = res.data || [];
      }

      const eligibleOffers = offersList
        .filter((offer) => offer.number >= PRODUCT_ADS_MIN_NUMBER)
        .sort((a, b) => a.number - b.number);

      const slidesData = (
        await Promise.all(
          eligibleOffers.map(async (offer) => {
            if (!offer.itemId) return null;
            try {
              const pRes = await getProductDetails(offer.itemId);
              const product = pRes.data || null;
              if (!product && !offer.imageUrl) return null;
              return { ...offer, product };
            } catch {
              return offer.imageUrl ? { ...offer, product: null } : null;
            }
          }),
        )
      ).filter(Boolean);

      setSlides(slidesData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [offers]);

  useEffect(() => {
    if (!visible) return;
    fetchSlides();
  }, [fetchSlides, visible]);

  // // ==========================================
  // // AUTOPLAY - الاتنين يتحركوا مع بعض
  // // ==========================================

  // useEffect(() => {
  //   if (!productSwiper || !imageSwiper || slides.length <= 1) {
  //     return;
  //   }

  //   const interval = setInterval(() => {
  //     if (
  //       productSwiper.destroyed ||
  //       imageSwiper.destroyed
  //     ) {
  //       return;
  //     }

  //     // نفس اللحظة + نفس السرعة
  //     productSwiper.slideNext(700);
  //     imageSwiper.slideNext(700);
  //   }, 4500);

  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, [productSwiper, imageSwiper, slides.length]);

  // ==========================================
  // Loading
  // ==========================================

  if (loading) {
    return (
      <div ref={shellRef} className={SHELL_CLASS_NAME}>
        <div className="w-full h-full bg-gray-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!slides.length) {
    return (
      <div ref={shellRef} className={SHELL_CLASS_NAME}>
        <div className="w-full h-full bg-white rounded-3xl flex justify-center items-center text-gray-400">
          {t("product_ads")}
        </div>
      </div>
    );
  }

  return (
    <div ref={shellRef} className={SHELL_CLASS_NAME}>

      {/* ================================
          PRODUCT SWIPER
      ================================= */}

      <div className="w-[40%] h-full">
        <Swiper
          key={`product-${locale}`}
  dir={locale === "ar" ? "rtl" : "ltr"}
  slidesPerView={1}
  loop={true}
  speed={700}
  onSwiper={(swiper) => {
    setProductSwiper(swiper);
  }}
  onSlideChange={(swiper) => {
    const index = swiper.realIndex;

    setActiveIndex(index);

    if (
      imageSwiper &&
      !imageSwiper.destroyed &&
      imageSwiper.realIndex !== index
    ) {
      imageSwiper.slideToLoop(index, 700);
    }
  }}
  className="w-full h-full"
        >
          {slides.map((slide, index) => (
            <SwiperSlide
              key={slide.offerId || index}
              className="h-full"
            >
              <div className="w-full h-full flex items-center justify-center">
                <ProductCard productInfo={slide.product} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* ================================
          IMAGE SWIPER
      ================================= */}

      <div className="w-[60%] h-full">
        <Swiper
           key={`image-${locale}`}
  dir={locale === "ar" ? "rtl" : "ltr"}
  slidesPerView={1}
  loop={true}
  speed={700}
  onSwiper={(swiper) => {
    setImageSwiper(swiper);
  }}
  onSlideChange={(swiper) => {
    const index = swiper.realIndex;

    setActiveIndex(index);

    if (
      productSwiper &&
      !productSwiper.destroyed &&
      productSwiper.realIndex !== index
    ) {
      productSwiper.slideToLoop(index, 700);
    }
  }}
  className="w-full h-full"
        >
          {slides.map((slide, index) => {
            const thumb = resolveProductImage(slide.product);

            const thumbSrc = thumb
              ? IMAGE_BASE_URL + getThumbnailUrl(thumb)
              : "";

            const largeSrc = slide.imageUrl
              ? IMAGE_BASE_URL + slide.imageUrl
              : thumbSrc;

            return (
              <SwiperSlide
                key={slide.offerId || index}
                className="h-full"
              >
                <div className="w-full h-[500px]">
                  <div className="relative w-full h-full rounded-[22px] overflow-hidden">

                    {largeSrc ? (
                      <Image
                        src={largeSrc}
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 60vw, 420px"
                        quality={75}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-white" />
                    )}

                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      {/* ================================
          DOTS
      ================================= */}

<div
  className={`
    absolute
    z-10
    flex
    items-center
    gap-2
    bottom-5
    ${locale === "ar" ? "right-[13%]" : "left-[20%]"}
    -translate-x-1/2
  `}
>        {slides.map((slide, index) => (
          <button
            key={slide.offerId || index}
            aria-label={`Slide ${index + 1}`}
            onClick={() => {
              productSwiper?.slideToLoop(index, 700);
              imageSwiper?.slideToLoop(index, 700);

              setActiveIndex(index);
            }}
            className="flex h-6 w-6 items-center justify-center rounded-full"
          >
            <span
              aria-hidden="true"
              className={`block rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? "w-2.5 h-2.5 bg-gray-900"
                  : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          </button>
        ))}
      </div>

    </div>
  );
}
