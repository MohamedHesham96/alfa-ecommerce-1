"use client"
import { IoCloudUploadSharp } from "react-icons/io5"
import { useLanguage } from "../../../../context/LanguageContext"
import AdsForm from "./AdsForm"
import { useEffect, useState } from "react"
import { deleteRequest, getRequest } from "../../../../utils/requestsUtils"
import { useRefresh } from "../../../../context/refreshContext.jsx";
import { FaEdit, FaTrash } from "react-icons/fa";
import Image from "next/image"

const emptyAds = {
  ad1: {
    img: "",
    id: "",
  },
  ad2: {
    img: "",
    id: "",
  },
  ad3: {
    img: "",
    id: "",
  },
  ad4: {
    img: "",
    id: "",
  },
  ad5: {
    img: "",
    id: "",
  },
}

function AdActions({ offerId, editLabel, deleteLabel, onEdit, onDelete }) {
  if (!offerId) return null

  return (
    <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        type="button"
        className="bg-white p-2 rounded-full text-red-600 hover:bg-red-50 shadow"
        title={editLabel}
        aria-label={editLabel}
        onClick={(e) => {
          e.stopPropagation()
          onEdit()
        }}
      >
        <FaEdit />
      </button>
      <button
        type="button"
        className="bg-white p-2 rounded-full text-red-600 hover:bg-red-50 shadow"
        title={deleteLabel}
        aria-label={deleteLabel}
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <FaTrash />
      </button>
    </div>
  )
}

