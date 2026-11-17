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
import {
  getProductDetails,
  getThumbnailUrl,
} from "../../../../utils/functions.jsx";
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
        }),
      );
      setAds(withProducts);
      const maxNumber = offers.reduce(
        (max, offer) => Math.max(max, offer.number),
        PRODUCT_ADS_MIN_NUMBER - 1,
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
    <section className="admin-card p-4 sm:p-5">
      <ProductAdsForm
        isFormOpen={isFormOpen}
        setIsFormOpen={setIsFormOpen}
        editOffer={editOffer}
        nextNumber={nextNumber}
      />
      {loading && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--admin-overlay-strong)]/55 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-[var(--admin-surface)] px-8 py-6 shadow-2xl">
            <span className="admin-spinner !h-7 !w-7" />
            <p className="text-sm font-semibold text-[var(--admin-ink-soft)]">
              {t("loading")}
            </p>
          </div>
        </div>
      )}

      <div className="admin-section-heading">
        <div>
          <h2 className="admin-section-title">
            <span className="admin-section-title-icon">
              <BsMegaphone />
            </span>
            {t("product_ads")}
          </h2>
          <p className="admin-card-description">
            {t("section_storefront_content_description")}
          </p>
        </div>
        <span className="admin-badge admin-badge-gray">
          {ads.length} {t("Items")}
        </span>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <button
          type="button"
          className="group flex min-h-[220px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--admin-border-strong)] bg-[var(--admin-surface-muted)] p-4 text-center transition-colors hover:border-[var(--admin-accent)] hover:bg-[var(--admin-danger-soft)]"
          onClick={() => {
            setEditOffer(null);
            setIsFormOpen(true);
          }}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--admin-surface)] text-lg text-[var(--admin-accent)] shadow-sm transition-transform group-hover:scale-105">
            <FaCirclePlus />
          </span>
          <span className="text-sm font-semibold text-[var(--admin-ink-soft)]">
            {t("add_product_ad")}
          </span>
        </button>

        {ads.map((ad, index) => {
          const image = cardImage(ad);
          return (
            <div
              key={ad.offerId || index}
              className="group relative overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative h-[150px] w-full">
                {image ? (
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 50vw, 220px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[var(--admin-surface-muted)] text-xs text-[var(--admin-muted-soft)]">
                    {t("no_image")}
                  </div>
                )}
                <div className="absolute end-2 top-2 flex gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--admin-surface)] text-[var(--admin-ink-soft)] shadow-sm transition-colors hover:bg-[var(--admin-surface-muted)] hover:text-[var(--admin-info-text)]"
                    title={t("edit")}
                    onClick={() => {
                      setEditOffer(ad);
                      setIsFormOpen(true);
                    }}
                  >
                    <FaEdit />
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--admin-surface)] text-[var(--admin-ink-soft)] shadow-sm transition-colors hover:bg-[var(--admin-danger-soft)] hover:text-[var(--admin-danger-text)]"
                    title={t("delete")}
                    onClick={() => handleDelete(ad.offerId)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="line-clamp-1 text-sm font-semibold text-[var(--admin-ink)]">
                  {ad.product
                    ? locale === "ar"
                      ? ad.product.nameAr || ad.product.nameEn
                      : ad.product.nameEn || ad.product.nameAr
                    : ad.title || `#${ad.itemId}`}
                </p>
                <p className="mt-1 text-xs text-[var(--admin-muted)]">
                  {t("product_ads")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
