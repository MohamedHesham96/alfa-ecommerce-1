"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { TfiLayoutSliderAlt } from "react-icons/tfi";
import { IoCloudUploadSharp } from "react-icons/io5";
import { FaEdit, FaTrash } from "react-icons/fa";

import { useLanguage } from "../../../../context/LanguageContext.js";
import "swiper/css";
import "swiper/css/pagination";
import LivePreview from "./LivePreview.jsx";
import { deleteRequest } from "../../../../utils/requestsUtils.js";
import {
  getSliderImage,
  getThumbnailUrl,
} from "../../../../utils/functions.jsx";
import { useRefresh } from "../../../../context/refreshContext.jsx";

export default function Sliders({ setIsFormOpen, setEditingSlider }) {
  const { t } = useLanguage();
  const [sliderImages, setSliderImages] = useState([]);
  const { refreshKey } = useRefresh();
  const [loading, setLoading] = useState();

  const getSliderImages = async () => {
    const res = await getSliderImage();
    setSliderImages(Array.isArray(res) ? res : []);
  };

  const deleteSlideImage = async (deletedSliderImageId) => {
    try {
      setLoading(true);
      const res = await deleteRequest(
        `/api/admin/sliderImages/${deletedSliderImageId}`,
        t("message"),
      );
      // `deleteRequest` resolves with no value when the user cancels the
      // confirmation dialog; don't refetch in that case.
      if (!res) return;
      await getSliderImages();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSliderImages();
  }, [refreshKey]);

  return (
    <section className="admin-card p-4 sm:p-5">
      {loading && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#060f1c]/55 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-8 py-6 shadow-2xl">
            <span className="admin-spinner !h-7 !w-7" />
            <p className="text-sm font-semibold text-[#475467]">
              {t("loading")}
            </p>
          </div>
        </div>
      )}

      <div className="admin-section-heading">
        <div>
          <h2 className="admin-section-title">
            <span className="admin-section-title-icon">
              <TfiLayoutSliderAlt />
            </span>
            {t("sliders")}
          </h2>
          <p className="admin-card-description">
            {t("section_storefront_content_description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-livePreview"
            type="button"
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={() => {
              const LivePreview = document.querySelector("#LivePreview");
              LivePreview.classList.remove("hidden");
              LivePreview.classList.add("flex");
              const btn_hide = document.querySelector("#btn-hide");
              btn_hide.classList.remove("hidden");
              const btn_livePreview =
                document.querySelector("#btn-livePreview");
              btn_livePreview.classList.add("hidden");
            }}
          >
            {t("live_previwe")}
          </button>
          <button
            id="btn-hide"
            type="button"
            className="admin-btn admin-btn-secondary admin-btn-sm hidden"
            onClick={() => {
              const btn_hide = document.querySelector("#btn-hide");
              btn_hide.classList.add("hidden");
              const btn_livePreview =
                document.querySelector("#btn-livePreview");
              btn_livePreview.classList.remove("hidden");
              const LivePreview = document.querySelector("#LivePreview");
              LivePreview.classList.add("hidden");
              LivePreview.classList.remove("flex");
            }}
          >
            {t("hide")}
          </button>
        </div>
      </div>

      <div
        id="LivePreview"
        className="mb-6 hidden w-full items-center justify-center"
      >
        <LivePreview sliderImages={sliderImages} />
      </div>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <button
          type="button"
          className="group flex h-[190px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#d3d9e5] bg-[#f8fafc] p-4 text-center transition-colors hover:border-[#cf4356] hover:bg-[#fdf7f8]"
          onClick={() => {
            setEditingSlider(null);
            setIsFormOpen(true);
          }}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg text-[#cf4356] shadow-sm transition-transform group-hover:scale-105">
            <IoCloudUploadSharp />
          </span>
          <span className="text-xs font-semibold text-[#344054]">
            {t("click_to_upload")}
          </span>
          <span className="text-[10px] text-[#98a2b3]">PNG, JPG or GIF</span>
        </button>

        {sliderImages.map((img, index) => {
          const editSlider = () => {
            setEditingSlider(img);
            setIsFormOpen(true);
          };

          return (
            <div
              key={img.sliderImageId ?? index}
              className="group relative h-[190px] w-full overflow-hidden rounded-xl border border-[#e4e8f0] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <button
                type="button"
                title={t("edit")}
                className="relative flex h-full w-full items-center justify-center overflow-hidden"
                onClick={editSlider}
              >
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${getThumbnailUrl(
                    img.imageUrl,
                  )}`}
                  alt=""
                  fill
                  sizes="220px"
                  className="object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#060f1c]/70 to-transparent p-3 text-start text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {t("edit")}
                </span>
              </button>
              <div className="absolute end-2 top-2 z-10 flex gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <button
                  type="button"
                  title={t("edit")}
                  aria-label={t("edit")}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#475467] shadow-sm transition-colors hover:bg-[#f8fafc] hover:text-[#1d4ed8]"
                  onClick={editSlider}
                >
                  <FaEdit />
                </button>
                <button
                  type="button"
                  title={t("delete")}
                  aria-label={t("delete")}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#475467] shadow-sm transition-colors hover:bg-[#fbeff2] hover:text-[#b4233a]"
                  onClick={() => deleteSlideImage(img.sliderImageId)}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
