"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { FaQuoteRight } from "react-icons/fa6";
import { IoClose, IoExpandOutline } from "react-icons/io5";
import {
  MdOutlineArrowBackIosNew,
  MdOutlineArrowForwardIos,
} from "react-icons/md";
import { useLanguage } from "../../../../context/LanguageContext";
import styles from "./ReviewsClients.module.css";

// This is the authored review data that ships with the site. Keep every source
// and its order as-is; screenshots are rendered with object-contain so no
// customer comment or avatar is cropped.
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
];

const AUTOPLAY_DELAY = 5200;
const SWIPER_SPEED = 720;
const padNumber = (value) => String(value).padStart(2, "0");

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      setPrefersReducedMotion(false);
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updatePreference);
      return () => mediaQuery.removeEventListener("change", updatePreference);
    }

    mediaQuery.addListener(updatePreference);
    return () => mediaQuery.removeListener(updatePreference);
  }, []);

  return prefersReducedMotion;
}

export default function ReviewsClients() {
  const { t, locale } = useLanguage();
  const isRtl = locale === "ar";
  const totalReviews = REVIEW_IMAGES.length;

  const sectionRef = useRef(null);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const lastFocusedElementRef = useRef(null);
  const cardPointerStartRef = useRef(null);

  const [swiperInstance, setSwiperInstance] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [isInView, setIsInView] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusVisibleWithin, setIsFocusVisibleWithin] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const prefersReducedMotion = usePrefersReducedMotion();

  const isLightboxOpen = lightboxIndex !== null;
  const activeReview =
    lightboxIndex === null ? null : REVIEW_IMAGES[lightboxIndex];

  const PreviousIcon = isRtl
    ? MdOutlineArrowForwardIos
    : MdOutlineArrowBackIosNew;
  const NextIcon = isRtl
    ? MdOutlineArrowBackIosNew
    : MdOutlineArrowForwardIos;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.15, rootMargin: "80px 0px" }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const updatePageVisibility = () => setIsPageVisible(!document.hidden);
    updatePageVisibility();
    document.addEventListener("visibilitychange", updatePageVisibility);

    return () =>
      document.removeEventListener("visibilitychange", updatePageVisibility);
  }, []);

  const autoplayEnabled =
    Boolean(swiperInstance) &&
    isInView &&
    isPageVisible &&
    !isHovered &&
    !isFocusVisibleWithin &&
    !isLightboxOpen &&
    !prefersReducedMotion;

  useEffect(() => {
    if (!swiperInstance || swiperInstance.destroyed || !swiperInstance.autoplay) {
      return;
    }

    if (autoplayEnabled) {
      swiperInstance.autoplay.start();
    } else {
      swiperInstance.autoplay.stop();
    }
  }, [autoplayEnabled, swiperInstance]);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const stepLightbox = useCallback((direction) => {
    setLightboxIndex((currentIndex) => {
      if (currentIndex === null) return currentIndex;
      return (
        (currentIndex + direction + REVIEW_IMAGES.length) %
        REVIEW_IMAGES.length
      );
    });
  }, []);

  const openLightbox = useCallback((index) => {
    lastFocusedElementRef.current = document.activeElement;
    setLightboxIndex(index);
  }, []);

  useEffect(() => {
    if (!isLightboxOpen) return undefined;

    const section = sectionRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
        return;
      }

      const forwardKey = isRtl ? "ArrowLeft" : "ArrowRight";
      const backwardKey = isRtl ? "ArrowRight" : "ArrowLeft";

      if (event.key === forwardKey) {
        event.preventDefault();
        stepLightbox(1);
      } else if (event.key === backwardKey) {
        event.preventDefault();
        stepLightbox(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);

      const activeTrigger = section?.querySelector(
        '[data-review-trigger="active"]'
      );
      (activeTrigger || lastFocusedElementRef.current)?.focus?.();
    };
  }, [closeLightbox, isLightboxOpen, isRtl, stepLightbox]);

  useEffect(() => {
    if (isLightboxOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isLightboxOpen]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    setActiveIndex(lightboxIndex);

    if (swiperInstance && !swiperInstance.destroyed) {
      swiperInstance.slideToLoop(
        lightboxIndex,
        prefersReducedMotion ? 0 : SWIPER_SPEED
      );
    }
  }, [lightboxIndex, prefersReducedMotion, swiperInstance]);

  const showSlide = useCallback(
    (index) => {
      setActiveIndex(index);
      if (swiperInstance && !swiperInstance.destroyed) {
        swiperInstance.slideToLoop(index);
      }
    },
    [swiperInstance]
  );

  const showPrevious = useCallback(() => {
    if (swiperInstance && !swiperInstance.destroyed) {
      swiperInstance.slidePrev();
    }
  }, [swiperInstance]);

  const showNext = useCallback(() => {
    if (swiperInstance && !swiperInstance.destroyed) {
      swiperInstance.slideNext();
    }
  }, [swiperInstance]);

  const handleSectionKeyDown = (event) => {
    if (isLightboxOpen) return;

    const forwardKey = isRtl ? "ArrowLeft" : "ArrowRight";
    const backwardKey = isRtl ? "ArrowRight" : "ArrowLeft";

    if (event.key === forwardKey) {
      event.preventDefault();
      showNext();
    } else if (event.key === backwardKey) {
      event.preventDefault();
      showPrevious();
    }
  };

  const handleFocusCapture = (event) => {
    try {
      if (event.target.matches?.(":focus-visible")) {
        setIsFocusVisibleWithin(true);
      }
    } catch {
      // :focus-visible is not available in a few older browsers.
    }
  };

  const handleBlurCapture = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsFocusVisibleWithin(false);
    }
  };

  const handlePointerEnter = (event) => {
    if (event.pointerType === "mouse") {
      setIsHovered(true);
    }
  };

  const handlePointerLeave = (event) => {
    if (event.pointerType === "mouse") {
      setIsHovered(false);
    }
  };

  const handleCardPointerDown = (event) => {
    cardPointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handleCardClick = (event, index) => {
    // The card also acts as the drag surface for the carousel. Ignore the
    // synthetic click that follows a swipe or a click on the "view" button.
    if (event.target.closest("button")) return;

    const start = cardPointerStartRef.current;
    if (!start) return;

    const distance = Math.hypot(
      event.clientX - start.x,
      event.clientY - start.y
    );
    if (distance > 8) return;

    openLightbox(index);
  };

  const handleViewButtonClick = (event, index) => {
    event.stopPropagation();

    // Keyboard and assistive-technology clicks have no pointer movement.
    if (event.detail > 0) {
      const start = cardPointerStartRef.current;
      if (
        start &&
        Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8
      ) {
        return;
      }
    }

    openLightbox(index);
  };

  const handleDialogKeyDown = (event) => {
    if (event.key !== "Tab") return;

    const focusableElements =
      dialogRef.current?.querySelectorAll("button:not([disabled])");

    if (!focusableElements?.length) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="reviews-clients-title"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
      onKeyDown={handleSectionKeyDown}
      className="relative my-12 w-full min-w-0 overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,#ffffff_0%,#fffafb_54%,#fdf1f3_100%)] px-4 py-8 shadow-[0_30px_80px_-52px_rgba(56,24,35,0.5)] sm:my-16 sm:rounded-[36px] sm:px-6 sm:py-10 lg:px-10 lg:py-12"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#CD4354]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -right-20 h-64 w-64 rounded-full bg-[#F0A8B1]/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#CD4354]/25 to-transparent"
      />

      <div className="relative">
        <div className="flex flex-col gap-5 sm:gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#CD4354] sm:text-[11px]">
                <span
                  aria-hidden="true"
                  className="h-px w-5 bg-[#CD4354]/50"
                />
                {t("reviews_clients_eyebrow")}
              </p>
              <h2
                id="reviews-clients-title"
                className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.01em] text-[#20161a] sm:text-3xl lg:text-[34px]"
              >
                {t("reviews_clients")}
              </h2>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={showPrevious}
                aria-label={t("previous")}
                className="group flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-500 shadow-[0_8px_20px_-14px_rgba(15,23,42,0.45)] transition-all duration-300 hover:border-[#CD4354] hover:bg-[#CD4354] hover:text-white hover:shadow-[0_12px_26px_-14px_rgba(205,67,84,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD4354] focus-visible:ring-offset-2 active:scale-95 sm:h-11 sm:w-11"
              >
                <PreviousIcon
                  aria-hidden="true"
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110"
                />
              </button>
              <button
                type="button"
                onClick={showNext}
                aria-label={t("next")}
                className="group flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-500 shadow-[0_8px_20px_-14px_rgba(15,23,42,0.45)] transition-all duration-300 hover:border-[#CD4354] hover:bg-[#CD4354] hover:text-white hover:shadow-[0_12px_26px_-14px_rgba(205,67,84,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD4354] focus-visible:ring-offset-2 active:scale-95 sm:h-11 sm:w-11"
              >
                <NextIcon
                  aria-hidden="true"
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110"
                />
              </button>
            </div>
          </div>

          <p className="max-w-2xl text-[13px] leading-6 text-slate-500 sm:text-sm">
            {t("reviews_clients_subtitle")}
          </p>
        </div>

        <div className="relative mt-2 sm:mt-4">
          <Swiper
            key={`reviews-${locale}`}
            modules={[Autoplay]}
            dir={isRtl ? "rtl" : "ltr"}
            slidesPerView="auto"
            centeredSlides
            loop
            speed={SWIPER_SPEED}
            initialSlide={activeIndex}
            spaceBetween={0}
            breakpoints={{
              640: { spaceBetween: 18 },
              1024: { spaceBetween: 24 },
              1280: { spaceBetween: 28 },
            }}
            grabCursor
            autoplay={{
              delay: AUTOPLAY_DELAY,
              disableOnInteraction: false,
            }}
            onSwiper={setSwiperInstance}
            onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
            className={styles.swiper}
          >
            {REVIEW_IMAGES.map((review, index) => {
              const isActive = index === activeIndex;

              return (
                <SwiperSlide key={review.src} className={styles.slide}>
                  <article
                    onPointerDown={handleCardPointerDown}
                    onClick={(event) => handleCardClick(event, index)}
                    className={`${styles.card} ${
                      isActive ? styles.cardActive : ""
                    }`}
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -end-8 -top-10 h-28 w-28 rounded-full bg-[#CD4354]/[0.045]"
                    />

                    <div className="relative flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#CD4354]/10 text-[#CD4354]">
                          <FaQuoteRight
                            aria-hidden="true"
                            className="h-3 w-3"
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-semibold text-slate-800 sm:text-[13px]">
                            {t("reviews_client_label")}
                          </p>
                          <p className="truncate text-[10px] text-slate-600 sm:text-[11px]">
                            {t("reviews_clients_source")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="relative px-1.5 pb-2 sm:px-4 sm:pb-3">
                      <div className="relative aspect-[5/1] w-full overflow-hidden rounded-[18px] bg-[#fbfafc] ring-1 ring-slate-100 sm:rounded-2xl">
                        <Image
                          src={review.src}
                          alt={`${t("reviews_clients")} ${index + 1}`}
                          fill
                          quality={85}
                          loading="lazy"
                          draggable={false}
                          sizes="(max-width: 639px) 94vw, (max-width: 1023px) 76vw, (max-width: 1279px) 62vw, 660px"
                          className={`${styles.reviewImage} object-contain object-center`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-0.5 sm:px-5 sm:pb-3.5">
                      <span className="text-[10px] font-semibold tabular-nums tracking-[0.16em] text-slate-500">
                        {padNumber(index + 1)}
                      </span>
                      <button
                        type="button"
                        data-review-trigger={isActive ? "active" : "inactive"}
                        tabIndex={isActive ? 0 : -1}
                        onClick={(event) => handleViewButtonClick(event, index)}
                        aria-label={`${t("reviews_clients_view")} ${index + 1}`}
                        className="group/view inline-flex items-center gap-1.5 rounded-full border border-[#CD4354]/15 bg-[#CD4354]/[0.06] px-3 py-1.5 text-[10px] font-semibold text-[#B8324A] transition-colors duration-300 hover:bg-[#CD4354] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD4354] focus-visible:ring-offset-2"
                      >
                        {t("reviews_clients_view")}
                        <IoExpandOutline
                          aria-hidden="true"
                          className="h-3 w-3 transition-transform duration-300 group-hover/view:scale-110"
                        />
                      </button>
                    </div>
                  </article>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>

        <div className="relative mt-1 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:mt-2">
          <span className="hidden items-center gap-2 text-[11px] font-medium text-slate-600 sm:flex">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
              <span className="h-1.5 w-1.5 rounded-full bg-[#CD4354]" />
            </span>
            {t("reviews_clients_swipe_hint")}
          </span>

          <div className="col-start-2 flex items-center justify-center gap-0.5 sm:gap-1">
            {REVIEW_IMAGES.map((review, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={review.src}
                  type="button"
                  data-review-dot={index}
                  onClick={() => showSlide(index)}
                  aria-label={`${t("reviews_clients_go_to")} ${index + 1}`}
                  aria-current={isActive ? "true" : undefined}
                  className="group flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD4354] focus-visible:ring-offset-2"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all duration-500 ease-out ${
                      isActive
                        ? "w-6 bg-[#CD4354] sm:w-7"
                        : "w-1.5 bg-slate-300 group-hover:w-3 group-hover:bg-slate-400"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <span
            dir="ltr"
            className="col-start-3 justify-self-end text-[11px] font-medium tabular-nums text-slate-600"
          >
            <span className="text-[#20161a]">
              {padNumber(activeIndex + 1)}
            </span>
            <span aria-hidden="true" className="mx-1 text-slate-500">
              /
            </span>
            {padNumber(totalReviews)}
          </span>
        </div>
      </div>

      {activeReview && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${t("reviews_clients")} ${lightboxIndex + 1}`}
          onClick={closeLightbox}
          onKeyDown={handleDialogKeyDown}
          className={`${styles.backdrop} fixed inset-0 z-[9999] flex items-center justify-center bg-[#170d11]/90 p-4 backdrop-blur-md sm:p-8`}
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              closeLightbox();
            }}
            aria-label={t("close")}
            className="absolute end-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:end-6 sm:top-6"
          >
            <IoClose className="h-6 w-6" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              stepLightbox(-1);
            }}
            aria-label={t("previous")}
            className="absolute start-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:start-6 sm:flex"
          >
            <PreviousIcon aria-hidden="true" />
          </button>

          <div
            className={`${styles.dialogPanel} relative w-full max-w-3xl`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="overflow-hidden rounded-[22px] border border-white/15 bg-white p-1.5 shadow-2xl sm:p-2">
              <Image
                src={activeReview.src}
                alt={`${t("reviews_clients")} ${lightboxIndex + 1}`}
                width={activeReview.width}
                height={activeReview.height}
                quality={85}
                sizes="(max-width: 639px) 92vw, (max-width: 1023px) 80vw, 768px"
                className="h-auto max-h-[72vh] w-full rounded-[16px] object-contain"
              />
            </div>

            <div className="mt-4 flex items-center justify-center gap-3 sm:hidden">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  stepLightbox(-1);
                }}
                aria-label={t("previous")}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <PreviousIcon aria-hidden="true" />
              </button>
              <span className="min-w-[64px] rounded-full bg-white/10 px-3 py-1.5 text-center text-[11px] font-medium tabular-nums text-white/80">
                <span dir="ltr" className="inline-block">
                  {padNumber(lightboxIndex + 1)} / {padNumber(totalReviews)}
                </span>
              </span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  stepLightbox(1);
                }}
                aria-label={t("next")}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <NextIcon aria-hidden="true" />
              </button>
            </div>

            <div
              dir="ltr"
              className="mt-3 hidden items-center justify-center gap-2 text-[11px] font-medium tabular-nums text-white/70 sm:flex"
            >
              <span className="text-white">
                {padNumber(lightboxIndex + 1)}
              </span>
              <span aria-hidden="true" className="text-white/30">
                /
              </span>
              {padNumber(totalReviews)}
            </div>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              stepLightbox(1);
            }}
            aria-label={t("next")}
            className="absolute end-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:end-6 sm:flex"
          >
            <NextIcon aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
