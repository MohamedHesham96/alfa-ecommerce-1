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

  if (!popupShow || !category) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={categoryName}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      {/* The panel keeps one full size for every category, regardless of how
          many product rows the selected category has. */}
      <div className="flex h-[85vh] w-[90%] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b px-4 py-2">
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

        <div className="flex min-h-0 flex-1 flex-col bg-white">
          <FormProduct
            isFormOpen={isFormOpen}
            isEditMode={isEditMode}
            setIsFormOpen={setIsFormOpen}
          />
          <ProductsByCategory
            category={category?.itemCategoryId}
            setIsEditMode={setIsEditMode}
            setIsFormOpen={setIsFormOpen}
            fillContainer
          />
        </div>
      </div>
    </div>
  );
}
