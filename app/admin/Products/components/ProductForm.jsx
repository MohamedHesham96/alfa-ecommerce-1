"use client";
import Image from "next/image";
import { MdBlock, MdCancel } from "react-icons/md";
import {
  IoCheckmarkCircleOutline,
  IoCloudUploadSharp,
} from "react-icons/io5";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaCircle } from "react-icons/fa";
import { GoStarFill } from "react-icons/go";
import { toast } from "react-toastify";
import Select from "react-select";

import { useLanguage } from "../../../../context/LanguageContext.js";
import { useFeature } from "../../../../context/AppConfigContext.jsx";
import {
  getCategories,
  getProductDetails,
  getThumbnailUrl,
} from "../../../../utils/functions.jsx";
import {
  deleteRequest,
  postRequest,
  putRequest,
} from "../../../../utils/requestsUtils.js";
import { useRefresh } from "../../../../context/refreshContext.jsx";
import { useIdContext } from "../../../../context/idContext.jsx";

const toDimensionNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const SELECT_STYLES = {
  control: (provided) => ({
    ...provided,
    border: "1px solid var(--admin-border-strong)",
    borderRadius: "10px",
    minHeight: "40px",
    boxShadow: "none",
    backgroundColor: "var(--admin-surface)",
    "&:hover": { borderColor: "var(--admin-border-strong)" },
    "&:focus-within": {
      borderColor: "var(--admin-accent)",
      boxShadow: "0 0 0 3px var(--admin-focus-ring)",
    },
  }),
  valueContainer: (base) => ({ ...base, paddingInline: "0.65rem" }),
  menu: (base) => ({
    ...base,
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "var(--admin-shadow-popover)",
    zIndex: 30,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "var(--admin-accent-solid)"
      : state.isFocused
        ? "var(--admin-danger-soft)"
        : "var(--admin-surface)",
    color: state.isSelected ? "var(--admin-on-accent)" : "var(--admin-ink-soft)",
    cursor: "pointer",
    fontSize: "13px",
  }),
  input: (base) => ({ ...base, color: "var(--admin-ink-soft)" }),
  placeholder: (base) => ({ ...base, color: "var(--admin-muted-soft)" }),
  singleValue: (base) => ({ ...base, color: "var(--admin-ink-soft)", fontWeight: "600" }),
  indicatorSeparator: () => ({ display: "none" }),
  menuPortal: (base) => ({ ...base, zIndex: 90 }),
};

function ToggleCard({ label, description, active, onClick, icon, activeClass }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-start transition-colors ${
        active
          ? "border-[var(--admin-border)] bg-[var(--admin-surface-hover)]"
          : "border-[var(--admin-border)] bg-[var(--admin-surface)]"
      }`}
    >
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-[var(--admin-ink-soft)]">
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-[10px] leading-4 text-[var(--admin-muted-soft)]">
            {description}
          </span>
        ) : null}
      </span>
      <span
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-base ${
          active ? activeClass : "bg-[var(--admin-surface-muted)] text-[var(--admin-muted-soft)]"
        }`}
      >
        {icon}
      </span>
    </button>
  );
}

