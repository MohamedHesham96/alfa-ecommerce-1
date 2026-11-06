"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getRequest, postRequest } from "../../../../utils/requestsUtils";
import ProductCard from "../../components/ProductCard";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import Link from "next/link";
import { useLanguage } from "../../../../context/LanguageContext";
export default function WishList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const { t } = useLanguage();
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("id") : null;
  const { locale } = useLanguage();
  const synced = useRef(false);

  const getWishList = useCallback(async () => {
    try {
      if (userId) {
        setLoading(true);
        const response = await getRequest(`/api/users/favoriteItems`);
        setProducts(response.data.content);
      } else {
        const favoriteItems = JSON.parse(
          localStorage.getItem("favoriteItems") || "[]",
        );

        const items = await Promise.all(
          favoriteItems.map(async (item) => {
            const res = await getRequest(`/api/public/items/${item.id}`);

            return {
              ...res.data, // 👈 مهم جدًا
            };
          }),
        );
        setProducts(items);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const syncFavorite = async () => {
      try {
        if (!userId) return;
        if (synced.current) return;

        const favoriteItems = JSON.parse(
          localStorage.getItem("favoriteItems") || "[]",
        );

        if (!favoriteItems.length) return;

        await Promise.all(
          favoriteItems.map((item) =>
            postRequest(
              `/api/users/favoriteItems/${item.id}`,
              "",
              "",
            ),
          ),
        );
        getWishList();
        localStorage.removeItem("favoriteItems");

        synced.current = true; // 👈 بعد النجاح
      } catch (error) {
      }
    };

    syncFavorite();
  }, [userId, getWishList]);

  useEffect(() => {
    getWishList();
  }, [getWishList]);
  return (
    <div className="p-5  ">
      <div className="flex justify-between py-5">
        <div className="">
          <h1 className="text-4xl font-bold mb-2">{t("wishlist")} </h1>
          <span className="text-sm text-gray-500 font-semibold">
            {t("inYourList") + " " + products.length + " " + t("products")}
          </span>
        </div>
        <Link
          href="/"
          className="text-sm font-semibold text-red-600 flex items-center gap-2"
        >
          <h1>{t("continueShopping")} </h1>
          <span className="">
            {locale === "ar" ? <FaArrowLeft /> : <FaArrowRight />}
          </span>
        </Link>
      </div>
      {loading ? (
        <div className="grid xl:grid-cols-6 lg:grid-cols-4 md:grid-cols-3 xs:grid-cols-2 gap-5 ">
          {[...Array(6)].map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="h-[320px] bg-gray-100 rounded animate-pulse w-full"
            ></div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="w-full h-[400px]"></div>
      ) : (
        <div className="grid xl:grid-cols-6 lg:grid-cols-4 sm:grid-cols-3 xs:grid-cols-2 gap-5 ">
          {products.map((product, index) => {
            const productInfo = userId ? product.item : product;
            return (
              <ProductCard
                key={index}
                productInfo={productInfo}
                favorite={true}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
