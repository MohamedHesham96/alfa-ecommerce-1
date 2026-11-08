"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "../../../../context/LanguageContext";
import { productPath } from "../../../../lib/seo";

const HERO_SIZES =
  "(max-width: 1024px) 100vw, (max-width: 1500px) 40vw, 600px";

const heroHref = (image) =>
  image?.itemId
    ? productPath({
        itemId: image.itemId,
        nameEn: image.titleEn || image.title,
        nameAr: image.titleAr || image.title,
      })
    : "/products";

export default function ImageSlider({ sliderImages = [] }) {
  const { locale } = useLanguage();

  if (!sliderImages.length) {
    return (
      <div
        className="w-full h-[470px] lg:h-full rounded-3xl bg-white"
        aria-hidden="true"
      />
    );
  }

  // A single hero image does not need a carousel instance, its duplicated
  // loop slides, or the Swiper initialization work. Keep the same markup and
  // dimensions so the LCP image is still server-rendered and preloaded.
  if (sliderImages.length === 1) {
    const image = sliderImages[0];
    return (
      <div className="w-full h-[470px] lg:h-full rounded-3xl">
        <Link
          href={heroHref(image)}
          prefetch={false}
          className="relative block w-full h-full rounded-3xl"
        >
          <Image
            src={process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL + image.imageUrl}
            alt={image.titleAr || image.title || "عرض"}
            fill
            preload
            fetchPriority="high"
            quality={75}
            sizes={HERO_SIZES}
            className="object-cover rounded-3xl"
          />
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full h-[470px] lg:h-full rounded-3xl">
      <Swiper
        key={locale}
        dir={locale === "ar" ? "rtl" : "ltr"}
        navigation={true}
        pagination={true}
        slidesPerView={"auto"}
        loop={true}
        speed={1000}
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        modules={[Pagination, Navigation, Autoplay]}
        className="w-full h-full rounded-3xl"
      >
        {sliderImages.map((img, index) => (
          <SwiperSlide key={img.sliderImageId || index} className="relative w-full rounded-3xl">
            <Link
              href={heroHref(img)}
              prefetch={false}
              className="relative w-full h-full block cursor-pointer"
            >
              <Image
                src={process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL + img.imageUrl}
                alt={img.titleAr || img.title || `عرض ${index + 1}`}
                fill
                preload={index === 0}
                fetchPriority={index === 0 ? "high" : undefined}
                quality={75}
                sizes={HERO_SIZES}
                className="object-cover rounded-3xl"
              />
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
