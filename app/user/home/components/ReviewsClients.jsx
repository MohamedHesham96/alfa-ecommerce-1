"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import {
  MdOutlineArrowBackIosNew,
  MdOutlineArrowForwardIos,
} from "react-icons/md";
import { useLanguage } from "../../../../context/LanguageContext";

const REVIEW_IMAGES = [
  { src: "/Images/ReviewsClients/1.png", width: 445, height: 82 },
  { src: "/Images/ReviewsClients/2.png", width: 445, height: 82 },
  { src: "/Images/ReviewsClients/3.png", width: 445, height: 82 },
  { src: "/Images/ReviewsClients/8.png", width: 445, height: 82 },
  {
    src: "/Images/ReviewsClients/5.png",
    width: 654,
    height: 100,
    contain: true,
  },
  { src: "/Images/ReviewsClients/6.png", width: 445, height: 82 },
  { src: "/Images/ReviewsClients/7.png", width: 631, height: 136 },
];

export default function ReviewsClients() {
  const { t, locale } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(null);

  const isRtl = locale === "ar";
  const activeReview =
    activeIndex === null ? null : REVIEW_IMAGES[activeIndex];
  const PreviousIcon = isRtl
    ? MdOutlineArrowForwardIos
    : MdOutlineArrowBackIosNew;
  const NextIcon = isRtl
    ? MdOutlineArrowBackIosNew
    : MdOutlineArrowForwardIos;

  const showPrevious = () =>
    setActiveIndex((index) =>
      index === null
        ? 0
        : (index - 1 + REVIEW_IMAGES.length) % REVIEW_IMAGES.length
    );

  const showNext = () =>
    setActiveIndex((index) =>
      index === null ? 0 : (index + 1) % REVIEW_IMAGES.length
    );

  useEffect(() => {
    if (activeIndex === null) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveIndex(null);
      } else if (event.key === "ArrowRight") {
        showNext();
      } else if (event.key === "ArrowLeft") {
        showPrevious();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex]);

  const getAltText = (index) => `${t("reviews_clients")} ${index + 1}`;

  return (
    <section className="w-full my-10">
      <h2 id="reviews-clients-title" className="text-2xl font-medium my-7">
        {t("reviews_clients")}
      </h2>

      <ul
        aria-labelledby="reviews-clients-title"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6"
      >
        {REVIEW_IMAGES.map((review, index) => (
          <li key={review.src} className="min-w-0">
            <button
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={getAltText(index)}
              className="group relative block aspect-[5/1] w-full cursor-zoom-in overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD4354] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f5f8]"
            >
              <Image
                src={review.src}
                alt={getAltText(index)}
                fill
                quality={85}
                loading="lazy"
                sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                className={`${
                  review.contain
                    ? "object-contain object-center"
                    : "object-cover object-right"
                } transition-transform duration-500 ease-out group-hover:scale-[1.02]`}
              />
            </button>
          </li>
        ))}
      </ul>

      {activeReview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={getAltText(activeIndex)}
          onClick={() => setActiveIndex(null)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm sm:p-8"
        >
          <button
            type="button"
            autoFocus
            onClick={(event) => {
              event.stopPropagation();
              setActiveIndex(null);
            }}
            aria-label={t("close")}
            className="absolute end-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/60 text-white ring-1 ring-white/20 transition hover:bg-slate-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:end-6 sm:top-6"
          >
            <IoClose className="h-6 w-6" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showPrevious();
            }}
            aria-label={t("previous")}
            className="absolute start-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/60 text-white ring-1 ring-white/20 transition hover:bg-slate-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:start-6 sm:h-12 sm:w-12"
          >
            <PreviousIcon aria-hidden="true" />
          </button>

          <div
            className="relative w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={activeReview.src}
              alt={getAltText(activeIndex)}
              width={activeReview.width}
              height={activeReview.height}
              quality={85}
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="h-auto w-full rounded-xl bg-white object-contain shadow-2xl"
            />
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showNext();
            }}
            aria-label={t("next")}
            className="absolute end-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/60 text-white ring-1 ring-white/20 transition hover:bg-slate-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:end-6 sm:h-12 sm:w-12"
          >
            <NextIcon aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
