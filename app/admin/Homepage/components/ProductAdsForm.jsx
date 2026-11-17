"use client";
import Image from "next/image";
import { MdCancel } from "react-icons/md";
import { IoCloudUploadSharp } from "react-icons/io5";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "../../../../context/LanguageContext.js";
import { getProductDetails, getThumbnailUrl } from "../../../../utils/functions.jsx";
import { postRequest, putRequest } from "../../../../utils/requestsUtils.js";
import { useRefresh } from "../../../../context/refreshContext.jsx";
import Select from "react-select";

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL;

const resolveProductImage = (product) =>
  product?.images?.[0]?.imageUrl || "";

export default function ProductAdsForm({ isFormOpen, setIsFormOpen, editOffer, nextNumber }) {
  const { t, locale } = useLanguage();
  const { triggerRefresh } = useRefresh();
  const [title, setTitle] = useState("");
  const [itemId, setItemId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [options, setOptions] = useState([]);
  const [search, setSearch] = useState("");
  const [photo, setPhoto] = useState({ imageFile: "", imageUrl: "" });
  const [loading, setLoading] = useState(false);
  const objectUrlRef = useRef(null);

  const isEditMode = !!editOffer;

  const clearNewImage = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPhoto({ imageFile: "", imageUrl: "" });
  }, []);

  const fetchProductOptions = useCallback(async (searchText = "") => {
    const res = await postRequest(
      "/api/public/items/search",
      { page: 0, size: 100, searchText },
      ""
    );
    const data = res.data?.content || res.data || [];
    setOptions(
      data.map((product) => ({
        value: product.itemId,
        label: locale === "ar" ? product.nameAr : product.nameEn,
        product,
      }))
    );
  }, [locale]);

  const loadEditData = useCallback(async () => {
    if (!editOffer) return;
    setTitle(editOffer.title || "");
    if (editOffer.itemId) {
      setItemId(editOffer.itemId);
      setSelectedProduct({
        value: editOffer.itemId,
        label: `#${editOffer.itemId}`,
        product: null,
      });
      try {
        const res = await getProductDetails(editOffer.itemId);
        const product = res.data;
        setSelectedProduct({
          value: editOffer.itemId,
          label: locale === "ar" ? product.nameAr : product.nameEn,
          product,
        });
      } catch (error) {}
    }
  }, [editOffer, locale]);

  useEffect(() => {
    if (!isFormOpen) return;
    clearNewImage();
    setTitle("");
    setItemId("");
    setSelectedProduct(null);
    setSearch("");
    fetchProductOptions();
    loadEditData();
  }, [isFormOpen, editOffer, clearNewImage, fetchProductOptions, loadEditData]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handelUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setPhoto({ imageFile: file, imageUrl: objectUrl });
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    await fetchProductOptions(search);
  };

  const selectedProductImage = () => {
    const url = resolveProductImage(selectedProduct?.product);
    return url ? IMAGE_BASE_URL + getThumbnailUrl(url) : "";
  };

  const displayAdImage = () => {
    if (photo.imageUrl) return photo.imageUrl;
    if (editOffer?.imageUrl) return IMAGE_BASE_URL + editOffer.imageUrl;
    return "";
  };

  const formatOptionLabel = ({ label, product }) => {
    const url = resolveProductImage(product);
    return (
      <div className="flex items-center gap-3">
        {url ? (
          <Image
            src={IMAGE_BASE_URL + getThumbnailUrl(url)}
            alt=""
            width={30}
            height={30}
            className="rounded-md object-cover w-[30px] h-[30px]"
          />
        ) : (
          <div className="w-[30px] h-[30px] bg-gray-100 rounded-md" />
        )}
        <span>{label}</span>
      </div>
    );
  };

  const handleSubmit = async () => {
    if (!itemId) return;
    const formData = new FormData();
    if (photo.imageFile) {
      formData.append("imageFile", photo.imageFile);
    }
    formData.append("itemId", itemId);
    formData.append("number", isEditMode ? editOffer.number : nextNumber);

    try {
      setLoading(true);
      if (isEditMode) {
        await putRequest(`/api/admin/offers/${editOffer.offerId}`, formData, t("message"));
      } else {
        await postRequest("/api/admin/offers", formData, t("message"));
      }
      triggerRefresh();
    } catch (error) {
    } finally {
      setLoading(false);
      clearNewImage();
      setTitle("");
      setItemId("");
      setSelectedProduct(null);
      setSearch("");
      setIsFormOpen(false);
    }
  };

  return (
    <div
      id="add-product-ad-form"
      className={`admin-modal-overlay ${isFormOpen ? "flex" : "hidden"}`}
    >
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
      <div className="admin-modal max-w-[520px]">
        <div className="admin-modal-header">
          <h1 id="nameFormProductAd" className="admin-modal-title">
            {isEditMode ? t("edit_product_ad") : t("add_product_ad")}
          </h1>
          <button
            type="button"
            className="admin-modal-close"
            onClick={() => {
              setIsFormOpen(false);
              clearNewImage();
              setSelectedProduct(null);
              setSearch("");
            }}
            aria-label={t("close")}
          >
            <MdCancel className="text-xl" />
          </button>
        </div>
        <div className="admin-modal-body">
          <form
            className="w-full"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            {/* advert featured image upload */}
            <div className="flex flex-col items-center mt-2">
              {displayAdImage() ? (
                <div className="relative h-[170px] w-full overflow-hidden rounded-xl border border-[#e4e8f0] bg-[#f8fafc]">
                  <Image
                    alt=""
                    src={displayAdImage()}
                    fill
                    sizes="(max-width: 768px) 80vw, 400px"
                    className="object-contain p-2"
                  />
                </div>
              ) : (
                <label htmlFor="ProductAdFileInput" className="w-full cursor-pointer">
                  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#d3d9e5] bg-[#f8fafc] p-6 text-center transition-colors hover:border-[#cf4356] hover:bg-[#fdf7f8]">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-[#cf4356] shadow-sm">
                      <IoCloudUploadSharp />
                    </span>
                    <span className="text-sm font-semibold text-[#344054]">
                      {t("upload_ad_image")}
                    </span>
                    <span className="text-[10px] text-[#98a2b3]">
                      PNG, JPG or GIF
                    </span>
                  </div>
                </label>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handelUpload}
                className="hidden"
                id="ProductAdFileInput"
              />
            </div>

            {/* selected product featured image */}
            {selectedProductImage() ? (
              <div className="flex items-center gap-3 mt-4 p-2 border rounded-lg bg-gray-50">
                <Image
                  alt=""
                  src={selectedProductImage()}
                  width={50}
                  height={50}
                  className="rounded-md object-cover w-[50px] h-[50px]"
                />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">{t("product_featured_image")}</span>
                  <span className="text-sm font-semibold">{selectedProduct?.label}</span>
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-2">
              {/* <label className="text-md text-gray-500">{t("title")}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("title_placeholder")}
                className="w-full outline-none text-gray-900 text-lg p-1 border rounded-md placeholder:text-sm"
              /> */}
              <label className="admin-label">{t("choose_product")}</label>
              <div className="rounded-xl border border-[#d3d9e5] px-1 focus-within:border-[#cf4356]">
                <Select
                  options={options}
                  value={selectedProduct}
                  inputValue={search}
                  isSearchable
                  formatOptionLabel={formatOptionLabel}
                  placeholder={t("search")}
                  onInputChange={(value, actionMeta) => {
                    if (actionMeta.action === "input-change") {
                      setSearch(value);
                    }
                    return value;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  onChange={(selected) => {
                    setItemId(selected.value);
                    setSelectedProduct(selected);
                    setSearch("");
                  }}
                  noOptionsMessage={() => t("no_products") || "لا توجد منتجات"}
                  menuPortalTarget={
                    typeof document !== "undefined" ? document.body : undefined
                  }
                  menuPosition="fixed"
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      border: "none",
                      boxShadow: "none",
                      fontWeight: "600",
                      height: "100%",
                      width: "100%",
                    }),
                    input: (base) => ({
                      ...base,
                      color: "#374151",
                    }),
                    menuPortal: (base) => ({ ...base, zIndex: 90 }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected
                        ? "#dc2626"
                        : state.isFocused
                          ? "#fee2e2"
                          : "#ffffff",
                      color: state.isSelected ? "#ffffff" : "#374151",
                      cursor: "pointer",
                      padding: "10px",
                      "&:hover": {
                        backgroundColor: state.isSelected ? "#dc2626" : "#fee2e2",
                      },
                    }),
                  }}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => {
                  setIsFormOpen(false);
                  clearNewImage();
                  setSelectedProduct(null);
                  setSearch("");
                }}
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                id="btn-saveProductAd"
                className="admin-btn admin-btn-primary"
                onClick={handleSubmit}
              >
                {isEditMode ? t("save-changes") : t("save")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}