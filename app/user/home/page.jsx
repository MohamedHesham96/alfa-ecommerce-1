"use client";

// ==============================
// Imports - React / Next.js
// ==============================
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

// ==============================
// Imports - Components
// ==============================
import BestPick from "./components/BestPick";
import ImageSlider from "./components/ImageSlider";
import CategoriesSection from "./components/CategoriesSection";
import DeferredMount from "./components/DeferredMount";
import AdHeroSkeleton from "./components/skeletons/AdHeroSkeleton";
import BestPickSkeleton from "./components/skeletons/BestPickSkeleton";
import Link from "next/link";

// Everything below the hero is mounted on demand (see DeferredMount) and its
// JavaScript is split into separate chunks. This keeps the initial hydration
// focused on the header, hero, and the sections a visitor can actually see.
const ProductShowcase = dynamic(() => import("./components/ProductShowcase"));
const Top10Products = dynamic(() => import("./components/Top10Products"));
const SiteFeatures = dynamic(() => import("./components/SiteFeatures"));
const TopDiscounted = dynamic(() => import("./components/TopDiscounted"));
const ProductAdsSlider = dynamic(() => import("./components/ProductAdsSlider"));
const ReviewsClients = dynamic(() => import("./components/ReviewsClients"));
const FeaturedProducts = dynamic(() => import("./components/FeatuerProducts"));

// ==============================
// Imports - Contexts / hooks
// ==============================
import { useLanguage } from "../../../context/LanguageContext";

// ==============================
// Imports - Utilities / helpers
// ==============================
import {
  getFeatuerProducts,
  getProductDetails,
  getSliderImage,
  getTopRatedByCategory,
} from "../../../utils/functions";
import { getRequest } from "../../../utils/requestsUtils";
import { productPath } from "../../../lib/seo";

// ==============================
// Constants
// ==============================
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL;
const formatAdImageUrl = (imageUrl) => IMAGE_BASE_URL + imageUrl;

const AD_RANGE = { min: 1, max: 5 };

// id of the "Home Appliances" category used by the top products section
const HOME_APPLIANCES_CATEGORY_ID = 9;
const TOP_PRODUCTS_COUNT = 10;
const TOP_PRODUCTS_HREF = `/categories/home-appliances`;

const EMPTY_ADS = {
  ad1: {
    itemId: "",
    imageUrl: "",
  
  },
  ad2: {
    itemId: "",
    imageUrl: "",
    title: "",
    titleAr: "",

  },
  ad3: {
    itemId: "",
    imageUrl: "",
    title: "",
    titleAr: "",

  },
  ad4: {
    itemId: "",
    imageUrl: "",
    title: "",
    titleAr: "",

  },
  ad5: {
    itemId: "",
    imageUrl: "",
    title: "",
    titleAr: "",

  },
};

const buildAdsMap = (adsList = []) => {
  const adsMap = {};
  adsList.forEach((ad) => {
    if (ad.number >= AD_RANGE.min && ad.number <= AD_RANGE.max) {
      adsMap[`ad${ad.number}`] = {
        imageUrl: ad.imageUrl,
        itemId: ad.itemId,
        title: ad.title,
        titleAr: ad.titleAr,
      };
    }
  });
  return adsMap;
};

