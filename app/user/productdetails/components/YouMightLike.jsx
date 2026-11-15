"use client";
import ProductCard from "../../components/ProductCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import { postRequest } from "../../../../utils/requestsUtils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../../../context/LanguageContext";

// Stable identity so an omitted prop never re-triggers the sync effect.
const EMPTY_PRODUCTS = [];

export default function YouMightLike({
  categoryId,
  initialProducts = EMPTY_PRODUCTS,
  excludeItemId = null,
}) {
  const { t, locale } = useLanguage();

  const provided = useMemo(
    () =>
      (Array.isArray(initialProducts) ? initialProducts : []).filter(
        (product) => product?.itemId !== excludeItemId,
      ),
    [initialProducts, excludeItemId],
  );

  const [products, setProducts] = useState(provided);

  useEffect(() => {
    setProducts(provided);
  }, [provided]);

  const getProductsByCategory = useCallback(async () => {
    if (categoryId == null) return;
    try {
      const response = await postRequest(
        "/api/public/items/search",
        {
          page: 0,
          size: 20,
          categoryId,
        },
        "",
      );
      const content = response?.data?.content || [];
      setProducts(
        content
          .filter((product) => product?.itemId !== excludeItemId)
          .slice(0, 12),
      );
    } catch (error) {
      console.log(error);
    }
  }, [categoryId, excludeItemId]);

  useEffect(() => {
    // The server already rendered a related list; only fetch when it did not.
    if (provided.length > 0) return;
    getProductsByCategory();
  }, [provided.length, getProductsByCategory]);

  if (products.length === 0) return null;

  return (
    <div className=" bg-[#f6f5f8] py-8 sm:py-10">
      <h2 className="mb-4 flex items-center gap-3 text-lg font-bold text-gray-900 sm:text-xl md:text-2xl">
        {t("You_might_like")}
      </h2>

      <div className="">
        <Swiper
          key={locale}
          slidesPerView={"auto"}
          modules={[Navigation, Autoplay]}
          navigation={{
            nextEl: ".next-btn1",
            prevEl: ".prev-btn1",
          }}
          dir={locale === "ar" ? "rtl" : "ltr"}
          spaceBetween={10}
          className="w-full h-full   "
        >
          {products.map((product) => {
            return (
              <SwiperSlide
                key={product.itemId}
                className=" my-5 !w-[220px] rounded-lg select-none"
              >
                <div className="rounded-lg  flex justify-center  cursor-pointer">
                  <ProductCard productInfo={product} favorite={false} />
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </div>
  );
}
