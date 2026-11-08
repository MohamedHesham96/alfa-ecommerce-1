"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { BsMegaphone } from "react-icons/bs";
import { FaCirclePlus } from "react-icons/fa6";
import { FaTrash, FaEdit } from "react-icons/fa";
import { useLanguage } from "../../../../context/LanguageContext.js";
import {
  deleteRequest,
  getRequest,
} from "../../../../utils/requestsUtils.js";
import { getProductDetails, getThumbnailUrl } from "../../../../utils/functions.jsx";
import { useRefresh } from "../../../../context/refreshContext.jsx";
import ProductAdsForm from "./ProductAdsForm";

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL;
const PRODUCT_ADS_MIN_NUMBER = 6;

const resolveProductImage = (product) =>
  product?.mainImageURL || product?.images?.[0]?.imageUrl || "";

export default function ProductAds() {
  const { t, locale } = useLanguage();
  const { refreshKey, triggerRefresh } = useRefresh();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editOffer, setEditOffer] = useState(null);
  const [nextNumber, setNextNumber] = useState(PRODUCT_ADS_MIN_NUMBER);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const res = await getRequest("/api/public/offers");
      const offers = (res.data || [])
        .filter((offer) => offer.number >= PRODUCT_ADS_MIN_NUMBER)
        .sort((a, b) => a.number - b.number);

      const withProducts = await Promise.all(
        offers.map(async (offer) => {
          let product = null;
          if (offer.itemId) {
            try {
              const pRes = await getProductDetails(offer.itemId);
              product = pRes.data || null;
            } catch (error) {}
          }
          return { ...offer, product };
        })
      );
      setAds(withProducts);
      const maxNumber = offers.reduce(
        (max, offer) => Math.max(max, offer.number),
        PRODUCT_ADS_MIN_NUMBER - 1
      );
      setNextNumber(maxNumber + 1);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [refreshKey]);

  const handleDelete = async (offerId) => {
    try {
      await deleteRequest(`/api/admin/offers/${offerId}`, t("message"));
      triggerRefresh();
    } catch (error) {}
  };

  const cardImage = (ad) => {
    if (ad.imageUrl) return IMAGE_BASE_URL + ad.imageUrl;
    const url = resolveProductImage(ad.product);
    return url ? IMAGE_BASE_URL + getThumbnailUrl(url) : "";
  };

  return (
    <div className="h-full w-full">
      <ProductAdsForm
        isFormOpen={isFormOpen}
        setIsFormOpen={setIsFormOpen}
        editOffer={editOffer}
        nextNumber={nextNumber}
      />
      {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Image
            src="/Images/logo.png"
            alt=""
            className="w-[100px] h-[100px] border-t-transparent rounded-full animate-pulse"
            width={100}
            height={100}
            priority
          />
        </div>
      )}
      <div className="w-full">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-xl text-red-600">
              <BsMegaphone />
            </span>
            <h1 className="md:text-xl xs:text-lg font-semibold">{t("product_ads")}</h1>
          </div>
          <span className="text-sm text-gray-400">
            {ads.length} {t("Items")}
          </span>
        </div>

        <div className="w-full grid lg:grid-cols-5 md:grid-cols-3 xs:grid-cols-2 gap-4">
          {/* add tile */}
          <div
            className="bg-white rounded-xl min-h-[220px] h-auto w-full flex flex-col gap-3 p-4 cursor-pointer shadow-sm transition-shadow hover:shadow-md"
            onClick={() => {
              setEditOffer(null);
              setIsFormOpen(true);
            }}
          >
            <div className="border-dashed flex justify-center p-5 items-center border-2 rounded-xl border-red-400 bg-gray-50 hover:bg-gray-100 w-full h-full">
              <div
                id="label-add-product-ad"
                className="flex flex-col justify-center items-center cursor-pointer"
              >
                <span className="text-2xl bg-white p-2 rounded-full text-red-500">
                  <FaCirclePlus />
                </span>
                <span className="flex flex-col gap-2 items-center">
                  <div className="text-center text-sm">
                    <h1 className="mb-2">{t("add_product_ad")}</h1>
                  </div>
                </span>
              </div>
            </div>
          </div>

          {ads.map((ad, index) => {
            const image = cardImage(ad);
            return (
              <div
                key={ad.offerId || index}
                className="bg-white border rounded-xl overflow-hidden relative group shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative w-full h-[150px]">
                  {image ? (
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 50vw, 220px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex justify-center items-center text-gray-400 text-xs">
                      {t("no_image")}
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="bg-white p-2 rounded-full text-red-600 hover:bg-red-50 shadow"
                      title={t("edit")}
                      onClick={() => {
                        setEditOffer(ad);
                        setIsFormOpen(true);
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="bg-white p-2 rounded-full text-red-600 hover:bg-red-50 shadow"
                      title={t("delete")}
                      onClick={() => handleDelete(ad.offerId)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <div className="p-3 mt-2">
                  <h1 className="text-sm font-semibold line-clamp-1">
                    {ad.product
                      ? locale === "ar"
                        ? ad.product.nameAr || ad.product.nameEn
                        : ad.product.nameEn || ad.product.nameAr
                      : ad.title || `#${ad.itemId}`}
                  </h1>
                  <div className="flex items-center justify-between mt-1">
                   
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}