// ==============================
// Above-the-fold hero
// ==============================
// Server-rendered when slider images are provided by app/page.js. The hero
// image must not wait for the below-the-fold homepage requests.
function HomeHero({
  imagesSliders,
  ads,
  ad1Product,
  categories,
  topLast30DayItems,
  heroLoading,
  t,
  locale,
}) {
  const hasAd = Boolean(ads.ad1.imageUrl);
  const adHref = ads.ad1.itemId
    ? productPath({
        ...ad1Product,
        itemId: ads.ad1.itemId,
        nameEn: ad1Product.nameEn || ads.ad1.title,
        nameAr: ad1Product.nameAr || ads.ad1.titleAr,
      })
    : "/products";

  return (
    <div className="py-7">
      <div className="flex lg:flex-row xs:flex-col justify-around gap-4 items-center w-full">
        {/* Slider */}
        <div className="lg:w-[40%] xs:w-full">
          <ImageSlider sliderImages={imagesSliders} />
        </div>

        <div className="flex flex-col  gap-3 lg:w-[60%] xs:w-full">
          <div className="w-full h-full">
            <div className="flex md:flex-row xs:flex-col gap-3 justify-center items-center h-full  w-full">
              {heroLoading && !hasAd ? (
                <AdHeroSkeleton />
              ) : (
                <div className="group xl:w-[580px] lg:w-[500px] xs:w-full h-[350px] rounded-2xl  cursor-pointer
                text-[#EAEBB8] bg-gradient-to-b from-[#2F4D4C] via-[#263F40] to-[#0F1B1B]
                flex flex-col justify-between items-center relative overflow-hidden"
                >
                  <Link href={adHref} prefetch={false}>
                    <div className="w-full min-h-[110px] text-center p-5">
                      <span className="text-sm">{t("Special_Offer")} </span>
                      {ad1Product && (
                        <div className="flex flex-col items-center gap-2 my-3 px-4 text-center">
                          <p className="text-2xl font-semibold">
                            {locale === "ar"
                              ? ad1Product.nameAr : ad1Product.nameEn
                            }
                          </p>
                          <div className="flex items-center gap-2">

                            <span className="text-sm ">
                              {ad1Product.price?.toLocaleString("en-US")}.00{" "}
                              {t("currency")}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="w-[230px] h-[270px] group-hover:scale-105 duration-500 transition-all relative">
                      {hasAd ? (
                        <Image
                          src={formatAdImageUrl(ads.ad1.imageUrl)}
                          alt="Advertisement"
                          fill
                          sizes="230px"
                          quality={75}
                          className="object-cover"
                        />
                      ) : null}
                    </div>

                  </Link>
                </div>
              )}

              {/* Categories come from the server and must not wait for the
                  live product/offer requests. */}
              <CategoriesSection categories={categories} />
            </div>
          </div>

          {/* Best pick of the week */}
          <div>
            {heroLoading && !topLast30DayItems.length ? (
              <BestPickSkeleton />
            ) : (
              <BestPick Products={topLast30DayItems} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================
// Reusable components
// ==============================
export default function Homepage({
  initialSliderImages = [],
  initialCategories = [],
  initialOffers = [],
}) {
  // ==============================
  // Contexts and hooks
  // ==============================
  const { t, locale } = useLanguage();

  // ==============================
  // State
  // ==============================
  const [imagesSliders, setImagesSliders] = useState(initialSliderImages);
  const [categories, setCategories] = useState(initialCategories);
  const [offers, setOffers] = useState(initialOffers);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [topHomeApplianceItems, setTopHomeApplianceItems] = useState([]);
  const [mustWatchedItems, setMustWatchedItems] = useState([]);
  const [topSoldItems, setTopSoldItems] = useState([]);
  const [topDiscountedItems, setTopDiscountedItems] = useState([]);
  const [topLast30DayItems, setTopLast30DayItems] = useState([]);
  const [items, setItems] = useState();
  const [topRatingItems, setTopRatingItems] = useState();
  const [recentWatchedProducts, setRecentWatchedProducts] = useState([]);
  const [ads, setAds] = useState(() => ({
    ...EMPTY_ADS,
    ...buildAdsMap(initialOffers),
  }));
  const [ad1Product, setAd1Product] = useState({
    nameEn: "",
    nameAr: "",
    brand: "",
  });
  const [ad3Product, setAd3Product] = useState({
    name: "",
    brand: "",
  });
  const [ad4Product, setAd4Product] = useState({
    name: "",
    brand: "",
  });
  const [ad5Product, setAd5Product] = useState({
    name: "",
    brand: "",
  });
  // The hero has its own skeleton so it never waits for the eight
  // below-the-fold catalogue requests. Prices are always fetched live.
  const [heroLoading, setHeroLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestIdRef = useRef(0);
  const offersRef = useRef(initialOffers);
  const slidersRef = useRef(initialSliderImages);
  const categoriesRef = useRef(initialCategories);
  const [productType, setProductType] = useState("mustWatchedItems");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const isLoggedInRef = useRef(false);

  // ==============================
  // API / data fetching logic
  // ==============================
  const fetchHomepageData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const isStale = () => requestId !== requestIdRef.current;

    const safeRequest = async (label, request, fallback) => {
      try {
        return await request();
      } catch (err) {
        console.error(`Failed to fetch ${label}:`, err);
        return fallback;
      }
    };

    const EMPTY_CONTENT = { data: { content: [] } };
    const EMPTY_LIST = { data: [] };

    try {
      setError(false);
      setHeroLoading(true);
      setContentLoading(true);

      // app/page.js already provides the server-rendered slider. Only fall
      // back to a client request when the server could not load it.
      if (!slidersRef.current.length) {
        safeRequest("sliderImages", () => getSliderImage(), []).then((sliderRes) => {
          if (isStale() || !sliderRes?.length) return;
          slidersRef.current = sliderRes;
          setImagesSliders(sliderRes);
        });
      }

      let offersList = offersRef.current;
      if (!offersList.length) {
        const adsRes = await safeRequest(
          "offers",
          () => getRequest("/api/public/offers"),
          EMPTY_LIST,
        );
        if (isStale()) return;
        offersList = adsRes?.data || [];
        offersRef.current = offersList;
        setOffers(offersList);
        setAds((prev) => ({ ...prev, ...buildAdsMap(offersList) }));
      }

      const fetchAdProduct = async (number) => {
        const itemId = offersList.find((ad) => ad.number === number)?.itemId;

        if (!itemId) return null;

        const res = await safeRequest(
          `ad${number} product`,
          () => getProductDetails(itemId),
          null,
        );

        return res?.data || null;
      };

      // Hero data: offer images (server-provided), live ad prices, and the
      // best-pick prices. Keeping prices client-side avoids stale pricing.
      const heroPromise = (async () => {
        const [ad1, ad3, ad4, ad5, last30] = await Promise.all([
          fetchAdProduct(1),
          fetchAdProduct(3),
          fetchAdProduct(4),
          fetchAdProduct(5),
          safeRequest(
            "topRatedLast30Days",
            () => getRequest("/api/public/items/topRated/last30Days"),
            EMPTY_CONTENT,
          ),
        ]);

        if (isStale()) return;

        if (ad1) setAd1Product(ad1);

        [ad3, ad4, ad5].forEach((adProduct, index) => {
          if (!adProduct) return;

          const setter = [setAd3Product, setAd4Product, setAd5Product][index];

          setter((prev) => ({
            ...prev,
            brand: adProduct.brand || null,
            name: adProduct.nameEn || null,
            seoCode: adProduct.seoCode || null,
            itemId: adProduct.itemId || null,
          }));
        });

        setTopLast30DayItems(last30?.data?.content || []);
      })();

      await heroPromise;
      if (isStale()) return;
      setHeroLoading(false);

      // Start below-the-fold catalogue requests only after the hero is ready
      // so they do not compete with the LCP image and hero text.
      const [
        categoryRes,
        productsRes,
        newProductsRes,
        topHomeApplianceItemsRes,
        topRatingProductsRes,
        mustWatchedRes,
        topDiscountedRes,
        soldItemRes,
        recentWatchedProductsRes,
      ] = await Promise.all([
        categoriesRef.current.length
          ? Promise.resolve(null)
          : safeRequest(
              "itemCategory",
              () => getRequest("/api/public/itemCategory/latest"),
              EMPTY_LIST,
            ),
        safeRequest("featuredProducts", () => getFeatuerProducts(12), EMPTY_CONTENT),
        safeRequest("recentItems", () => getRequest("/api/public/items/recent"), EMPTY_LIST),
        safeRequest(
          "topRatedByCategory",
          () => getTopRatedByCategory(HOME_APPLIANCES_CATEGORY_ID, TOP_PRODUCTS_COUNT),
          [],
        ),
        safeRequest("topRated", () => getRequest("/api/public/items/topRated"), EMPTY_CONTENT),
        safeRequest("topWatched", () => getRequest("/api/public/items/topWatched"), EMPTY_CONTENT),
        safeRequest("topDiscounted", () => getRequest("/api/public/items/topDiscounted"), EMPTY_CONTENT),
        safeRequest("topSold", () => getRequest("/api/public/items/topSold"), EMPTY_CONTENT),
        isLoggedInRef.current
          ? safeRequest(
              "recentWatchedItems",
              () => getRequest("/api/users/recentWatchedItems"),
              EMPTY_LIST,
            )
          : Promise.resolve(EMPTY_LIST),
      ]);

      if (isStale()) return;

      if (categoryRes?.data) {
        categoriesRef.current = categoryRes.data;
        setCategories(categoryRes.data);
      }
      setFeaturedProducts(productsRes?.data?.content || []);
      setNewProducts(newProductsRes?.data || []);
      setTopHomeApplianceItems(topHomeApplianceItemsRes || []);

      const topRatedContent = topRatingProductsRes?.data?.content || [];
      setItems(mustWatchedRes?.data?.content);
      setTopRatingItems(topRatedContent);

      setMustWatchedItems(mustWatchedRes?.data?.content || []);
      setTopDiscountedItems(topDiscountedRes?.data?.content || []);
      setTopSoldItems(soldItemRes?.data?.content || []);
      setRecentWatchedProducts(recentWatchedProductsRes?.data || []);
    } catch (err) {
      console.error("Failed to fetch homepage data:", err);
      if (!isStale()) setError(true);
    } finally {
      if (!isStale()) {
        setHeroLoading(false);
        setContentLoading(false);
      }
    }
  }, []);

  // ==============================
  // Event handlers
  // ==============================
  const handleShowPopularProducts = () => {
    setItems(topRatingItems);
    setProductType("popularProducts");
  };
  const handleShowTopSoldItems = () => {
    setItems(topSoldItems);
    setProductType("topSoldItems");
  };
  const handleShowMustWatchedItems = () => {
    setItems(mustWatchedItems);
    setProductType("mustWatchedItems");
  };

  // ==============================
  // useEffect
  // ==============================
  useEffect(() => {
    const loggedIn = Boolean(localStorage.getItem("id"));

    isLoggedInRef.current = loggedIn;
    setIsLoggedIn(loggedIn);
  }, []);

  useEffect(() => {
    fetchHomepageData();

    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchHomepageData]);

  // Return / JSX
  // ==============================
  return (
    <div className="w-full px-3 ">
      {error && (
        <div className="w-full flex justify-center items-center gap-3 py-5 text-sm text-red-600">
          <span>{t("home_load_error")}</span>
          <button
            type="button"
            onClick={fetchHomepageData}
            className="rounded-full bg-[#CD4354] hover:bg-[#c13b4a] text-white px-4 py-1.5 font-semibold"
          >
            {t("try_again")}
          </button>
        </div>
      )}

      <HomeHero
        imagesSliders={imagesSliders}
        ads={ads}
        ad1Product={ad1Product}
        categories={categories}
        topLast30DayItems={topLast30DayItems}
        heroLoading={heroLoading}
        t={t}
        locale={locale}
      />

      {contentLoading ? (
        // The hero is already visible. A full skeleton grid here added hundreds
        // of DOM nodes to hydrate for content the visitor cannot see yet.
        <div
          className="w-full min-h-[3200px] flex items-start justify-center pt-16"
          aria-busy="true"
          aria-live="polite"
        >
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#CD4354] border-t-transparent" />
        </div>
      ) : (
        <DeferredMount minHeight={1600}>
        <>

      {/* ========================= Site Features ========================= */}
      <SiteFeatures />

      {/* ========================= Featured Products ========================= */}
      <div className=" flex lg:flex-row xs:flex-col my-10 gap-5 items-start w-full mt-20">
        <div className="xs:order-2 lg:order-1 flex flex-col xs:w-full lg:w-auto items-center gap-5">
          {/* بتظهر للمتسجلين دخول بس */}
          {isLoggedIn && (
            <ProductShowcase Products={recentWatchedProducts} title={"recentViewed"} />
          )}
          <div className="w-full lg:flex-col sm:flex-row xs:flex-col flex gap-5">
            <div className="bg-white mt-2 lg:w-[280px] xs:w-full h-[660px] rounded-3xl relative overflow-hidden">
              {ads.ad2.imageUrl && (
                <Image
                  src={IMAGE_BASE_URL + ads.ad2.imageUrl}
                  alt="Advertisement"
                  fill
                  sizes="280px"
                  quality={75}
                  className="object-cover"
                />
              )}
            </div>
            <section id="newProducts" className="w-full">
              <div className="w-full h-[660px] ">
                <ProductShowcase Products={newProducts} title={"latest_products"} />
              </div>
            </section>
          </div>
        </div>
        <section className="w-full min-w-0 xs:order-1 lg:order-2">
          <div className="w-full flex xl:flex-row xs:flex-col justify-between items-center gap-2">
            <div className="w-full">
              <h2 className="flex items-center font-semibold gap-2 text-2xl mb-1">
                {t("featured_products")}
              </h2>
              {/* <hr className="w-24 h-1 border-0 rounded-full bg-gradient-to-l from-red-200 via-red-400 to-red-200" /> */}
            </div>
            <div className="flex items-center gap-5 xl:justify-end xs:justify-start w-full md:text-sm xl:text-base  font-semibold">
            <button
                className={`items-center  justify-center rounded-full p-1  hover:text-red-600 hover:scale-105 duration-200 ${productType === "mustWatchedItems" ?"text-red-600" : "text-black"}`}
                onClick={handleShowMustWatchedItems}
              >
                {t("Most_viewed_products")}
              </button>
              <button
                className={` items-center justify-center rounded-full p-1  hover:text-red-600 hover:scale-105 ${productType === "popularProducts" ?"text-red-600" : "text-black"} duration-200`}
                onClick={handleShowPopularProducts}
              >
                {t("popular_products")}
              </button>

              <button
                className={`items-center  justify-center rounded-full p-1  hover:text-red-600 hover:scale-105 duration-200 ${productType === "topSoldItems" ?"text-red-600" : "text-black"}`}
                onClick={handleShowTopSoldItems}
              >
                {t("Top_selling")}
              </button>
              
            </div>
          </div>

          <div className="xs:mt-6 md:mt-5">
            <FeaturedProducts Products={items || []} type={"FeaturedProducts"} />
            <TopDiscounted Products={topDiscountedItems || []} />

          </div>
          <div className="flex xl:flex-row xs:flex-col mt-10 gap-5 justify-between  items-start w-full">
            <div className="w-full max-w-[670px] xl:max-w-none h-[500px] bg-white rounded-3xl">
              <ProductAdsSlider offers={offers} />
            </div>
            <div className="flex flex-col items-center gap-5 w-full">
              <Top10Products
                Products={topHomeApplianceItems}
                section={"top_appliances"}
                href={TOP_PRODUCTS_HREF}
              />
            </div>

          </div>
        </section>
      </div>
        </>
        </DeferredMount>
      )}

      {contentLoading ? null : (
        <DeferredMount minHeight={1600}>
        <>

      {/* ========================= Promo Banner ========================= */}
      <section className="my-32">
        <div className="w-full flex flex-col md:flex-row lg:justify-between items-stretch gap-5">
          <div className="group cursor-pointer w-full flex flex-col justify-center items-center h-[500px] bg-white rounded-3xl  overflow-hidden p-5">
            {ads.ad3.imageUrl ? (
              <div className="w-full h-2/3 relative group-hover:scale-105 duration-500 transition-all">

                <Image
                  src={IMAGE_BASE_URL + ads.ad3.imageUrl}
                  alt="Advertisement"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  quality={75}
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-full" />
            )}
            <div className="flex flex-col justify-around items-center w-full">
              <h2 className="text-3xl font-bold">{ad3Product.brand} </h2>

              <h2 className=" text-center my-3">{locale === "ar" ? ads.ad3.titleAr : ads.ad3.title} </h2>
             <Link prefetch={false} className={ads.ad3.itemId ? "block" : "hidden"} href={productPath({...ad3Product, itemId: ads.ad3.itemId})}><button  className="text-white rounded-full bg-[#CD4354] hover:bg-[#c13b4a] w-[120px] py-3 px-5 mt-2 text-sm font-semibold ">{t("buyNow")} </button></Link>
            </div>

          </div>
          <div className="group cursor-pointer text-white w-full flex flex-col justify-center items-center h-[500px] bg-black rounded-3xl  overflow-hidden p-5">
            {ads.ad4.imageUrl ? (
              <div className="w-full h-2/3 relative group-hover:scale-105 duration-500 transition-all">
                <Image
                  src={IMAGE_BASE_URL + ads.ad4.imageUrl}
                  alt="Advertisement"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  quality={75}
                  className="object-cover"
                />
              </div>

            ) : (
              <div className="w-full h-full" />
            )}
            <div className="flex flex-col justify-around items-center w-full">
              <h2 className="text-3xl font-bold">{ad4Product.brand} </h2>

              <h2 className=" text-center my-3">{locale === "ar" ? ads.ad4.titleAr : ads.ad4.title} </h2>
             <Link prefetch={false} className={ads.ad4.itemId ? "block" : "hidden"} href={productPath({...ad4Product, itemId: ads.ad4.itemId})}><button  className="text-white rounded-full bg-[#CD4354] hover:bg-[#c13b4a] w-[120px] py-3 px-5 mt-2 text-sm font-semibold ">{t("buyNow")} </button></Link>
            </div>
          </div>
          <div className="group cursor-pointer w-full flex flex-col justify-center items-center h-[500px] bg-white rounded-3xl  overflow-hidden p-5">
            {ads.ad5.imageUrl ? (
              <div className="w-full h-2/3 relative group-hover:scale-105 duration-500 transition-all">

                <Image
                  src={IMAGE_BASE_URL + ads.ad5.imageUrl}
                  alt="Advertisement"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  quality={75}
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-full" />
            )}
            <div className="flex flex-col justify-around items-center w-full">
              <h2 className="text-3xl font-bold">{ad5Product.brand} </h2>

              <h2 className=" text-center my-3">{locale === "ar" ? ads.ad5.titleAr : ads.ad5.title} </h2>
             <Link prefetch={false} className={ads.ad5.itemId ? "block" : "hidden"} href={productPath({...ad5Product, itemId: ads.ad5.itemId})}><button  className="text-white rounded-full bg-[#CD4354] hover:bg-[#c13b4a] w-[120px] py-3 px-5 mt-2 text-sm font-semibold ">{t("buyNow")} </button></Link>
            </div>

          </div>
        </div>
      </section>

      {/* ========================= More Recommended Products ========================= */}
      <section id="newProducts" className="w-full  mt-20">
        <div className="w-full flex justify-between items-center">

          <div>
            <h2 className="flex items-center font-semibold gap-2 xs:text-base md:text-xl mb-1">
              {t("morerecommendedproducts")}
            </h2>
            {/* <hr className="w-24 h-1 border-0 rounded-full bg-gradient-to-l from-red-200 via-red-400 to-red-200" /> */}
          </div>
          <div className="text-xs font-semibold">
            <Link prefetch={false} href="/user/products/section/morerecommendedproducts">{t("shopMore")} </Link>
            <hr className="bg-red-500 h-[2px] border-none w-auto " />
          </div>

        </div>

        <div className="my-10">
          <FeaturedProducts Products={featuredProducts || []} type={"MoreRecommended"} />
        </div>
      </section>
      <ReviewsClients/>
        </>
        </DeferredMount>
      )}
    </div>
  );
}
