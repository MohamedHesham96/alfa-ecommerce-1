"use client";
import Image from "next/image";
import { IoCloudUploadSharp } from "react-icons/io5";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
import AdminModal from "../../components/ui/AdminModal";
import FormField from "../../components/ui/FormField";

function UploadTile({ id, label, previewUrl, onRemove, onUpload, hint }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="admin-label">{label}</span>
      {previewUrl ? (
        <div className="relative overflow-hidden rounded-xl border border-[#e4e8f0] bg-[#f8fafc]">
          <div className="relative h-36 w-full">
            <Image
              alt=""
              src={previewUrl}
              fill
              sizes="220px"
              className="object-contain p-2"
            />
          </div>
          <button
            type="button"
            className="absolute end-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-bold text-[#b4233a] shadow-sm transition-colors hover:bg-[#fbeff2]"
            onClick={onRemove}
            aria-label={label}
          >
            ×
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="group flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#d3d9e5] bg-[#f8fafc] p-4 text-center transition-colors hover:border-[#cf4356] hover:bg-[#fdf7f8]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-[#cf4356] shadow-sm transition-transform group-hover:scale-105">
            <IoCloudUploadSharp />
          </span>
          <span className="text-xs font-semibold text-[#344054]">
            {label}
          </span>
          <span className="text-[10px] text-[#98a2b3]">{hint}</span>
        </label>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={onUpload}
        className="hidden"
        id={id}
      />
    </div>
  );
}

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
    try {
      setLoading(true);
      if (selectedCategoryId !== null) {
        const res = await getRequest(
          `/api/admin/itemCategory/${selectedCategoryId}`,
        );
        const resData = res.data;
        setNameAr(resData.nameAr);
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
        setNameAr("");
        setNameEn("");
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

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedCategoryId(null);
  };

  return (
    <div id="add-category-form">
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
      <AdminModal
        open={isFormOpen}
        onClose={closeForm}
        title={isEditMode ? t("edit_category") : t("add_category")}
        description={t("categories_description")}
        size="lg"
        closeLabel={t("close")}
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={closeForm}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              form="category-form"
              id={isEditMode ? "btn-editCategory" : "btn-saveCategory"}
              className="admin-btn admin-btn-primary"
              onClick={isEditMode ? updateCategory : addCategory}
              disabled={loading}
            >
              {isEditMode ? t("save-changes") : t("save")}
            </button>
          </>
        }
      >
        <form
          id="category-form"
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <section className="admin-form-section">
            <div className="admin-form-section-header">
              <div>
                <h3 className="admin-form-section-title">
                  {t("section_basic_info")}
                </h3>
                <p className="admin-form-section-description">
                  {t("section_basic_info_description")}
                </p>
              </div>
            </div>
            <div className="admin-form-grid admin-form-grid-2">
              <FormField
                label={`${t("category_name")} [EN]`}
                htmlFor="category-name-en"
                required
              >
                <input
                  id="category-name-en"
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  required
                  className="admin-input"
                />
              </FormField>
              <FormField
                label={`${t("category_name")} [AR]`}
                htmlFor="category-name-ar"
              >
                <input
                  id="category-name-ar"
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="admin-input"
                  dir="rtl"
                />
              </FormField>
              {categoriesTreeEnabled ? (
                <FormField
                  label={t("parent_category")}
                  htmlFor="category-parent"
                  className="md:col-span-2"
                >
                  <select
                    id="category-parent"
                    value={parentCategoryId}
                    onChange={(e) => setParentCategoryId(e.target.value)}
                    className="admin-select"
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
                </FormField>
              ) : null}
            </div>
          </section>

          <section className="admin-form-section">
            <div className="admin-form-section-header">
              <div>
                <h3 className="admin-form-section-title">
                  {t("section_images")}
                </h3>
                <p className="admin-form-section-description">
                  {t("section_images_description")}
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <UploadTile
                id="fileInput"
                label={t("category_image")}
                previewUrl={photo.imageUrl}
                onRemove={removePhoto}
                onUpload={handelupload}
                hint="PNG, JPG"
              />
              <UploadTile
                id="iconFileInput"
                label={t("category_icon")}
                previewUrl={icon.iconUrl}
                onRemove={removeIcon}
                onUpload={handelIconUpload}
                hint="PNG, SVG"
              />
            </div>
          </section>
        </form>
      </AdminModal>
    </div>
  );
}
