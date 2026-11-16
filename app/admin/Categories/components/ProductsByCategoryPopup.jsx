"use client";
import { useState } from "react";
import { MdCancel } from "react-icons/md";
import { useLanguage } from "../../../../context/LanguageContext.js";
import ProductsByCategory from "../../Products/components/ProductsTable";
import FormProduct from "../../Products/components/ProductForm";

export default function ProductsByCategoryPopup({
  category,
  popupShow,
  setPopupShow,
}) {
  const { t, locale } = useLanguage();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const categoryName = category
    ? locale === "ar"
      ? category.nameAr || category.nameEn
      : category.nameEn || category.nameAr
    : "";

  return (
    <div
      className={`flex justify-center items-center w-full ${popupShow ? "block" : "hidden"}`}
    >
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="w-[90%]">
          <div className="w-full bg-white px-4 py-2 flex items-center justify-between gap-4 border-b">
            <h2 className="truncate text-lg font-semibold text-gray-800">
              {categoryName}
            </h2>
            <button
              type="button"
              aria-label={t("close")}
              title={t("close")}
              className="shrink-0"
              onClick={() => {
                setPopupShow(false);
              }}
            >
              <MdCancel className="text-3xl text-red-700" />
            </button>
          </div>

          <div className="bg-white">
            <FormProduct
              isFormOpen={isFormOpen}
              isEditMode={isEditMode}
              setIsFormOpen={setIsFormOpen}
            />
            <ProductsByCategory
              category={category?.itemCategoryId}
              setIsEditMode={setIsEditMode}
              setIsFormOpen={setIsFormOpen}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