export default function FormProduct({
  isFormOpen,
  setIsFormOpen,
  isEditMode,
  setIsEditMode,
}) {
  const [enabledActive, setEnabledActive] = useState(true);
  const [enabledFavorite, setEnabledFavorite] = useState(false);
  const [enabledAvailable, setEnabledAvailable] = useState(true);

  const { triggerRefresh } = useRefresh();
  const { selectedProductId, setSelectedProductId } = useIdContext();
  const [loading, setLoading] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [showProductData, setShowProductData] = useState(true);
  const { t } = useLanguage();
  const itemDimensionsEnabled = useFeature("ITEM_DIMENSIONS_ENABLED");

  const [product, setProduct] = useState({
    nameEn: "",
    nameAr: "",
    price: null,
    oldPrice: null,
    descriptionEn: "",
    descriptionAr: "",
    seoCode: "",
    category: {
      id: null,
      nameAr: "",
      nameEn: "",
    },
    code: "",
    ram: "",
    flash: "",
    brand: "",
    contents: "",
    length: "",
    width: "",
    height: "",
    releaseYear: "",
  });
  const [itemCategory, setItemCategory] = useState([]);
  const [itemImages, setItemImages] = useState([]);
  const objectUrlsRef = useRef([]);

  const createObjectUrl = (file) => {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.push(url);
    return url;
  };

  const revokeObjectUrl = (url) => {
    URL.revokeObjectURL(url);
    objectUrlsRef.current = objectUrlsRef.current.filter((u) => u !== url);
  };

  const revokeImageUrls = useCallback(() => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
  }, []);

  const handleItemImagesUpload = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    const newImages = files.map((file) => ({
      file,
      preview: createObjectUrl(file),
      existingId: null,
    }));
    setItemImages((prev) => [...prev, ...newImages]);
  };

  const removeItemImage = (index) => {
    const target = itemImages[index];
    if (target?.preview) revokeObjectUrl(target.preview);
    setItemImages((prev) => prev.filter((_, i) => i !== index));
  };

  // جلب الأقسام
  const showCategories = useCallback(async () => {
    try {
      const resData = await getCategories();
      setItemCategory(resData.data.content || []);
    } catch (error) {}
  }, []);

  // إعادة تعيين حالة النموذج فقط
  const resetFormState = useCallback(() => {
    setProduct({
      nameEn: "",
      nameAr: "",
      price: null,
      oldPrice: null,
      descriptionAr: "",
      descriptionEn: "",
      seoCode: "",
      category: { id: null, nameAr: "", nameEn: "" },
      code: "",
      ram: "",
      flash: "",
      brand: "",
      contents: "",
      length: "",
      width: "",
      height: "",
      releaseYear: "",
    });
    revokeImageUrls();
    setItemImages([]);
    setShowImages(false);
    setShowProductData(true);
    setEnabledFavorite(false);
    setEnabledActive(true);
    setEnabledAvailable(true);
  }, [revokeImageUrls]);

  const fields = {
    nameEn: product.nameEn,
    nameAr: product.nameAr,
    code: product.code,
    price: product.price,
    oldPrice: product.oldPrice,
    seoCode: product.seoCode,
    ram: product.ram,
    flash: product.flash,
    brand: product.brand,
    contents: product.contents,
    descriptionAr: product.descriptionAr,
    descriptionEn: product.descriptionEn,
    favorite: enabledFavorite,
    active: enabledActive,
    available: enabledAvailable,
    itemCategoryId: product.category.id,
    length: toDimensionNumber(product.length),
    width: toDimensionNumber(product.width),
    height: toDimensionNumber(product.height),
    releaseYear: product.releaseYear,
  };

  const validateItemDimensions = () => {
    if (!itemDimensionsEnabled) return true;
    const dimensions = [product.length, product.width, product.height];
    if (
      dimensions.some(
        (value) => value === "" || value === null || value === undefined,
      )
    ) {
      toast.error(t("item_dimensions_required"));
      return false;
    }
    if (
      dimensions.some(
        (value) => !Number.isFinite(Number(value)) || Number(value) <= 0,
      )
    ) {
      toast.error(t("item_dimensions_invalid"));
      return false;
    }
    return true;
  };

  // إضافة منتج جديد
  const addProductData = async () => {
    if (!validateItemDimensions()) return;
    setLoading(true);
    try {
      const respose = await postRequest(
        "/api/admin/items",
        fields,
        t("message"),
      );
      if (!respose) return;

      setSelectedProductId(
        respose.itemId || respose.data?.itemId || respose.id,
      );
      triggerRefresh();
      setShowImages(true);
      setIsEditMode(true);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const addProductImges = async () => {
    try {
      const formData = new FormData();
      itemImages.forEach((img) => {
        if (img.file) {
          formData.append("itemImages", img.file);
        }
      });
      await postRequest(
        `/api/admin/items/${selectedProductId}/images`,
        formData,
        "",
      );
      toast.success(t("images_saved_successfully"));

      triggerRefresh();
      productData();
    } catch (err) {
      console.log(err);
    }
  };

  const deleteProductImg = async (imageId, index) => {
    try {
      if (imageId) {
        const res = await deleteRequest(
          `/api/admin/items/${selectedProductId}/images/${imageId}`,
          t("message"),
        );
        console.log(res);
        if (res.success) {
          removeItemImage(index);
        }
      } else {
        removeItemImage(index);
      }
    } catch (err) {}
  };

  // جلب بيانات المنتج للتعديل
  const productData = useCallback(async () => {
    try {
      setLoading(true);

      if (selectedProductId !== null) {
        resetFormState();
        const res = await getProductDetails(selectedProductId);
        const resData = res.data;
        console.log(resData);
        setProduct((prev) => ({
          ...prev,
          nameEn: resData.nameEn,
          nameAr: resData.nameAr,
          code: resData.code,
          price: resData.price,
          oldPrice: resData.oldPrice,
          descriptionAr: resData.descriptionAr,
          seoCode: resData.seoCode,
          ram: resData.ram,
          flash: resData.flash,
          brand: resData.brand,
          contents: resData.contents,
          length: resData.length ?? "",
          width: resData.width ?? "",
          height: resData.height ?? "",
          descriptionEn: resData.descriptionEn,
          releaseYear: resData.releaseYear,
          category: {
            ...prev.category,
            id: resData.itemCategory.itemCategoryId,
            nameAr: resData.itemCategory.nameAr,
            nameEn: resData.itemCategory.nameEn,
          },
        }));

        const existingImages = resData.images.map((img) => ({
          file: null,
          preview: process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL + img.imageUrl,
          existingId: img.itemImageId,
        }));
        console.log(existingImages);
        setItemImages(existingImages);

        setEnabledFavorite(resData.favorite);
        setEnabledActive(resData.active);
        setEnabledAvailable(resData.available);

        setShowProductData(true);
        setShowImages(true);
      } else {
        resetFormState();
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [selectedProductId, resetFormState]);

  // تحديث المنتج
  const updateProduct = async () => {
    if (!validateItemDimensions()) return;
    // التحقق من السعر
    if (
      product.oldPrice !== null &&
      product.price !== null &&
      Number(product.oldPrice) < Number(product.price)
    ) {
      toast.error(t("check_oldPrice"));
      return;
    }
    setLoading(true);
    try {
      await putRequest(
        `/api/admin/items/${selectedProductId}`,
        fields,
        t("message"),
      );
      triggerRefresh();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    showCategories();
  }, [showCategories]);

  useEffect(() => {
    productData();
  }, [productData]);

  useEffect(() => {
    return () => {
      revokeImageUrls();
    };
  }, [revokeImageUrls]);

  useEffect(() => {
    if (!isFormOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFormOpen]);

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedProductId(null);
    resetFormState();
  };

  const update = (key, value) =>
    setProduct((prev) => ({ ...prev, [key]: value }));

  return (
    <div id="add-product-form">
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

      <div
        className={`admin-drawer-overlay ${isFormOpen ? "flex" : "hidden"}`}
      >
        <form
          className="admin-drawer"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="admin-drawer-header">
            <div className="min-w-0">
              <h1 id="nameFormProduct" className="admin-modal-title">
                {isEditMode ? t("edit_product") : t("add_product")}
              </h1>
              <p className="admin-modal-description">
                {t("products_description")}
              </p>
            </div>
            <button
              type="button"
              className="admin-modal-close"
              onClick={closeForm}
              aria-label={t("close")}
            >
              <MdCancel className="text-xl" />
            </button>
          </div>

          <div className="admin-drawer-body">
            <div
              className={
                showImages && showProductData
                  ? "grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]"
                  : "flex flex-col gap-4"
              }
            >
              {showProductData ? (
                <div className="flex min-w-0 flex-col gap-4">
                  <section className="admin-form-section">
                    <div className="admin-form-section-header">
                      <div>
                        <h2 className="admin-form-section-title">
                          {t("section_basic_info")}
                        </h2>
                        <p className="admin-form-section-description">
                          {t("section_basic_info_description")}
                        </p>
                      </div>
                    </div>
                    <div className="admin-form-grid admin-form-grid-2">
                      <div className="admin-field">
                        <label className="admin-label" htmlFor="product-name-en">
                          {t("product_name")} [EN]
                          <span className="admin-label-required">*</span>
                        </label>
                        <input
                          id="product-name-en"
                          type="text"
                          value={product.nameEn || ""}
                          onChange={(e) => update("nameEn", e.target.value)}
                          required
                          className="admin-input"
                        />
                      </div>
                      <div className="admin-field">
                        <label className="admin-label" htmlFor="product-name-ar">
                          {t("product_name")} [AR]
                          <span className="admin-label-required">*</span>
                        </label>
                        <input
                          id="product-name-ar"
                          type="text"
                          value={product.nameAr || ""}
                          onChange={(e) => update("nameAr", e.target.value)}
                          required
                          className="admin-input"
                          dir="rtl"
                        />
                      </div>
                      <div className="admin-field">
                        <label className="admin-label" htmlFor="product-code">
                          {t("product_code")}
                        </label>
                        <input
                          id="product-code"
                          type="text"
                          value={product.code || ""}
                          onChange={(e) => update("code", e.target.value)}
                          required
                          className="admin-input"
                          dir="ltr"
                        />
                      </div>
                      <div className="admin-field">
                        <label className="admin-label" htmlFor="product-category">
                          {t("Category")}
                          <span className="admin-label-required">*</span>
                        </label>
                        <Select
                          inputId="product-category"
                          options={itemCategory.map((category) => ({
                            value: category.itemCategoryId,
                            label:
                              localStorage.getItem("lang") === "ar"
                                ? category.nameAr
                                : category.nameEn,
                            data: category,
                          }))}
                          value={
                            product.category.id
                              ? {
                                  value: product.category.id,
                                  label:
                                    localStorage.getItem("lang") === "ar"
                                      ? product.category.nameAr
                                      : product.category.nameEn,
                                }
                              : null
                          }
                          onChange={(option) => {
                            if (option) {
                              setProduct((prev) => ({
                                ...prev,
                                category: {
                                  id: option.value,
                                  nameAr: option.data.nameAr,
                                  nameEn: option.data.nameEn,
                                },
                              }));
                            } else {
                              setProduct((prev) => ({
                                ...prev,
                                category: {
                                  id: null,
                                  nameAr: "",
                                  nameEn: "",
                                },
                              }));
                            }
                          }}
                          isSearchable={false}
                          placeholder={t("select_category")}
                          noOptionsMessage={() => t("no_categories")}
                          styles={SELECT_STYLES}
                          menuPortalTarget={
                            typeof document !== "undefined" ? document.body : undefined
                          }
                          menuPosition="fixed"
                        />
                      </div>
                      <div className="admin-field">
                        <label className="admin-label" htmlFor="product-brand">
                          {t("brand")}
                        </label>
                        <Select
                          inputId="product-brand"
                          options={[
                            { value: "Senator", label: t("Senator") },
                            { value: "OMEGA", label: t("OMEGA") },
                            { value: "PANORAMA", label: t("PANORAMA") },
                            { value: "IBOX", label: t("IBOX") },
                          ]}
                          value={
                            product.brand
                              ? {
                                  value: product.brand,
                                  label: t(product.brand),
                                }
                              : null
                          }
                          onChange={(option) => {
                            update("brand", option ? option.value : "");
                          }}
                          isSearchable={false}
                          placeholder={t("brand")}
                          styles={SELECT_STYLES}
                          menuPortalTarget={
                            typeof document !== "undefined" ? document.body : undefined
                          }
                          menuPosition="fixed"
                        />
                      </div>
                      <div className="admin-field">
                        <label className="admin-label" htmlFor="product-seo">
                          SEO {t("code")}
                        </label>
                        <input
                          id="product-seo"
                          value={product.seoCode || ""}
                          onChange={(e) => update("seoCode", e.target.value)}
                          className="admin-input"
                          dir="ltr"
                        />
                      </div>
                      <div className="admin-field">
                        <label
                          className="admin-label"
                          htmlFor="product-release-year"
                        >
                          {t("releaseYear")}
                        </label>
                        <input
                          id="product-release-year"
                          value={product.releaseYear || ""}
                          onChange={(e) =>
                            update("releaseYear", e.target.value)
                          }
                          className="admin-input"
                          inputMode="numeric"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="admin-form-section">
                    <div className="admin-form-section-header">
                      <div>
                        <h2 className="admin-form-section-title">
                          {t("section_pricing")}
                        </h2>
                        <p className="admin-form-section-description">
                          {t("section_pricing_description")}
                        </p>
                      </div>
                    </div>
                    <div className="admin-form-grid admin-form-grid-2">
                      <div className="admin-field">
                        <label className="admin-label" htmlFor="product-price">
                          {t("Price")}
                          <span className="admin-label-required">*</span>
                        </label>
                        <div className="relative">
                          <input
                            id="product-price"
                            type="number"
                            value={product.price || ""}
                            onChange={(e) => update("price", e.target.value)}
                            required
                            className="admin-input pe-16"
                            min="0"
                            step="0.01"
                          />
                          <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs font-semibold text-[var(--admin-muted)]">
                            {t("currency")}
                          </span>
                        </div>
                      </div>
                      <div className="admin-field">
                        <label
                          className="admin-label"
                          htmlFor="product-old-price"
                        >
                          {t("old_price")}{" "}
                          <span className="text-xs font-medium text-[var(--admin-muted-soft)]">
                            ({t("option")})
                          </span>
                        </label>
                        <div className="relative">
                          <input
                            id="product-old-price"
                            type="number"
                            value={product.oldPrice || ""}
                            onChange={(e) => update("oldPrice", e.target.value)}
                            className="admin-input pe-16"
                            min="0"
                            step="0.01"
                          />
                          <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs font-semibold text-[var(--admin-muted)]">
                            {t("currency")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="admin-form-section">
                    <div className="admin-form-section-header">
                      <div>
                        <h2 className="admin-form-section-title">
                          {t("section_inventory")}
                        </h2>
                        <p className="admin-form-section-description">
                          {t("section_inventory_description")}
                        </p>
                      </div>
                    </div>
                    <div className="admin-form-grid admin-form-grid-2">
                      <div className="admin-field">
                        <label className="admin-label" htmlFor="product-ram">
                          {t("ram")}
                        </label>
                        <input
                          id="product-ram"
                          type="text"
                          value={product.ram || ""}
                          onChange={(e) => update("ram", e.target.value)}
                          className="admin-input"
                          dir="ltr"
                        />
                      </div>
                      <div className="admin-field">
                        <label className="admin-label" htmlFor="product-flash">
                          {t("flash")}
                        </label>
                        <input
                          id="product-flash"
                          type="text"
                          value={product.flash || ""}
                          onChange={(e) => update("flash", e.target.value)}
                          className="admin-input"
                          dir="ltr"
                        />
                      </div>
                      <div className="admin-field md:col-span-2">
                        <label
                          className="admin-label"
                          htmlFor="product-contents"
                        >
                          {t("contents")}
                        </label>
                        <input
                          id="product-contents"
                          type="text"
                          value={product.contents || ""}
                          onChange={(e) => update("contents", e.target.value)}
                          className="admin-input"
                        />
                      </div>
                      {itemDimensionsEnabled ? (
                        <>
                          <div className="admin-form-grid admin-form-grid-3 md:col-span-2">
                            {[
                              ["length", t("length")],
                              ["width", t("width")],
                              ["height", t("height")],
                            ].map(([key, label]) => (
                              <div className="admin-field" key={key}>
                                <label
                                  className="admin-label"
                                  htmlFor={`product-${key}`}
                                >
                                  {label}
                                  <span className="admin-label-required">
                                    *
                                  </span>
                                </label>
                                <input
                                  id={`product-${key}`}
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  inputMode="decimal"
                                  value={product[key]}
                                  onChange={(e) =>
                                    update(key, e.target.value)
                                  }
                                  required={itemDimensionsEnabled}
                                  className="admin-input"
                                />
                              </div>
                            ))}
                          </div>
                        </>
                      ) : null}
                    </div>
                  </section>

                  <section className="admin-form-section">
                    <div className="admin-form-section-header">
                      <div>
                        <h2 className="admin-form-section-title">
                          {t("section_visibility")}
                        </h2>
                        <p className="admin-form-section-description">
                          {t("section_visibility_description")}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <ToggleCard
                        label={t("visible_in_store")}
                        active={enabledActive}
                        onClick={() => setEnabledActive(!enabledActive)}
                        icon={<FaCircle />}
                        activeClass="bg-[var(--admin-success-soft)] text-[var(--admin-success)]"
                      />
                      <ToggleCard
                        label={t("featured-product")}
                        active={enabledFavorite}
                        onClick={() => setEnabledFavorite(!enabledFavorite)}
                        icon={<GoStarFill />}
                        activeClass="bg-[var(--admin-warning-soft)] text-[var(--admin-warning-text)]"
                      />
                      <ToggleCard
                        label={t("available_in_store")}
                        active={enabledAvailable}
                        onClick={() => setEnabledAvailable(!enabledAvailable)}
                        icon={
                          enabledAvailable ? (
                            <IoCheckmarkCircleOutline />
                          ) : (
                            <MdBlock />
                          )
                        }
                        activeClass="bg-[var(--admin-success-soft)] text-[var(--admin-success)]"
                      />
                    </div>
                  </section>

                  <section className="admin-form-section">
                    <div className="admin-form-section-header">
                      <div>
                        <h2 className="admin-form-section-title">
                          {t("section_descriptions")}
                        </h2>
                        <p className="admin-form-section-description">
                          {t("section_descriptions_description")}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="admin-field">
                        <label
                          className="admin-label"
                          htmlFor="product-description-en"
                        >
                          {t("description")} [EN]
                          <span className="admin-label-required">*</span>
                        </label>
                        <textarea
                          id="product-description-en"
                          required
                          value={product.descriptionEn || ""}
                          onChange={(e) =>
                            update("descriptionEn", e.target.value)
                          }
                          rows={5}
                          className="admin-textarea"
                        />
                      </div>
                      <div className="admin-field">
                        <label
                          className="admin-label"
                          htmlFor="product-description-ar"
                        >
                          {t("description")} [AR]
                          <span className="admin-label-required">*</span>
                        </label>
                        <textarea
                          id="product-description-ar"
                          required
                          value={product.descriptionAr || ""}
                          onChange={(e) =>
                            update("descriptionAr", e.target.value)
                          }
                          rows={5}
                          className="admin-textarea"
                          dir="rtl"
                        />
                      </div>
                    </div>
                  </section>

                  <div className="admin-form-footer">
                    {!isEditMode ? (
                      <button
                        type="submit"
                        id="btn-saveProduct"
                        className="admin-btn admin-btn-primary"
                        onClick={addProductData}
                        disabled={loading}
                      >
                        {t("save_data")}
                      </button>
                    ) : (
                      <button
                        type="submit"
                        id="btn-editProduct"
                        className="admin-btn admin-btn-primary"
                        onClick={updateProduct}
                        disabled={loading}
                      >
                        {t("save-changes")}
                      </button>
                    )}
                  </div>
                </div>
              ) : null}

              {showImages ? (
                <aside className="min-w-0">
                  <div className="admin-form-section">
                    <div className="admin-form-section-header">
                      <div>
                        <h2 className="admin-form-section-title">
                          {t("section_images")}
                        </h2>
                        <p className="admin-form-section-description">
                          {t("section_images_description")}
                        </p>
                      </div>
                      <span className="admin-badge admin-badge-gray">
                        {itemImages.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <label
                        htmlFor="productImg_fileInput"
                        className="group flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--admin-border-strong)] bg-[var(--admin-surface-muted)] p-3 text-center transition-colors hover:border-[var(--admin-accent)] hover:bg-[var(--admin-danger-soft)]"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--admin-surface)] text-base text-[var(--admin-accent)] shadow-sm transition-transform group-hover:scale-105">
                          <IoCloudUploadSharp />
                        </span>
                        <span className="text-[11px] font-semibold text-[var(--admin-ink-soft)]">
                          {t("click_to_upload")}
                        </span>
                        <span className="text-[9px] text-[var(--admin-muted-soft)]">
                          {t("image_formats")}
                        </span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleItemImagesUpload}
                        className="hidden"
                        id="productImg_fileInput"
                      />
                      {itemImages.map((img, index) => (
                        <div
                          key={index}
                          className="group relative h-28 overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]"
                        >
                          <Image
                            src={
                              img.existingId
                                ? getThumbnailUrl(img.preview)
                                : img.preview
                            }
                            alt=""
                            height={112}
                            width={140}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            className="absolute end-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--admin-surface)] text-[var(--admin-ink-soft)] shadow-sm transition-colors hover:bg-[var(--admin-danger-text)] hover:text-white"
                            onClick={() => deleteProductImg(img.existingId, index)}
                            aria-label={t("delete")}
                          >
                            <MdCancel className="text-sm" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="submit"
                      id="btn-saveProductImages"
                      className="admin-btn admin-btn-primary mt-4 w-full"
                      onClick={addProductImges}
                      disabled={loading}
                    >
                      {t("save_images")}
                    </button>
                  </div>
                </aside>
              ) : null}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
