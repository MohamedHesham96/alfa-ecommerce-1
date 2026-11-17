"use client";
import Image from "next/image";
import { MdCancel } from "react-icons/md";
import { IoCloudUploadSharp } from "react-icons/io5";
import {useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../../../context/LanguageContext.js";
import { useFeature } from "../../../../context/AppConfigContext.jsx";
import { postRequest, putRequest } from "../../../../utils/requestsUtils.js";
import { getRequest } from "../../../../utils/requestsUtils.js";
import { useIdContext } from "../../../../context/idContext";
import { useRefresh } from "../../../../context/refreshContext.jsx";
import { getThumbnailUrl } from "../../../../utils/functions.jsx";
import {
  collectDescendantIds,
  flattenCategoryTree,
} from "../../../../lib/categoryTree";

export default function CategoryForm({ isFormOpen, setIsFormOpen }) {
  const [photo, setPhoto] = useState({
    imageFile: "",
    imageUrl: "",
  });
  const photoObjectUrlRef = useRef(null);

  const [icon, setIcon] = useState({
    iconFile: "",
    iconUrl: "",
  });
  const iconObjectUrlRef = useRef(null);

  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [originalParentCategoryId, setOriginalParentCategoryId] = useState(null);
  const [parentOptions, setParentOptions] = useState([]);
  const { t, locale } = useLanguage();
  const { triggerRefresh } = useRefresh();
  const [loading, setLoading] = useState();
  const categoriesTreeEnabled = useFeature("ENABLE_CATEGORIES_TREE");

  const { selectedCategoryId, setSelectedCategoryId } = useIdContext();
  const isEditMode = selectedCategoryId !== null;

  const loadParentOptions = useCallback(async () => {
    if (!categoriesTreeEnabled) {
      setParentOptions([]);
      return;
    }
    try {
      const res = await getRequest(
        "/api/admin/itemCategory/getCategoryWithItemCounts",
      );
      const tree = Array.isArray(res.data) ? res.data : [];
      setParentOptions(flattenCategoryTree(tree));
    } catch {
      setParentOptions([]);
    }
  }, [categoriesTreeEnabled]);

  const blockedParentIds = useMemo(() => {
    const blocked = new Set();
    if (!isEditMode) return blocked;
    blocked.add(selectedCategoryId);
    const current = parentOptions.find(
      (option) => option.category.itemCategoryId === selectedCategoryId,
    );
    if (current) {
      collectDescendantIds(current.category).forEach((id) => blocked.add(id));
    }
    return blocked;
  }, [isEditMode, parentOptions, selectedCategoryId]);

  const clearNewPhoto = useCallback(() => {
    if (photoObjectUrlRef.current) {
      URL.revokeObjectURL(photoObjectUrlRef.current);
      photoObjectUrlRef.current = null;
    }
    setPhoto((prev) => ({
      ...prev,
      imageFile: "",
      imageUrl: "",
    }));
  }, []);

  const removePhoto = useCallback(() => {
    if (photoObjectUrlRef.current) {
      URL.revokeObjectURL(photoObjectUrlRef.current);
      photoObjectUrlRef.current = null;
    }
    setPhoto({
      imageFile: "",
      imageUrl: "",
    });
  }, []);

  const clearNewIcon = useCallback(() => {
    if (iconObjectUrlRef.current) {
      URL.revokeObjectURL(iconObjectUrlRef.current);
      iconObjectUrlRef.current = null;
    }
    setIcon((prev) => ({
      ...prev,
      iconFile: "",
      iconUrl: "",
    }));
  }, []);

  const removeIcon = useCallback(() => {
    if (iconObjectUrlRef.current) {
      URL.revokeObjectURL(iconObjectUrlRef.current);
      iconObjectUrlRef.current = null;
    }
    setIcon({
      iconFile: "",
      iconUrl: "",
    });
  }, []);

  const handelIconUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (iconObjectUrlRef.current) {
      URL.revokeObjectURL(iconObjectUrlRef.current);
      iconObjectUrlRef.current = null;
    }
    const objectUrl = URL.createObjectURL(file);

    iconObjectUrlRef.current = objectUrl;
    setIcon((prev) => ({
      ...prev,
      iconFile: file,
      iconUrl: objectUrl,
    }));
  };

  const handelupload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photoObjectUrlRef.current) {
      URL.revokeObjectURL(photoObjectUrlRef.current);
      photoObjectUrlRef.current = null;
    }
    const objectUrl = URL.createObjectURL(file);

    photoObjectUrlRef.current = objectUrl;
    setPhoto((prev) => ({
      ...prev,
      imageFile: file,
      imageUrl: objectUrl,
    }));
  };

  const addCategory = async () => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("nameEn", nameEn);
      formData.append("nameAr", nameAr);
      formData.append("imageFile", photo.imageFile);
      formData.append("iconFile", icon.iconFile);
      if (categoriesTreeEnabled && parentCategoryId !== "") {
        formData.append("parentCategoryId", parentCategoryId);
      }
      await postRequest("/api/admin/itemCategory", formData, t("message"));
      triggerRefresh();
      if (categoriesTreeEnabled) {
        await loadParentOptions();
      }

      setSelectedCategoryId(null);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const CategoryData = useCallback(async () => {
    try {  setLoading(true);
      if (selectedCategoryId !== null) {
      

        const res = await getRequest(
          `/api/admin/itemCategory/${selectedCategoryId}`,
        );
        const resData = res.data
        setNameAr(resData.nameAr)
         setNameEn(resData.nameEn);
        const parentId = resData.parentCategoryId ?? "";
        setParentCategoryId(parentId);
        setOriginalParentCategoryId(parentId === "" ? null : parentId);
        setPhoto((prev) => ({
          ...prev,
          imageFile: "",
          imageUrl: resData.imageURL
            ? process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL +
              getThumbnailUrl(resData.imageURL)
            : "",
        }));
        setIcon((prev) => ({
          ...prev,
          iconFile: "",
          iconUrl: resData.iconURL
            ? process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL + resData.iconURL
            : "",
        }));
      } else {
        (setNameAr(""), setNameEn(""));
        setParentCategoryId("");
        setOriginalParentCategoryId(null);
        clearNewPhoto();
        clearNewIcon();
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId, clearNewPhoto, clearNewIcon]);

  const updateCategory = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("nameEn", nameEn);
      formData.append("nameAr", nameAr);
      if (photo.imageFile) {
        formData.append("imageFile", photo.imageFile);
      }
      if (icon.iconFile) {
        formData.append("iconFile", icon.iconFile);
      }
      if (categoriesTreeEnabled) {
        if (parentCategoryId !== "") {
          formData.append("parentCategoryId", parentCategoryId);
        } else if (originalParentCategoryId !== null) {
          // An omitted parent field means "keep the current parent" for older
          // clients. The explicit flag lets the admin detach this category.
          formData.append("clearParent", "true");
        }
      }
      await putRequest(
        `/api/admin/itemCategory/${selectedCategoryId}`,
        formData,
        t("message"),
      );
      triggerRefresh();
      if (categoriesTreeEnabled) {
        await loadParentOptions();
      }
      setSelectedCategoryId(null);
      setIsFormOpen(false);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    CategoryData();
  }, [selectedCategoryId, CategoryData]);

  useEffect(() => {
    if (!isFormOpen || !categoriesTreeEnabled) return;
    loadParentOptions();
  }, [isFormOpen, categoriesTreeEnabled, loadParentOptions]);

  useEffect(() => {
    return () => {
      if (photoObjectUrlRef.current) {
        URL.revokeObjectURL(photoObjectUrlRef.current);
      }
      if (iconObjectUrlRef.current) {
        URL.revokeObjectURL(iconObjectUrlRef.current);
      }
    };
  }, []);
  return (
    <div
      id="add-category-form"
      className={`fixed inset-0 bg-black/40 flex items-center justify-center p-10 z-50 ${isFormOpen ? "flex" : "hidden"}`}
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
      <div className="bg-white shadow-md shadow-slate-400 w-full max-w-[600px] flex flex-col border rounded-md">
        <div className="m-4 flex justify-between items-center">
          <h1 id="nameFormCategory" className="text-lg font-semibold">
            {" "}
            {isEditMode ? t("edit_category") : t("add_category")}
          </h1>
          <button
            className="text-3xl text-red-950  hover:text-red-800"
            onClick={() => {
              setIsFormOpen(false);
              setSelectedCategoryId(null);
            }}
          >
            <MdCancel />
          </button>
        </div>
        <hr className="h-1 mb-3"></hr>
        <div className="flex   justify-center items-center ">
          <form
            className=" md:w-[60%] xs:w-[80%] "
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div className="mb-4">
              <div className="flex flex-col gap-2 ">
                <label className="text-md text-gray-500">
                  {t("category_name")}* [en]
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  required
                  className="w-full  outline-none text-gray-900 text-lg  p-1 border rounded-md"
                />
                <label className="text-md text-gray-500">
                  {t("category_name")}* [ar]
                </label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full  outline-none text-gray-900 text-lg  p-1 border rounded-md"
                />
                {categoriesTreeEnabled ? (
                  <>
                    <label className="text-md text-gray-500">
                      {t("parent_category")}
                    </label>
                    <select
                      value={parentCategoryId}
                      onChange={(e) => setParentCategoryId(e.target.value)}
                      className="w-full outline-none text-gray-900 text-lg p-1 border rounded-md bg-white"
                    >
                      <option value="">{t("no_parent_category")}</option>
                      {parentOptions.map(({ category, depth }) => {
                        const optionId = category.itemCategoryId;
                        const name =
                          locale === "ar"
                            ? category.nameAr || category.nameEn
                            : category.nameEn || category.nameAr;
                        return (
                          <option
                            key={optionId || category.seoCode}
                            value={optionId}
                            disabled={blockedParentIds.has(optionId)}
                          >
                            {"— ".repeat(depth)}
                            {name}
                          </option>
                        );
                      })}
                    </select>
                  </>
                ) : null}
              </div>
            </div>
<div className="w-full flex  items-center justify-between">


            <label className="text-md text-gray-500">
                  {t("category_image")}
                
              {photo.imageUrl ? (
                <div className="">
                   <button
                    type="button"
                    className="text-red-600  text-base hover:text-red-800"
                    onClick={removePhoto}
                  >
                    X
                  </button>
                  <div className="flex items-center relative w-[150px] h-[150px] justify-center border-2 border-dashed border-red-300 rounded-lg hover:bg-gray-50">
                     <div className="w-full h-full relative">
                      <Image
                        alt=""
                        src={photo.imageUrl}
                        fill
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                  </div>
                 
                </div>
              ) : (
                <label htmlFor="fileInput" className="cursor-pointer ">
                  <div className="flex flex-col items-center h-[150px] w-[150px] mt-2  justify-center p-3 border-2 border-dashed border-red-300 rounded-lg hover:bg-gray-50">
                    <div className="flex flex-col justify-center items-center">
                      <span className="text-4xl text-red-600">
                        <IoCloudUploadSharp />
                      </span>
                      <span className="text-sm text-gray-500">
                        {t("add-photo")}
                      </span>
                    </div>
                  </div>
                </label>
              )}
</label>
              <input
                type="file"
                accept="image/*"
                onChange={handelupload}
                className="hidden"
                id="fileInput"
              />

            <div className="">
              <label className="text-md text-gray-500">
                {t("category_icon")}
              </label>
              {icon.iconUrl ? (
                <div className="">
                   <button
                    type="button"
                    className="text-red-600  hover:text-red-800"
                    onClick={removeIcon}
                  >
                    X
                  </button>
                  <div className="flex items-center relative h-[150px] w-[150px] justify-center border-2 border-dashed border-red-300 rounded-lg hover:bg-gray-50">
                    <div className="w-full h-full relative">
                      <Image
                        alt=""
                        src={icon.iconUrl}
                        fill
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                  </div>
                 
                </div>
              ) : (
                <label htmlFor="iconFileInput" className="cursor-pointer ">
                  <div className="flex flex-col items-center h-[150px] w-[150px] mt-2 justify-center p-3 border-2 border-dashed border-red-300 rounded-lg hover:bg-gray-50">
                    <span className="text-4xl text-red-600">
                      <IoCloudUploadSharp />
                    </span>
                    <span className="text-sm text-gray-500">
                      {t("add-icon")}
                    </span>
                  </div>
                </label>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handelIconUpload}
                className="hidden"
                id="iconFileInput"
              />
            </div>
</div>
            <div className="flex justify-center items-center mb-5">
              <button
                type="submit"
                id="btn-saveCategory"
                className={`bg-red-600 py-2 px-3 text-white mt-7  hover:bg-red-800 rounded-lg ${isEditMode ? "hidden" : "block"}`}
                onClick={addCategory}
              >
                {t("save")}
              </button>
              <button
                type="submit"
                id="btn-editCategory"
                className={`bg-red-600 py-2 px-3 text-white mt-7  hover:bg-red-800 rounded-lg  ${isEditMode ? "block" : "hidden"}`}
                onClick={updateCategory}
              >
                {t("save-changes")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
