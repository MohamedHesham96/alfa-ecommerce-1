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
      className="admin-modal-overlay"
    >
      {/* The panel keeps one full size for every category, regardless of how
          many product rows the selected category has. */}
      <div className="admin-modal max-w-6xl h-[85vh]">
        <div className="admin-modal-header shrink-0 items-center">
          <h2 className="truncate admin-modal-title">
            {categoryName}
          </h2>
          <button
            type="button"
            aria-label={t("close")}
            title={t("close")}
            className="admin-modal-close shrink-0"
            onClick={() => {
              setPopupShow(false);
            }}
          >
            <MdCancel className="text-xl" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-[var(--admin-surface-muted)]">
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
