"use client";
import Image from "next/image";
import { MdCancel } from "react-icons/md";
import { IoCloudUploadSharp } from "react-icons/io5";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../../../context/LanguageContext.js";
import { getRequest, postRequest, putRequest } from "../../../../utils/requestsUtils.js";
import { useRefresh } from "../../../../context/refreshContext.jsx";
import Select from "react-select";
import { getProductDetails, getThumbnailUrl } from "../../../../utils/functions.jsx";
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL;

const resolveProductImage = (product) =>
    product?.images?.[0]?.imageUrl || "";

const mapProductToOption = (product, locale) => ({
    value: product.itemId,
    label: locale === "ar" ? product.nameAr : product.nameEn,
    product,
});
export default function AdsForm({ isFormOpen, setIsFormOpen, productsOptions, adNumber, offerId, mode = "create", adData: adDataProp = null }) {
    const [photo, setPhoto] = useState({
        AdImageFile: "",
        AdImage: "",
    });
    const [itemId, setItemId] = useState("");
    const { t } = useLanguage();
    const { locale } = useLanguage()
    const { triggerRefresh } = useRefresh();
    const [loading, setLoading] = useState();
    const [searchText, setSearchText] = useState("");
    const [adData, setAdData] = useState({
        id: "",
        imageUrl: "",
        titleAr: "",
        title: "",
        itemId: ""
    });
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [focusedOption, setFocusedOption] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [options, setOptions] = useState(productsOptions ?? []);
    const objectUrlRef = useRef(null);
    const searchTimerRef = useRef(null);
    const searchRequestIdRef = useRef(0);
    const localeRef = useRef(locale);
    const productsOptionsRef = useRef(productsOptions);

    useEffect(() => {
        localeRef.current = locale;
    }, [locale]);

    useEffect(() => {
        productsOptionsRef.current = productsOptions;
    }, [productsOptions]);

    const isUpdateMode = mode === "update";
    const adDataKey = useMemo(() => JSON.stringify(adDataProp ?? null), [adDataProp]);

    const clearNewImage = useCallback(() => {
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }
        setPhoto({ AdImageFile: "", AdImage: "" });
    }, []);
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
                    <div className="w-[30px] h-[30px] bg-[var(--admin-surface-sunken)] rounded-md" />
                )}
                <span>{label}</span>
            </div>
        );
    };
    const deleteImage = useCallback(() => {
        setAdData((prev) => ({
            ...prev,
            imageUrl: ""
        }));
    }, []);

    useEffect(() => {
        if (!isFormOpen) return;
        setOptions(productsOptions ?? []);
    }, [productsOptions, isFormOpen]);

    const searchProducts = useCallback(async (text) => {
        const query = text.trim();
        const requestId = ++searchRequestIdRef.current;

        if (!query) {
            setOptions(productsOptionsRef.current ?? []);
            return;
        }

        setSearchLoading(true);
        try {
            const res = await postRequest(
                "/api/public/items/search",
                { page: 0, size: 100, searchText: query },
                ""
            );

            const data = res?.data;
            const products = Array.isArray(data) ? data : data?.content || [];

            if (requestId !== searchRequestIdRef.current) return;

            setOptions(products.map((product) => mapProductToOption(product, localeRef.current)));
        } catch (error) {
            if (requestId !== searchRequestIdRef.current) return;
            setOptions([]);
        } finally {
            if (requestId === searchRequestIdRef.current) {
                setSearchLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        if (!isFormOpen) return;

        clearTimeout(searchTimerRef.current);

        if (!searchText.trim()) {
            searchRequestIdRef.current++;
            setSearchLoading(false);
            setOptions(productsOptionsRef.current ?? []);
            return;
        }

        searchTimerRef.current = setTimeout(() => searchProducts(searchText), 300);
        return () => clearTimeout(searchTimerRef.current);
    }, [searchText, isFormOpen, searchProducts]);

    const handeluploadAdImage = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }
        const objectUrl = URL.createObjectURL(file);

        setPhoto((prev) => ({
            ...prev,
            AdImage: objectUrl,
            AdImageFile: file,
        }));
        objectUrlRef.current = objectUrl;
    };

    const selectProductOption = useCallback(async (itemIdNum, fallbackLabel) => {
        if (itemIdNum === "" || itemIdNum === null || itemIdNum === undefined) {
            setItemId("");
            setSelectedProduct(null);
            return;
        }

        setItemId(itemIdNum);

        const match = (productsOptionsRef.current ?? []).find(
            (option) => String(option.value) === String(itemIdNum)
        );

        if (match) {
            setSelectedProduct(match);
            return;
        }

        setSelectedProduct({
            value: itemIdNum,
            label: fallbackLabel || `#${itemIdNum}`,
            product: null,
        });

        try {
            const res = await getProductDetails(itemIdNum);
            const product = res?.data;
            if (!product) return;

            const option = mapProductToOption(product, localeRef.current);
            setOptions((prev) =>
                prev.some((o) => String(o.value) === String(option.value))
                    ? prev
                    : [option, ...prev]
            );
            setSelectedProduct(option);
        } catch (error) {
        }
    }, []);

    const loadFromProps = useCallback((data) => {
        const id = data?.offerId;
        const imageUrl = data?.imageUrl;
        const titleAr = data?.titleAr;
        const title = data?.title ?? "";
        const itemIdNum = data?.itemId ?? "";

        setAdData({ id, imageUrl, titleAr, title, itemId: itemIdNum });
        if (itemIdNum) {
            selectProductOption(itemIdNum);
        } else {
            setSelectedProduct(null);
        }
    }, [selectProductOption]);

    const getAdData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getRequest(`/api/admin/offers/${offerId}`)
            loadFromProps(res?.data);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    }, [offerId, loadFromProps])

    useEffect(() => {
        if (!isFormOpen) return;

        clearNewImage();
        setItemId("");
        setSelectedProduct(null);
        setSearchText("");

        if (isUpdateMode) {
            if (adDataProp) {
                loadFromProps(adDataProp);
            } else if (offerId) {
                getAdData();
            } else {
                setAdData({ id: "", imageUrl: "", titleAr: "", title: "", itemId: "" });
            }
        } else {
            setAdData({ id: "", imageUrl: "", titleAr: "", title: "", itemId: "" });
        }
    }, [isFormOpen, isUpdateMode, offerId, adDataKey, adDataProp, clearNewImage, loadFromProps, getAdData]);

    useEffect(() => {
        return () => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
            }
            clearTimeout(searchTimerRef.current);
        };
    }, []);

    const handleSubmit = async () => {
        const formData = new FormData();
        if (photo.AdImageFile) {
            formData.append("imageFile", photo.AdImageFile);
        }
        formData.append("itemId", itemId);
        formData.append("titleAr", adData.titleAr);
        formData.append("title", adData.title);
        formData.append("number", adNumber)

        try {
            setLoading(true);

            if (isUpdateMode) {
                const targetId = adData.id || offerId;
                if (!targetId) return;
                await putRequest(`/api/admin/offers/${targetId}`, formData, t("message"));
            } else {
                await postRequest("/api/admin/offers", formData, t("message"));
            }

            triggerRefresh();
        } catch (error) {
        } finally {
            setLoading(false);
            clearNewImage();
            setItemId("");
            setSelectedProduct(null)
            setSearchText("")
            setIsFormOpen(false);
        }
    }

    return (
        <div
            id="add-slider-form"
            className={`admin-modal-overlay ${isFormOpen ? "flex" : "hidden"}`}
        >
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
            <div className="admin-modal max-w-[560px]">
                <div className="admin-modal-header">
                    <h1 id="nameFormCategory" className="admin-modal-title">
                        {isUpdateMode ? t("edit_advert") : t("add_advert") + " " + "[" + adNumber + "]"}
                    </h1>
                    <button
                        type="button"
                        className="admin-modal-close"
                        onClick={() => {
                            setIsFormOpen(false);
                            clearNewImage();
                            setSelectedProduct(null)
                            setSearchText("")
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
                        {photo.AdImageFile ? <div className="relative">
                            <button
                                type="button"
                                onClick={clearNewImage}
                                className="absolute top-2 right-2 z-10 bg-[var(--admin-danger-solid)] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm hover:bg-[var(--admin-danger-solid-hover)]"
                            >X</button>
                            <div className="relative flex h-[170px] items-center justify-center overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]">
                                <div className="relative h-full w-full">
                                    <Image
                                        alt=""
                                        src={photo.AdImage}
                                        fill
                                        sizes="(max-width: 768px) 80vw, 500px"
                                        className="object-contain p-2"
                                    />
                                </div>

                            </div>
                        </div>

                            : adData.imageUrl ? <div className="relative">
                                <button
                                    type="button"
                                    onClick={deleteImage}
                                    className="absolute top-2 right-2 z-10 bg-[var(--admin-danger-solid)] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm hover:bg-[var(--admin-danger-solid-hover)]"
                                >X</button>
                                <div className="relative flex h-[170px] items-center justify-center overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]">
                                    <div className="relative h-full w-full">
                                        <Image
                                            alt=""
                                            src={process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL + adData.imageUrl}
                                            fill
                                            sizes="(max-width: 768px) 80vw, 500px"
                                            className="object-contain p-2"
                                        />
                                    </div>

                                </div>
                            </div>

                                : <label htmlFor="AdFileInput" className="cursor-pointer">
                                    <div className="relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--admin-border-strong)] bg-[var(--admin-surface-muted)] p-6 text-center transition-colors hover:border-[var(--admin-accent)] hover:bg-[var(--admin-danger-soft)]">
                                        {!photo.AdImage ? (
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--admin-surface)] text-lg text-[var(--admin-accent)] shadow-sm">
                                                    <IoCloudUploadSharp />
                                                </span>
                                                <span className="text-sm font-semibold text-[var(--admin-ink-soft)]">
                                                    {t("add-photo")}
                                                </span>
                                                <span className="text-[10px] text-[var(--admin-muted-soft)]">
                                                    {t("image_formats")}
                                                </span>
                                            </div>
                                        ) : (
                                            // 🖼️ Image Preview
                                            <div className="w-[100px] h-[100px] ">
                                                <Image
                                                    alt=""
                                                    src={photo.AdImage}
                                                    fill
                                                    sizes="100px"
                                                    className="w-full h-full object-contain rounded-lg"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </label>
                        }
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handeluploadAdImage}
                            className="hidden"
                            id="AdFileInput"
                        />
                        <div className="mt-5">
                            <div className="flex flex-col gap-4 ">
                                <div className="flex flex-col gap-1.5">
                                    {adNumber === 3 || adNumber === 4  || adNumber === 5 ? (
                                      <> <label className="admin-label">
                                            {t("title_ar")}
                                        </label>  <input
                                        type="text"
                                        value={adData.titleAr}
                                        onChange={(e) => setAdData((prev) => ({
                                            ...prev,
                                            titleAr: e.target.value
                                        }))}

                                        className="admin-input"
                                    /></>
                                    ) : null}

                                </div>
                                <div className="flex flex-col gap-1.5">
                                    {adNumber === 3 || adNumber === 4  || adNumber === 5 ? (
                                        <>
                                        <label className="admin-label">
                                            {t("title_en")}
                                        </label>
                                        <input
                                        type="text"
                                        value={adData.title}
                                        onChange={(e) => setAdData((prev) => ({
                                            ...prev,
                                            title: e.target.value
                                        }))}

                                        dir="ltr"
                                        className="admin-input"
                                    /></>
                                    ) : null}

                                </div>
                                <div className="flex flex-col gap-1.5 rounded-xl">
                                    <label className="admin-label">
                                        {t("choose_product")}
                                    </label>
                                    <div className="rounded-xl border border-[var(--admin-border-strong)] px-1 focus-within:border-[var(--admin-accent)]">

                                        <Select
                  options={options}
                  value={selectedProduct}
                  inputValue={searchText}
                  isSearchable
                  isLoading={searchLoading}
                  filterOption={() => true}
                  formatOptionLabel={formatOptionLabel}
                  placeholder={t("search")}
                  onInputChange={(value, actionMeta) => {
                    if (actionMeta.action === "input-change") {
                      setSearchText(value);
                    }
                    return value;
                  }}
                  onFocusedOptionChange={({ focusedOption: option }) => setFocusedOption(option)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !focusedOption) {
                      e.preventDefault();
                      clearTimeout(searchTimerRef.current);
                      searchProducts(searchText);
                    }
                  }}
                  onChange={(selected) => {
                    if (!selected) return;
                    setItemId(selected.value);
                    setSelectedProduct(selected);
                    setSearchText("");
                  }}
                  noOptionsMessage={() => t("no_products")}
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
                      color: "var(--admin-ink-soft)",
                    }),
                    menuPortal: (base) => ({ ...base, zIndex: 90 }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected
                        ? "var(--admin-accent-solid)"
                        : state.isFocused
                          ? "var(--admin-accent-soft)"
                          : "var(--admin-surface)",
                      color: state.isSelected ? "var(--admin-on-accent)" : "var(--admin-ink-soft)",
                      cursor: "pointer",
                      padding: "10px",
                      "&:hover": {
                        backgroundColor: state.isSelected ? "var(--admin-accent-solid)" : "var(--admin-accent-soft)",
                      },
                    }),
                  }}
                />
                                    </div>
                                </div>

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
                                    setSearchText("");
                                }}
                            >
                                {t("cancel")}
                            </button>
                            <button
                                type="submit"
                                id="btn-saveCategory"
                                className="admin-btn admin-btn-primary"
                                onClick={handleSubmit}
                            >
                                {isUpdateMode ? t("save-changes") : t("save")}
                            </button>

                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}