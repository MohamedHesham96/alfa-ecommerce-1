"use client";

import Skeleton from "./Skeleton";
import ProductGridSkeleton from "./ProductGridSkeleton";
import CategorySkeleton from "./CategorySkeleton";
import SectionHeaderSkeleton from "./SectionHeaderSkeleton";
import ProductShowcaseSkeleton from "./ProductShowcaseSkeleton";
import Top10ProductsSkeleton from "./Top10ProductsSkeleton";
import BestPickSkeleton from "./BestPickSkeleton";
import ProductAdsSliderSkeleton from "./ProductAdsSliderSkeleton";
import TopDiscountedSkeleton from "./TopDiscountedSkeleton";
import SiteFeaturesSkeleton from "./SiteFeaturesSkeleton";
import AdHeroSkeleton from "./AdHeroSkeleton";
import PromoBannerSkeleton from "./PromoBannerSkeleton";

export default function HomeSkeleton({ showRecentViewed = false, showHero = true }) {
  return (
    <div className="w-full lg:px-3 xs:px-0" aria-busy="true" aria-live="polite">
      {showHero ? (
        <div className="py-7">
          <div className="flex lg:flex-row xs:flex-col justify-around gap-4 items-center w-full">
            <div className="lg:w-[40%] xs:w-full">
              <Skeleton className="w-full lg:h-[530px] xs:h-[470px] rounded-3xl" />
            </div>

            <div className="flex flex-col gap-3 lg:w-[60%] xs:w-full">
              <div className="w-full h-full">
                <div className="flex md:flex-row xs:flex-col gap-3 justify-center items-center h-full w-full">
                  <AdHeroSkeleton />
                  <CategorySkeleton />
                </div>
              </div>

              <div>
                <BestPickSkeleton />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ========================= Site Features ========================= */}
      <SiteFeaturesSkeleton />

      {/* ========================= Featured Products ========================= */}
      <div className="flex lg:flex-row xs:flex-col my-10 gap-5 items-start w-full mt-20">
        {/* Recently viewed + ad2 + latest products */}
        <div className="xs:order-2 lg:order-1 flex flex-col xs:w-full lg:w-auto items-center gap-5">
          {showRecentViewed && <ProductShowcaseSkeleton rows={5} />}

          <div className="w-full lg:flex-col sm:flex-row xs:flex-col flex gap-5">
            <div className="bg-white mt-2 lg:w-[280px] xs:w-full h-[660px] rounded-3xl relative overflow-hidden">
              <Skeleton className="absolute inset-0 w-full h-full rounded-3xl" />
            </div>

            <section className="w-full">
              <div className="w-full h-[660px]">
                <ProductShowcaseSkeleton rows={7} />
              </div>
            </section>
          </div>
        </div>

        {/* Featured + top discounted + product ads + top 10 */}
        <section className="w-full xs:order-1 lg:order-2">
          <div className="w-full flex xl:flex-row xs:flex-col justify-between items-center gap-2">
            <Skeleton className="h-6 w-64" />
            <div className="flex items-center gap-5 font-semibold">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          <div className="xs:mt-6 md:mt-5">
            <ProductGridSkeleton
              count={10}
              className="grid xl:grid-cols-5 sm:grid-cols-3 xs:grid-cols-2 gap-5"
            />
            <TopDiscountedSkeleton />
          </div>

          <div className="flex xl:flex-row xs:flex-col mt-10 gap-5 justify-between items-start w-full">
            <div className="md:w-[670px] xs:w-full h-[500px] bg-white rounded-3xl relative overflow-hidden">
              <ProductAdsSliderSkeleton />
            </div>

            <div className="w-full">
              <Top10ProductsSkeleton />
            </div>
          </div>
        </section>
      </div>

      {/* ========================= Promo Banners ========================= */}
      <section className="my-32">
        <div className="w-full flex flex-col md:flex-row lg:justify-between items-stretch gap-5">
          <PromoBannerSkeleton />
          <PromoBannerSkeleton tone="dark" />
          <PromoBannerSkeleton />
        </div>
      </section>

      {/* ========================= More Recommended Products ========================= */}
      <section className="w-full pb-20 mt-20">
        <div className="w-full flex justify-between items-center">
          <Skeleton className="h-6 xs:w-40 md:w-64" />
          <div className="flex flex-col items-end gap-1">
            <Skeleton className="h-3 w-16" />
            <hr className="bg-gray-200 h-[2px] border-none w-16" />
          </div>
        </div>

        <div className="mt-10">
          <ProductGridSkeleton
            count={12}
            className="grid xl:grid-cols-6 lg:grid-cols-4 md:grid-cols-3 xs:grid-cols-2 gap-5"
          />
        </div>
      </section>
    </div>
  );
}
