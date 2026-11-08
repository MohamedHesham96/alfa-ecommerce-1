"use client";
import { TfiLayoutSliderAlt } from "react-icons/tfi";
import { IoCloudUploadSharp } from "react-icons/io5";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useLanguage } from "../../../../context/LanguageContext.js";
import { FaEdit, FaTrash } from "react-icons/fa";
import "swiper/css";
import "swiper/css/pagination";
import LivePreview from "./LivePreview.jsx";

import {
  deleteRequest,
} from "../../../../utils/requestsUtils.js";
import {
  getSliderImage,
  getThumbnailUrl,
} from "../../../../utils/functions.jsx";
import { useRefresh } from "../../../../context/refreshContext.jsx";

export default function Sliders({setIsFormOpen, setEditingSlider}) {
  const { t } = useLanguage();
  const [sliderImages, setSliderImages] = useState([]);
  const { refreshKey } = useRefresh();

  const [loading, setLoading] = useState();

  const getSliderImages = async () => {
    const res = await getSliderImage();
    setSliderImages(res);
  };

 

  const deleteSlideImage = async (deletedSliderImageId) => {
    try {
          setLoading(true);

      const res = await deleteRequest(
        `/api/admin/sliderImages/${deletedSliderImageId}`,
        t("message")
      );
      getSliderImages();
    } catch (error) {
    }finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSliderImages();
  }, [refreshKey]);

  return (
    <div className="h-full w-full p-5">
      {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Image
            src="/Images/logo.png"
            alt=""
            className="w-[100px] h-[100px]  border-t-transparent rounded-full animate-pulse"
            width={100}
            height={100}
            priority
          />
        </div>
      )}
      <div className=" w-[100%] ">
        <div className="flex items-center justify-between  gap-2 mb-3 ">
          <div className="flex items-center gap-3">
            <span className="text-xl text-red-600">
              <TfiLayoutSliderAlt />
            </span>
            <h1 className="md:text-xl xs:text-lg font-semibold ">{t("sliders")}</h1>
          </div>
          <button
            id="btn-livePreview"
            className="p-2  bg-[#CD4354] text-white hover:bg-red-300 text-sm rounded-md"
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
            className="hidden p-2 bg-red-600 text-white hover:bg-red-300 text-sm rounded-md"
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
        <div
          id="LivePreview"
          className=" hidden  justify-center items-center mb-10 w-full"
        >
          <LivePreview sliderImages={sliderImages} />
          {/* <div className="grid lg:grid-cols-4 xs:grid-cols-1 w-full justify-between items-center gap-5"> */}
        </div>

        {/* </div> */}
      </div>
      <div className="w-full grid lg:grid-cols-5 md:grid-cols-3  xs:grid-cols-2 gap-3  ">
        <div className="bg-white  rounded-3xl min-h-[170px] h-auto w-full flex flex-col gap-3 p-4 cursor-pointer">
          <div className=" border-dashed flex justify-center p-5 items-center border-2 rounded-3xl border-red-400 bg-gray-50  hover:bg-gray-100 w-full h-full "
          onClick={()=>{
            setEditingSlider(null)
            setIsFormOpen(true)
          }}
          >
            <label >
              <div
                id="label-uplod"
                className="flex flex-col justify-center items-center cursor-pointer"
              >
                <span className="text-2xl bg-white p-2 rounded-full text-red-500">
                  <IoCloudUploadSharp />
                </span>
                <span className="flex flex-col gap-2 items-center">
                  <div className="text-center text-sm">
                    <h1 className="mb-2">{t("click_to_upload")}</h1>
                    <h2 className="text-[10px] text-gray-500">
                      PNG, JPG or GIF
                    </h2>
                  </div>
                </span>
              </div>
            </label>

            {/* <input
              type="file"
              accept="image/*"
              // onChange={handelupload}
              className="hidden"
              id="fileInput"
            /> */}
          </div>
        </div>
        {sliderImages.map((img, index) => {
          const editSlider = () => {
            setEditingSlider(img);
            setIsFormOpen(true);
          };

          return (
            <div
              key={img.sliderImageId ?? index}
              className="relative bg-white h-[170px] p-2 rounded-3xl"
            >
              <button
                type="button"
                title={t("edit")}
                aria-label={t("edit")}
                className="absolute top-3 left-3 z-10 bg-white p-2 rounded-full text-red-600 hover:bg-red-50 shadow"
                onClick={editSlider}
              >
                <FaEdit />
              </button>
              <button
                type="button"
                title={t("delete")}
                aria-label={t("delete")}
                className="absolute top-3 right-3 z-10 bg-white p-2 rounded-full text-red-600 hover:bg-red-50 shadow"
                onClick={() => deleteSlideImage(img.sliderImageId)}
              >
                <FaTrash />
              </button>
              <button
                type="button"
                title={t("edit")}
                className="flex justify-center items-center w-full"
                onClick={editSlider}
              >
                <Image
                  src={`${
                    process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL
                  }${getThumbnailUrl(img.imageUrl)}`}
                  alt=""
                  width={100}
                  height={100}
                  className="h-[140px] w-full rounded-3xl"
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
    // </div>
  );
}
