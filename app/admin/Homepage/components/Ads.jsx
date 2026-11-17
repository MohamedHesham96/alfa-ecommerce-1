"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { BsMegaphone } from "react-icons/bs";
import { FaEdit, FaTrash } from "react-icons/fa";
import { IoCloudUploadSharp } from "react-icons/io5";

import { useLanguage } from "../../../../context/LanguageContext";
import AdsForm from "./AdsForm";
import {
  deleteRequest,
  getRequest,
  postRequest,
} from "../../../../utils/requestsUtils";
import { useRefresh } from "../../../../context/refreshContext.jsx";

const emptyAds = {
  ad1: { img: "", id: "" },
  ad2: { img: "", id: "" },
  ad3: { img: "", id: "" },
  ad4: { img: "", id: "" },
  ad5: { img: "", id: "" },
};

const AD_NUMBERS = [1, 2, 3, 4, 5];

function AdActions({ offerId, editLabel, deleteLabel, onEdit, onDelete }) {
  if (!offerId) return null;

  return (
    <div className="absolute end-2 top-2 z-10 flex gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#475467] shadow-sm transition-colors hover:bg-[#f8fafc] hover:text-[#1d4ed8]"
        title={editLabel}
        aria-label={editLabel}
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        <FaEdit />
      </button>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#475467] shadow-sm transition-colors hover:bg-[#fbeff2] hover:text-[#b4233a]"
        title={deleteLabel}
        aria-label={deleteLabel}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <FaTrash />
      </button>
    </div>
  );
}

export default function Ads() {
  const { refreshKey, triggerRefresh } = useRefresh();
  const { t, locale } = useLanguage();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [adNumber, setAdNumber] = useState();
  const [offerId, setOfferId] = useState();
  const [options, setOptions] = useState([]);
  const [ads, setAds] = useState(emptyAds);

  const fetchProducts = async () => {
    // Load the catalog for the product picker instead of the 10 recent
    // storefront items, which made only a handful of products selectable.
    const res = await postRequest(
      "/api/public/items/search",
      {
        page: 0,
        size: 100,
        sortBy: locale === "ar" ? "nameAr" : "nameEn",
        ascending: true,
      },
      "",
    );
    const products = res?.data?.content || res?.data || [];
    setOptions(
      products.map((product) => ({
        value: product.itemId,
        label: locale === "ar" ? product.nameAr : product.nameEn,
        product,
      })),
    );
  };

  const getAdsData = async () => {
    const res = await getRequest("/api/public/offers");
    const offers = res?.data || [];
    const nextAds = { ...emptyAds };

    offers.forEach((offer) => {
      const number = Number(offer.number);
      if (number >= 1 && number <= 5) {
        nextAds[`ad${number}`] = {
          img: offer.imageUrl,
          id: offer.offerId,
        };
      }
    });

    setAds(nextAds);
  };

  const openAdForm = (number, id) => {
    setIsFormOpen(true);
    setAdNumber(number);
    fetchProducts();
    setOfferId(id);
  };

  const handleDelete = async (id) => {
    if (!id) return;
    try {
      await deleteRequest(`/api/admin/offers/${id}`, t("message"));
      triggerRefresh();
    } catch (error) {}
  };

  useEffect(() => {
    getAdsData();
  }, [refreshKey]);

  return (
    <>
      <AdsForm
        setIsFormOpen={setIsFormOpen}
        isFormOpen={isFormOpen}
        productsOptions={options}
        adNumber={adNumber}
        offerId={offerId}
        mode={offerId ? "update" : "create"}
      />
      <section className="admin-card p-4 sm:p-5">
        <div className="admin-section-heading">
          <div>
            <h2 className="admin-section-title">
              <span className="admin-section-title-icon">
                <BsMegaphone />
              </span>
              {t("adverts")}
            </h2>
            <p className="admin-card-description">
              {t("section_storefront_content_description")}
            </p>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {AD_NUMBERS.map((number) => {
            const ad = ads[`ad${number}`];
            return (
              <div key={number} className="flex min-w-0 flex-col gap-2">
                <p className="text-xs font-semibold text-[#667085]">
                  {t(`Advert${number}`)}
                </p>
                <div
                  className="group relative h-[190px] w-full cursor-pointer overflow-hidden rounded-xl border border-[#e4e8f0] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  onClick={() => openAdForm(number, ad.id)}
                >
                  {ad.img ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={
                          process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL + ad.img
                        }
                        alt=""
                        fill
                        sizes="220px"
                        className="object-cover"
                      />
                      <AdActions
                        offerId={ad.id}
                        editLabel={t("edit")}
                        deleteLabel={t("delete")}
                        onEdit={() => openAdForm(number, ad.id)}
                        onDelete={() => handleDelete(ad.id)}
                      />
                    </div>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-transparent p-3 text-center transition-colors group-hover:border-[#cf4356] group-hover:bg-[#fdf7f8]">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f8fafc] text-lg text-[#cf4356]">
                        <IoCloudUploadSharp />
                      </span>
                      <span className="text-xs font-semibold text-[#344054]">
                        {t("click_to_upload")}
                      </span>
                      <span className="text-[10px] text-[#98a2b3]">
                        PNG, JPG or GIF
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
