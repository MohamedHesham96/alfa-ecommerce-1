"use client";
import Image from "next/image";
import { MdBlock, MdCancel } from "react-icons/md";
import {
  IoCheckmarkCircleOutline,
  IoCloudUploadSharp,
} from "react-icons/io5";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "../../../../context/LanguageContext.js";
import { useFeature } from "../../../../context/AppConfigContext.jsx";
import { FaCircle } from "react-icons/fa";
import {
  getCategories,
  getProductDetails,
  getThumbnailUrl,
} from "../../../../utils/functions.jsx";
import { deleteRequest, postRequest, putRequest } from "../../../../utils/requestsUtils.js";
import { useRefresh } from "../../../../context/refreshContext.jsx";
import { useIdContext } from "../../../../context/idContext.jsx";
import { GoStarFill } from "react-icons/go";
import { toast } from "react-toastify";
import Select from "react-select";
import { ImBlocked } from "react-icons/im";

const toDimensionNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function FormProduct({ isFormOpen, setIsFormOpen, isEditMode ,setIsEditMode }) {
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
  const isBase64 = (src) => {
    return typeof src === "string" && src.startsWith("data:");
  };
  // const images = [
  //   { key: "mainImage", label: "mainImage", inputId: "fileInput-mainImage" },
  //   { key: "img2", label: "img2", inputId: "fileInput-img2" },
  //   { key: "img3", label: "img3", inputId: "fileInput-img3" },
  // ];

  const [product, setProduct] = useState({
    nameEn: "",
    nameAr: "",
    price: null,
    oldPrice: null,
    descriptionEn: "",
    descriptionAr: "",
    seoCode: '',
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
    // mainImagefile: "",
    // img2: "",
    // img2file: "",
    // img2ID: null,
    // img3: "",
    // img3file: "",
    // img3ID: null,
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
    } catch (error) { }
  }, []);

  // التحقق من صحة البيانات
  // const validateForm = () => {
  //   if (!product.nameEn || !product.nameAr) {
  //     toast.error(t("product_name_required"));
  //     return false;
  //   }
  //   if (!product.price) {
  //     toast.error(t("price_required"));
  //     return false;
  //   }
  //   if (!product.category.id) {
  //     toast.error(t("category_required"));
  //     return false;
  //   }
  //   if (!product.descriptionEn || !product.descriptionAr) {
  //     toast.error(t("description_required"));
  //     return false;
  //   }
  //   return true;
  // };

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
      releaseYear:""
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
    releaseYear:product.releaseYear
  };

  const validateItemDimensions = () => {
    if (!itemDimensionsEnabled) return true;
    const dimensions = [product.length, product.width, product.height];
    if (dimensions.some((value) => value === "" || value === null || value === undefined)) {
      toast.error(t("item_dimensions_required"));
      return false;
    }
    if (dimensions.some((value) => !Number.isFinite(Number(value)) || Number(value) <= 0)) {
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
      const respose = await postRequest("/api/admin/items", fields, t("message"));
      if (!respose) return;

      setSelectedProductId(respose.itemId || respose.data?.itemId || respose.id);
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
      await postRequest(`/api/admin/items/${selectedProductId}/images`,
        formData,""
      )
            toast.success(t("images_saved_successfully"));

            triggerRefresh();
productData()
    }
    catch (err) {
      console.log(err)
    }
  }
  const deleteProductImg = async(imageId ,index)=>{
    try{
      if(imageId) {
      const res =  await deleteRequest(`/api/admin/items/${selectedProductId}/images/${imageId}` ,t("message"))
     console.log(res)
     if(res.success){
       removeItemImage(index)
     }
     
      }else{
        removeItemImage(index)
      }
      

    }
    catch(err){}
  }

  // جلب بيانات المنتج للتعديل
  const productData = useCallback(async () => {
    try {
      setLoading(true);

      if (selectedProductId !== null) {
        resetFormState();
        const res = await getProductDetails(selectedProductId);
        const resData = res.data;
        console.log(resData)
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
          releaseYear:resData.releaseYear,
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
        console.log(existingImages)
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

  return (
    <div
      id="add-product-form"
      className={` fixed inset-0 bg-black/40 flex items-center justify-end z-50 p-5  ${isFormOpen ? "flex" : "hidden"}`}
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
      <form
        className="bg-white shadow-md shadow-slate-400 rounded-lg w-full  px-7 pb-10 border overflow-hidden xs:overflow-y-scroll h-full"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="h-16 flex justify-between items-center">
          <h1 id="nameFormProduct" className="text-xl font-semibold">
            {isEditMode ? t("edit_product") : t("add_product")}
          </h1>
          <button
            className="text-2xl text-gray-500 hover:text-red-800 transition-colors"
            onClick={() => {
              setIsFormOpen(false);
              setSelectedProductId(null);
              resetFormState()
            }}
            type="button"
          >
            <MdCancel />
          </button>
        </div>
        <hr className="h-1"></hr>

        {/* <hr className="my-5" /> */}
        <div className="flex flex-col lg:flex-row w-full justify-between items-start gap-0 lg:gap-6">
        {showProductData && (
          <div className={showImages ? "w-full lg:flex-1" : "w-full"}>
        <div className=" grid grid-cols-3 gap-3 mt-3">
          {/* <div className=" w-full  md:flex-row  xs:flex-col gap-3"> */}
          <div className="flex-1">
            <label className="text-xs text-gray-600 font-semibold block mb-1">
              {t("product_name")}* [En]
            </label>
            <input
              type="text"
              value={product.nameEn || ""}
              onChange={(e) =>
                setProduct((prev) => ({ ...prev, nameEn: e.target.value }))
              }
              required
              className="w-full  outline-none  text-base  my-1  p-2 border rounded-md focus:border-red-600 transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-600 font-semibold block mb-1">
              {t("product_name")}* [Ar]
            </label>
            <input
              type="text"
              value={product.nameAr || ""}
              onChange={(e) =>
                setProduct((prev) => ({ ...prev, nameAr: e.target.value }))
              }
              required
              className="w-full  outline-none  text-base my-1  p-2 border rounded-md focus:border-red-600 transition-colors"
            />
          </div>
          {/* </div> */}

          {/* <div className="flex items-center md:flex-row  xs:flex-col  justify-between gap-3 mt-3"> */}
          <div className="w-full">
            <label className="text-xs text-gray-600 font-semibold block mb-1">
              {t("product_code")}
            </label>
            <input
              type="text"
              value={product.code || ""}
              onChange={(e) =>
                setProduct((prev) => ({ ...prev, code: e.target.value }))
              }
              required
              className="w-full  outline-none  text-base  my-1  p-2 border rounded-md focus:border-red-600 transition-colors"
            />
          </div>
          <div className="w-full">
            <label className="text-xs text-gray-600 font-semibold block mb-1">
              {t("Price")}</label>
            <input
              type="number"
              value={product.price || ""}
              onChange={(e) =>
                setProduct((prev) => ({ ...prev, price: e.target.value }))
              }
              required
              className="w-full  outline-none  text-base  my-1  p-2 border rounded-md focus:border-red-600 transition-colors"
            />
          </div>
          <div className="w-full">
            <label className="text-xs text-gray-600 font-semibold block mb-1">
              {t("old_price") + " " + "[" + t("option") + "]"} </label>
            <input
              type="number"
              value={product.oldPrice || ""}
              onChange={(e) =>
                setProduct((prev) => ({ ...prev, oldPrice: e.target.value }))
              }
              className="w-full  outline-none  text-base  my-1  p-2 border rounded-md focus:border-red-600 transition-colors"

            />
          </div>
          <div className="w-full">
            <label className="text-xs text-gray-600 font-semibold block mb-1">
              {t("ram")}
            </label>
            <input
              type="text"
              value={product.ram || ""}
              onChange={(e) =>
                setProduct((prev) => ({ ...prev, ram: e.target.value }))
              }
              
              className="w-full  outline-none  text-base  my-1  p-2 border rounded-md focus:border-red-600 transition-colors"
            />
          </div>
          <div className="w-full">
            <label className="text-xs text-gray-600 font-semibold block mb-1">
              {t("flash")}
            </label>
            <input
              type="text"
              value={product.flash || ""}
              onChange={(e) =>
                setProduct((prev) => ({ ...prev, flash: e.target.value }))
              }
              
              className="w-full  outline-none  text-base  my-1  p-2 border rounded-md focus:border-red-600 transition-colors"
            />
          </div>
          <div className="w-full">
            <label className="text-xs text-gray-600 font-semibold block mb-1">
              {t("contents")}
            </label>
            <input
              type="text"
              value={product.contents || ""}
              onChange={(e) =>
                setProduct((prev) => ({ ...prev, contents: e.target.value }))
              }
              
              className="w-full  outline-none  text-base  my-1  p-2 border rounded-md focus:border-red-600 transition-colors"
            />
          </div>
          {itemDimensionsEnabled && (
            <>
              <div className="w-full">
                <label className="text-xs text-gray-600 font-semibold block mb-1">
                  {t("length")}*
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={product.length}
                  onChange={(e) =>
                    setProduct((prev) => ({ ...prev, length: e.target.value }))
                  }
                  required={itemDimensionsEnabled}
                  className="w-full  outline-none  text-base  my-1  p-2 border rounded-md focus:border-red-600 transition-colors"
                />
              </div>
              <div className="w-full">
                <label className="text-xs text-gray-600 font-semibold block mb-1">
                  {t("width")}*
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={product.width}
                  onChange={(e) =>
                    setProduct((prev) => ({ ...prev, width: e.target.value }))
                  }
                  required={itemDimensionsEnabled}
                  className="w-full  outline-none  text-base  my-1  p-2 border rounded-md focus:border-red-600 transition-colors"
                />
              </div>
              <div className="w-full">
                <label className="text-xs text-gray-600 font-semibold block mb-1">
                  {t("height")}*
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={product.height}
                  onChange={(e) =>
                    setProduct((prev) => ({ ...prev, height: e.target.value }))
                  }
                  required={itemDimensionsEnabled}
                  className="w-full  outline-none  text-base  my-1  p-2 border rounded-md focus:border-red-600 transition-colors"
                />
              </div>
            </>
          )}
          <div className="w-full">
            <label className="text-xs text-gray-600 font-semibold block mb-1">
              {t("brand")}
            </label>
            <div className=" border rounded-md">
              <Select
                options={[
                  { value: "Senator", label: t("Senator") },
                  { value: "OMEGA", label: t("OMEGA") },
                  { value: "PANORAMA", label: t("PANORAMA") },
                  { value: "IBOX", label: t("IBOX") },
                ]}
                value={
                  product.brand
                    ? { value: product.brand, label: t(product.brand) }
                    : null
                }
                onChange={(option) => {
                  setProduct((prev) => ({
                    ...prev,
                    brand: option ? option.value : "",
                  }));
                }}
                isSearchable={false}
                placeholder={t("brand")}
                className="placeholder:text-sm"
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
                      backgroundColor: state.isSelected
                        ? "#dc2626"
                        : "#fee2e2",
                    },
                  }),
                }}
              />
            </div>
          </div>
          <div className="w-full my-1">
            <label className="text-xs text-gray-600 font-semibold block mb-1">
              {t("Category")}*
            </label>
            <div className=" border rounded-md">
              <Select
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
                className="placeholder:text-sm"
                styles={{
                  control: (provided) => ({
                    ...provided,
                    border: "none",
                    boxShadow: "none",
                    fontWeight: "600",
                    height: "100%",
                    width: "100%",
                  }),
                  option: (provided) => ({
                    ...provided,
                    // backgroundColor: '#b91c1c',
                    color: "white",
                    fontSize: "18px",
                    fontWeight: "600",
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
                      backgroundColor: state.isSelected
                        ? "#dc2626"
                        : "#fee2e2",
                    },
                  }),
                }}
              />
            </div>
          </div>
          {/* </div> */}

          {/* <div className="flex md:flex-row  xs:flex-col items-start  justify-between gap-3"> */}

          {/* </div> */}

          <div className="w-full">
            <label className="text-xs text-gray-600 font-semibold block mb-1">
              SEO {t("code")}</label>
            <input
              value={product.seoCode || ""}
              onChange={(e) => {
                setProduct((prev) => ({
                  ...prev,
                  seoCode: e.target.value,
                }));
              }}
              id="seoCode"
              className="  w-full outline-none  text-base  my-1  p-2 border rounded-md"
            />
          </div>
           <div className="w-full">
            <label className="text-xs text-gray-600 font-semibold block mb-1">
               {t("releaseYear")}</label>
            <input
              value={product.releaseYear || ""}
              onChange={(e) => {
                setProduct((prev) => ({
                  ...prev,
                  releaseYear: e.target.value,
                }));
              }}
              id="releaseYear"
              className="  w-full outline-none  text-base  my-1  p-2 border rounded-md"
            />
          </div>
          <div className="w-full  col-span-3">
            <label className="text-xs text-gray-600 font-semibold block mb-2">
              {t("product_state")}
            </label>
            <div className="flex md:flex-row  xs:flex-col items-center  justify-between gap-3">
              {/* متاح في المتجر */}
              <div className=" flex items-center justify-between h-10 w-full    px-3 border rounded-md ">
                <h1 className="text-xs text-gray-600">
                  {t("visible_in_store")}
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    setEnabledActive(!enabledActive);
                  }}
                  className={`transition-colors duration-200 ${enabledActive ? "text-green-600" : "text-gray-300"
                    }`}
                >
                  <FaCircle />
                </button>
              </div>
              <div className=" flex items-center justify-between w-full  h-10   px-3  border rounded-md ">
                <h1 className="text-xs text-gray-600">
                  {t("featured-product")}
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    setEnabledFavorite(!enabledFavorite);
                  }}
                  className={`text-xl transition-colors duration-200 ${enabledFavorite ? "text-yellow-500" : "text-gray-400"
                    }`}
                >
                  <GoStarFill />
                </button>
              </div>
              <div className=" flex items-center justify-between h-10 w-full    px-3 border rounded-md ">
                <h1 className="text-xs text-gray-600">
                  {t("available_in_store")}
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    setEnabledAvailable(!enabledAvailable);
                  }}
                  className={`transition-colors duration-200`}
                >
                  {enabledAvailable ?
                    <IoCheckmarkCircleOutline className="text-green-500 text-lg" /> :
                    <MdBlock className="text-red-500" />
                  }
                </button>
              </div>
            </div>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-700 font-semibold block mb-1">
              {t("description")}* [En]
            </label>
            <textarea
              required
              value={product.descriptionEn || ""}
              onChange={(e) =>
                setProduct((prev) => ({
                  ...prev,
                  descriptionEn: e.target.value,
                }))
              }
              rows={3}
              className="w-full  outline-none text-base p-2 border rounded-md focus:border-red-600 transition-colors resize-none"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-700 font-semibold block mb-1 ">
              {t("description")}* [Ar]
            </label>

            <textarea
              required
              value={product.descriptionAr || ""}
              onChange={(e) =>
                setProduct((prev) => ({
                  ...prev,
                  descriptionAr: e.target.value,
                }))
              }
              rows={3}
              className="w-full  outline-none text-base p-2 border rounded-md focus:border-red-600 transition-colors resize-none"
            />
          </div>
        </div>
        {/* <hr className="my-5"></hr> */}
        <div className="flex  px-4  py-4  rounded-md justify-center items-center ">
          <div className="flex justify-between w-full gap-3 items-center">
            <div className="flex  items-center gap-2">
              <button
                type="submit"
                id="btn-saveProduct"
                className={`bg-red-600 text-sm w-[150px] px-3 py-2 text-white flex-1 hover:bg-red-800 rounded-lg transition-colors ${isEditMode ? "hidden" : ""}`}
                onClick={addProductData}
                disabled={loading}
              >
                {t("save_data")}
              </button>

              {isEditMode && (
                <button
                  type="submit"
                  id="btn-editProduct"
                  className={`bg-[#CD4354] text-sm  w-[150px] my-5 px-3 py-2 text-white flex-1  hover:bg-red-800 rounded-lg transition-colors ${isEditMode ? "" : "hidden"}`}
                  onClick={updateProduct}
                  disabled={loading}
                >
                  {t("save-changes")}
                </button>
              )}
            </div>

            {/* <button
              type="button"
              className="bg-white w-full  border h-8  px-3 text-gray-700   hover:bg-red-800 hover:text-white rounded-lg transition-colors"
              onClick={() => {
                setIsFormOpen(false);
                setSelectedProductId(null);
              }}
              disabled={loading}
            >
              {t("cancel")}
            </button> */}
          </div>

        </div>
        </div>
          )}
        {showImages && (
          <div className={`${showProductData ? "lg:w-1/3 xs:w-full " : "lg:w-1/3 xs:w-full"} animate-fade-in-up p-4 sm:p-5`}>
              <div className="mb-4 w-full flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">
                  {t("item_images")}
                </h2>
              </div>
                <div className="grid grid-cols-3 gap-5">
                  <div className="group relative h-[150px] w-full cursor-pointer rounded-2xl border-2 border-dashed border-red-300 bg-white transition-colors duration-300 hover:border-red-500 hover:bg-red-50 ">
                    <label
                      htmlFor="productImg_fileInput"
                      className="absolute inset-0 flex flex-col items-center  justify-center gap-2 cursor-pointer"
                    >
                      <span
                        id="label-uplod"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-red-500 shadow-sm transition-transform duration-300 group-hover:scale-110"
                      >
                        <IoCloudUploadSharp className="text-xl" />
                      </span>
                      <span className="flex flex-col items-center gap-1">
                        <h1 className="text-sm font-medium text-gray-700">
                          {t("click_to_upload")}
                        </h1>
                        <h2 className="text-[10px] text-gray-500">
                          PNG, JPG or GIF
                        </h2>
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
                  </div>
                  {itemImages.map((img, index) => (
                        
                      <div
                      key={index}
                      className="  h-[130px] w-full   bg-white"
                    >
                     <button
                        type="button"
                        className="  flex  items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm backdrop-blur transition-all duration-200 hover:scale-110 hover:bg-red-600 hover:text-white"
                        onClick={() => {
                          
                           deleteProductImg(img.existingId , index)
                            
                        }}
                      >
                        <MdCancel className="text-lg" />
                      </button>
                      <Image
                        src={img.existingId ? getThumbnailUrl(img.preview) : img.preview}
                        alt=""
                     height={100}
                      width={100}
                        className="h-full w-full  rounded-xl"
                      />
                     
                    </div>
                    
                  ))}
                </div>

              <div className="mt-5 flex justify-start">
                <button
                  type="submit"
                  id="btn-saveProduct"
                  className={`bg-[#CD4354] text-sm w-[150px] my-5 px-3 py-2 text-white  hover:bg-red-800 rounded-lg transition-colors `}
                  onClick={addProductImges}
                  disabled={loading}
                >
                  {t("save_images")}
                </button>
              </div>
            </div>
          )}
        </div>

      </form>
    </div>
  );
}