export default function Ads() {
  const { refreshKey, triggerRefresh } = useRefresh();

  const { t, locale } = useLanguage()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [adNumber, setAdNumber] = useState()
  const [offerId, setOfferId] = useState()
  const [options, setOptions] = useState([]);
  const [ads, setAds] = useState(emptyAds)

  const fetchRecentItems = async () => {
    const res = await getRequest("/api/public/items/recent");
    const products = res?.data || [];
    setOptions(
      products.map((product) => ({
        value: product.itemId,
        label: locale === "ar" ? product.nameAr : product.nameEn,
        product,
      }))
    );
  };

  const getAdsData = async () => {
    const res = await getRequest("/api/public/offers")
    const offers = res?.data || []
    const nextAds = { ...emptyAds }

    offers.forEach((offer) => {
      const number = Number(offer.number)
      if (number >= 1 && number <= 5) {
        nextAds[`ad${number}`] = {
          img: offer.imageUrl,
          id: offer.offerId,
        }
      }
    })

    setAds(nextAds)
  }

  const openAdForm = (number, id) => {
    setIsFormOpen(true)
    setAdNumber(number)
    fetchRecentItems()
    setOfferId(id)
  }

  const handleDelete = async (id) => {
    if (!id) return
    try {
      await deleteRequest(`/api/admin/offers/${id}`, t("message"))
      triggerRefresh()
    } catch (error) {}
  }

  useEffect(() => {
    getAdsData()
  }, [refreshKey]);
  return (
    <>
      <AdsForm setIsFormOpen={setIsFormOpen} isFormOpen={isFormOpen} productsOptions={options} adNumber={adNumber} offerId={offerId} mode={offerId ? "update" : "create"} />
      <div className="w-full h-full grid md:grid-cols-5 xs:grid-cols-1 gap-5">
        <div className="w-full h-full">
          <h1 className="mb-4 text-xl font-semibold">{t("Advert1")} </h1>
          <div className="group w-full max-w-[200px] h-[200px] rounded-3xl bg-white p-5 cursor-pointer"
            onClick={() => openAdForm(1, ads.ad1.id)}
          >
            {ads.ad1.img ? <div className="w-full h-full relative">
              <Image
                src={process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL + ads.ad1.img}
                alt=""
                fill
                className="object-fill rounded-3xl"
              />
              <AdActions
                offerId={ads.ad1.id}
                editLabel={t("edit")}
                deleteLabel={t("delete")}
                onEdit={() => openAdForm(1, ads.ad1.id)}
                onDelete={() => handleDelete(ads.ad1.id)}
              />
            </div> :
              <label className="border-dashed flex justify-center p-5 items-center border-2 h-full w-full rounded-3xl cursor-pointer hover:bg-gray-100">
                <div
                  id="label-uplod"
                  className="flex flex-col justify-center items-center "
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
            }


            <input
              type="file"
              accept="image/*"
              // onChange={handelupload}
              className="hidden"
              id="fileInput"
            />
          </div>
        </div>
        <div className="w-full h-full">
          <h1 className="mb-4 text-xl font-semibold ">{t("Advert2")} </h1>
          <div className="group w-full max-w-[200px] h-[300px] rounded-3xl bg-white p-5 cursor-pointer"
            onClick={() => openAdForm(2, ads.ad2.id)}
          >
            {ads.ad2.img ? <div className="w-full h-full relative">
              <Image
                src={process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL + ads.ad2.img}
                alt=""
                fill
                className="object-fill rounded-3xl"
              />
              <AdActions
                offerId={ads.ad2.id}
                editLabel={t("edit")}
                deleteLabel={t("delete")}
                onEdit={() => openAdForm(2, ads.ad2.id)}
                onDelete={() => handleDelete(ads.ad2.id)}
              />
            </div> : <label className="border-dashed flex justify-center p-5 items-center border-2 h-full w-full rounded-3xl cursor-pointer hover:bg-gray-100">
              <div
                id="label-uplod"
                className="flex flex-col justify-center items-center "
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
            </label>}


            <input
              type="file"
              accept="image/*"
              // onChange={handelupload}
              className="hidden"
              id="fileInput"
            />
          </div>
        </div>
        
        <div className="w-full h-full">
          <h1 className="mb-4 text-xl font-semibold">{t("Advert3")} </h1>
          <div className="group w-full max-w-[200px] h-[200px] rounded-3xl bg-white p-5 cursor-pointer"
            onClick={() => openAdForm(3, ads.ad3.id)}
          >
            {
              ads.ad3.img ? <div className="w-full h-full relative">
                <Image
                  src={process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL + ads.ad3.img}
                  alt=""
                  fill
                  className="object-fill rounded-3xl"
                />
                <AdActions
                  offerId={ads.ad3.id}
                  editLabel={t("edit")}
                  deleteLabel={t("delete")}
                  onEdit={() => openAdForm(3, ads.ad3.id)}
                  onDelete={() => handleDelete(ads.ad3.id)}
                />
              </div> :
                <label className="border-dashed flex justify-center p-5 items-center border-2 h-full w-full rounded-3xl cursor-pointer hover:bg-gray-100">
                  <div
                    id="label-uplod"
                    className="flex flex-col justify-center items-center "
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
            }


            <input
              type="file"
              accept="image/*"
              // onChange={handelupload}
              className="hidden"
              id="fileInput"
            />
          </div>
        </div>
        <div className="w-full h-full">
          <h1 className="mb-4 text-xl font-semibold">{t("Advert4")} </h1>
          <div className="group w-full max-w-[200px] h-[200px] rounded-3xl bg-white p-5 cursor-pointer"
            onClick={() => openAdForm(4, ads.ad4.id)}
          >
            {
              ads.ad4.img? <div className="w-full h-full relative">
                <Image
                  src={process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL + ads.ad4.img}
                  alt=""
                  fill
                  className="object-fill rounded-3xl"
                />
                <AdActions
                  offerId={ads.ad4.id}
                  editLabel={t("edit")}
                  deleteLabel={t("delete")}
                  onEdit={() => openAdForm(4, ads.ad4.id)}
                  onDelete={() => handleDelete(ads.ad4.id)}
                />
              </div>
                :
                <label className="border-dashed flex justify-center p-5 items-center border-2 h-full w-full rounded-3xl cursor-pointer hover:bg-gray-100">
                  <div
                    id="label-uplod"
                    className="flex flex-col justify-center items-center "
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
            }


            <input
              type="file"
              accept="image/*"
              // onChange={handelupload}
              className="hidden"
              id="fileInput"
            />
          </div>
        </div>
        <div className="w-full h-full">
          <h1 className="mb-4 text-xl font-semibold">{t("Advert5")} </h1>
          <div className="group w-full max-w-[200px] h-[200px] rounded-3xl bg-white p-5 cursor-pointer"
            onClick={() => openAdForm(5, ads.ad5.id)}
          >
            {
              ads.ad5.img ? <div className="w-full h-full relative">
                <Image
                  src={process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL + ads.ad5.img}
                  alt=""
                  fill
                  className="object-fill rounded-3xl"
                />
                <AdActions
                  offerId={ads.ad5.id}
                  editLabel={t("edit")}
                  deleteLabel={t("delete")}
                  onEdit={() => openAdForm(5, ads.ad5.id)}
                  onDelete={() => handleDelete(ads.ad5.id)}
                />
              </div> :
                <label className="border-dashed flex justify-center p-5 items-center border-2 h-full w-full rounded-3xl cursor-pointer hover:bg-gray-100">
                  <div
                    id="label-uplod"
                    className="flex flex-col justify-center items-center "
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
            }
            <input
              type="file"
              accept="image/*"
              // onChange={handelupload}
              className="hidden"
              id="fileInput"
            />
          </div>
        </div>
      </div>
    </>
  )
}