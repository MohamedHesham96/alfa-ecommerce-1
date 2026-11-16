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
      className="mx-2 my-3 cursor-pointer rounded-xl border-b bg-white p-3 hover:bg-gray-100"
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
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded-xl border p-1"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-gray-100 text-[10px] text-gray-400">
              {t("no_image")}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">
              {locale === "ar" ? category.nameAr : category.nameEn}
            </h1>
            <h1 className="text-xs text-gray-600">{t("main_category")}</h1>
          </div>
        </div>
        <div className="shrink-0 rounded-full bg-red-100 px-3 py-1 text-center text-xs font-semibold text-red-600">
          <h1>{category.itemsCount ?? 0}</h1>
          <h2>{t("products_category")}</h2>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 border-t pt-3">
        <button
          type="button"
          className="flex items-center gap-1 rounded-md bg-blue-300 px-3 py-1 text-sm font-semibold text-blue-800 hover:bg-blue-400"
          onClick={(event) => {
            event.stopPropagation();
            openForm(category.itemCategoryId);
          }}
        >
          <MdEdit />
          {t("edit")}
        </button>
        <button
          type="button"
          className="flex items-center gap-1 rounded-md bg-red-300 px-3 py-1 text-sm font-semibold text-red-800 hover:bg-red-400"
          onClick={(event) => {
            event.stopPropagation();
            deleteCategory(category.itemCategoryId);
          }}
        >
          <MdDelete />
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
      className="!p-3"
      actions={
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-md bg-[#CD4354] p-2 text-center text-white xs:text-xs md:text-sm"
          onClick={() => {
            setIsFormOpen(true);
            setSelectedCategoryId(null);
          }}
        >
          <span>
            <FaPlus />
          </span>
          <h1>{t("add_category")}</h1>
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
        mobileWrapperClassName="lg:hidden mt-3 h-auto rounded-xl border overflow-y-scroll"
        desktopWrapperClassName="hidden lg:block mt-3 w-full overflow-y-auto"
        tableClassName="w-full h-auto table-fixed rounded-3xl border"
        headerClassName="bg-[#f0eff0] h-12 rounded-lg text-justify sticky top-0 z-10 text-xs"
        rowClassName="text-red-950 border-t w-full hover:bg-gray-100 cursor-pointer"
        emptyMessage={t("no_data")}
      />
    </div>
  );
}
