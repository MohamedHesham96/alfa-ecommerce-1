"use client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";

import { useLanguage } from "../../../../context/LanguageContext.js";
import { useIdContext } from "../../../../context/idContext";
import { useRefresh } from "../../../../context/refreshContext";
import { deleteRequest } from "../../../../utils/requestsUtils.js";
import { getThumbnailUrl } from "../../../../utils/functions";
import { DataTable, DataTableToolbar } from "../../components/data-table";
import { useServerDataTable } from "../../hooks/useServerDataTable";
import { prefetchTablePage } from "../../services/tablePrefetch";
import {
  buildCategoryProductsFilters,
  PRODUCTS_ENDPOINT,
  PRODUCTS_PAGE_SIZE,
} from "../../config/productsTable.config";
import { createCategoryColumns } from "../../config/categoriesTable.config";
import ProductsByCategoryPopup from "./ProductsByCategoryPopup";

const PAGE_SIZE = 15;

export default function CategorysTable({ setIsFormOpen }) {
  const { t, locale } = useLanguage();
  const { triggerRefresh, refreshKey } = useRefresh();
  const { setSelectedCategoryId } = useIdContext();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [popupShow, setPopupShow] = useState(false);

  const openForm = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setIsFormOpen(true);
  };

  const openProducts = (category) => {
    setSelectedCategory(category);
    setPopupShow(true);
  };

  const deleteCategory = async (categoryId) => {
    try {
      await deleteRequest(
        `/api/admin/itemCategory/${categoryId}`,
        t("message"),
      );
      triggerRefresh();
    } catch {
      // Shared request utility already surfaces the error.
    }
  };

  const columns = useMemo(
    () =>
      createCategoryColumns({
        t,
        locale,
        onOpen: openProducts,
        onEdit: openForm,
        onDelete: deleteCategory,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, locale],
  );

  const tableState = useServerDataTable({
    endpoint: "/api/admin/itemCategory/search",
    columns,
    pageSize: PAGE_SIZE,
    refreshKey,
    getRowId: (category) => String(category.itemCategoryId),
  });

  // Warm the product popup cache for the categories already on screen. The
  // first click then renders the table immediately instead of the skeleton.
  useEffect(() => {
    tableState.items.forEach((category) => {
      void prefetchTablePage({
        endpoint: PRODUCTS_ENDPOINT,
        pageSize: PRODUCTS_PAGE_SIZE,
        filters: buildCategoryProductsFilters(category.itemCategoryId),
        refreshKey,
      });
    });
  }, [tableState.items, refreshKey]);

  const renderMobileCard = (category) => (
    <div
      key={category.itemCategoryId}
      className="admin-mobile-card cursor-pointer"
      onClick={() => openProducts(category)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {category.imageURL ? (
            <Image
              alt=""
              src={
                process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL +
                getThumbnailUrl(category.imageURL ?? "")
              }
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-xl border border-[#e4e8f0] bg-white object-cover p-0.5"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e4e8f0] bg-[#f8fafc] text-[10px] text-[#98a2b3]">
              {t("no_image")}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#101828]">
              {locale === "ar" ? category.nameAr : category.nameEn}
            </p>
            <p className="mt-0.5 text-xs text-[#667085]">
              {t("main_category")}
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#f3c6cd] bg-[#fbeff2] px-2.5 py-1 text-xs font-semibold text-[#b4233a]">
          <span className="text-sm font-bold">{category.itemsCount ?? 0}</span>
          <span className="text-[10px]">{t("products_category")}</span>
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-[#eef1f6] pt-3">
        <button
          type="button"
          className="admin-action-edit"
          onClick={(event) => {
            event.stopPropagation();
            openForm(category.itemCategoryId);
          }}
        >
          <MdEdit className="text-sm" />
          {t("edit")}
        </button>
        <button
          type="button"
          className="admin-action-delete"
          onClick={(event) => {
            event.stopPropagation();
            deleteCategory(category.itemCategoryId);
          }}
        >
          <MdDelete className="text-sm" />
          {t("delete")}
        </button>
      </div>
    </div>
  );

  const toolbar = (
    <DataTableToolbar
      table={tableState.table}
      searchValue={tableState.globalFilter}
      onSearchChange={tableState.setGlobalFilter}
      actions={
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={() => {
            setIsFormOpen(true);
            setSelectedCategoryId(null);
          }}
        >
          <FaPlus className="text-xs" />
          {t("add_category")}
        </button>
      }
    />
  );

  return (
    <div>
      <ProductsByCategoryPopup
        category={selectedCategory}
        popupShow={popupShow}
        setPopupShow={setPopupShow}
      />
      <DataTable
        table={tableState.table}
        loading={tableState.loading}
        loadingMore={tableState.loadingMore}
        hasMore={tableState.hasMore}
        error={tableState.error}
        sentinelRef={tableState.sentinelRef}
        onRetry={tableState.reload}
        toolbar={toolbar}
        mobileCard={renderMobileCard}
        mobileWrapperClassName="lg:hidden mt-3 rounded-2xl border border-[#e4e8f0] bg-[#f8fafc] p-3"
        desktopWrapperClassName="admin-table-shell hidden lg:block mt-3 w-full overflow-x-auto overflow-y-auto"
        tableClassName="admin-table"
        rowClassName="cursor-pointer"
        emptyMessage={t("no_data")}
      />
    </div>
  );
}
