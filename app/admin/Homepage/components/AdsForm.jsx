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
                    <div className="w-[30px] h-[30px] bg-gray-100 rounded-md" />
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
            className={`fixed inset-0 bg-black/40 flex items-center justify-center z-50 ${isFormOpen ? "flex" : "hidden"}`}
        >
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
            <div className="bg-white w-[95%] max-w-[550px] flex flex-col rounded-3xl shadow-2xl">
                <div className="m-4 flex justify-between items-center">
                    <h1 id="nameFormCategory" className="text-xl font-bold text-gray-800">
                        {isUpdateMode ? t("edit_advert") : t("add_advert") + " " + "[" + adNumber + "]"}
                    </h1>
                    <button
                        className="text-3xl text-red-950  hover:text-red-800 transition-transform hover:scale-110"
                        onClick={() => {
                            setIsFormOpen(false);
                            clearNewImage();
                            setSelectedProduct(null)
                            setSearchText("")
                        }}
                    >
                        <MdCancel />
                    </button>
                </div>
                <hr className="h-1 mb-3"></hr>
                <div className="flex justify-center items-center px-4">
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
                                className="absolute top-2 right-2 z-10 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm hover:bg-red-800"
                            >X</button>
                            <div className="flex items-center relative h-[170px] justify-center border-2 border-dashed border-red-300 rounded-xl hover:bg-gray-50">
                                <div className="w-full h-full relative">
                                    <Image
                                        alt=""
                                        src={photo.AdImage}
                                        fill
                                        sizes="(max-width: 768px) 80vw, 500px"
                                        className="w-full h-full object-contain rounded-xl"
                                    />
                                </div>

                            </div>
                        </div>

                            : adData.imageUrl ? <div className="relative">
                                <button
                                    type="button"
                                    onClick={deleteImage}
                                    className="absolute top-2 right-2 z-10 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm hover:bg-red-800"
                                >X</button>
                                <div className="flex items-center relative h-[170px] justify-center border-2 border-dashed border-red-300 rounded-xl hover:bg-gray-50">
                                    <div className="w-full h-full relative">
                                        <Image
                                            alt=""
                                            src={process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL + adData.imageUrl}
                                            fill
                                            sizes="(max-width: 768px) 80vw, 500px"
                                            className="w-full h-full object-contain rounded-xl"
                                        />
                                    </div>

                                </div>
                            </div>

                                : <label htmlFor="AdFileInput" className="cursor-pointer ">
                                    <div className="flex flex-col items-center relative  justify-center p-5 border-2 border-dashed border-red-300 rounded-xl hover:bg-red-50 transition-colors">
                                        {!photo.AdImage ? (
                                            <div className="flex flex-col justify-center items-center">
                                                <span className="text-4xl text-red-600">
                                                    <IoCloudUploadSharp />
                                                </span>
                                                <span className="text-sm text-gray-500 mt-2">
                                                    {t("add-photo")}
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
                                      <> <label className="text-md font-semibold text-gray-600">
                                            {t("title_ar")}
                                        </label>  <input
                                        type="text"
                                        value={adData.titleAr}
                                        onChange={(e) => setAdData((prev) => ({
                                            ...prev,
                                            titleAr: e.target.value
                                        }))}

                                        className="w-full outline-none text-gray-900 text-sm p-2.5 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
                                    /></> 
                                    ) : null}
                                  
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    {adNumber === 3 || adNumber === 4  || adNumber === 5 ? (
                                        <>
                                        <label className="text-md font-semibold text-gray-600">
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
                                        className="w-full outline-none text-gray-900 text-sm p-2.5 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
                                    /></>
                                    ) : null}
                                   
                                </div>
                                <div className="flex flex-col gap-1.5 rounded-xl">
                                    <label className="text-md font-semibold text-gray-600">
                                        {t("choose_product")}
                                    </label>
                                    <div className="border rounded-xl border-red-300 px-1 focus-within:border-red-500">

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
                  noOptionsMessage={() => t("no_products") || "لا توجد منتجات"}
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

                            </div>
                        </div>



                        <div className="flex justify-center items-center pb-4">
                            <button
                                type="submit"
                                id="btn-saveCategory"
                                className={`bg-red-600 py-2.5 px-10 text-white mt-7  hover:bg-red-800 rounded-xl font-semibold transition-colors shadow-md hover:shadow-lg `}
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