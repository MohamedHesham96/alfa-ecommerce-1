"use client";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { FaPlus } from "react-icons/fa";
import { GoStarFill } from "react-icons/go";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { MdBlock, MdDelete } from "react-icons/md";

import { useLanguage } from "../../../../context/LanguageContext.js";
import { useIdContext } from "../../../../context/idContext.jsx";
import { useRefresh } from "../../../../context/refreshContext.jsx";
import { deleteRequest, postRequest } from "../../../../utils/requestsUtils.js";
import { getThumbnailUrl } from "../../../../utils/functions.jsx";
import { DataTable, DataTableToolbar } from "../../components/data-table";
import { useServerDataTable } from "../../hooks/useServerDataTable";
import {
  buildCategoryProductsFilters,
  createProductsColumns,
  PRODUCTS_ENDPOINT,
  PRODUCTS_PAGE_SIZE,
} from "../../config/productsTable.config";

const EMPTY_FILTERS = [];

export default function ProductsTable({
  setIsFormOpen,
  category,
  setIsEditMode,
  fillContainer = false,
}) {
  const { t, locale } = useLanguage();
  const { refreshKey } = useRefresh();
  const { setSelectedProductId } = useIdContext();
  const setItemsRef = useRef(null);

  const patchProduct = useCallback((productId, patch) => {
    setItemsRef.current?.((prev) =>
      prev.map((product) =>
        product.itemId === productId ? { ...product, ...patch } : product,
      ),
    );
  }, []);

  const productFavorite = useCallback(
    async (productId, favorite) => {
      const res = await postRequest(
        `/api/admin/items/${productId}/favorite/${favorite}`,
        "",
        t("message"),
      );
      if (res) patchProduct(productId, { favorite });
    },
    [patchProduct, t],
  );

  const productActive = useCallback(
    async (productId, active) => {
      const res = await postRequest(
        `/api/admin/items/${productId}/activate/${active}`,
        "",
        t("message"),
      );
      if (res) patchProduct(productId, { active });
    },
    [patchProduct, t],
  );

  const productAvailable = useCallback(
    async (productId, available) => {
      const res = await postRequest(
        `/api/admin/items/${productId}/availability/${available}`,
        "",
        t("message"),
      );
      if (res) patchProduct(productId, { available });
    },
    [patchProduct, t],
  );

  const openForm = useCallback(
    (productId) => {
      setIsFormOpen(true);
      setIsEditMode(true);
      setSelectedProductId(productId);
    },
    [setIsEditMode, setIsFormOpen, setSelectedProductId],
  );

  const deleteProduct = useCallback(
    async (product) => {
      try {
        const result = await deleteRequest(
          `/api/admin/items/${product.itemId}`,
          t("message"),
        );
        if (result) {
          setItemsRef.current?.((prev) =>
            prev.filter((item) => item.itemId !== product.itemId),
          );
        }
      } catch (error) {
        // The shared request utility already surfaces the error.
      }
    },
    [t],
  );

  const columns = useMemo(
    () =>
      createProductsColumns({
        t,
        locale,
        onOpen: openForm,
        onToggleFavorite: productFavorite,
        onToggleActive: productActive,
        onToggleAvailable: productAvailable,
        onDelete: deleteProduct,
      }),
    [
      t,
      locale,
      openForm,
      productFavorite,
      productActive,
      productAvailable,
      deleteProduct,
    ],
  );

  const baseFilters = useMemo(
    () =>
      category ? buildCategoryProductsFilters(category) : EMPTY_FILTERS,
    [category],
  );

  const tableState = useServerDataTable({
    endpoint: PRODUCTS_ENDPOINT,
    columns,
    pageSize: PRODUCTS_PAGE_SIZE,
    refreshKey,
    baseFilters,
    cacheResults: true,
    getRowId: (product) => String(product.itemId),
  });

  useEffect(() => {
    setItemsRef.current = tableState.setItems;
  }, [tableState.setItems]);

  const productName = (product) =>
    locale === "ar" ? product.nameAr : product.nameEn;

  const renderMobileCard = (product) => {
    const imageUrl = product.images?.[0]?.imageUrl;
    return (
      <div
        className="admin-mobile-card cursor-pointer"
        onClick={() => openForm(product.itemId)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {imageUrl ? (
              <Image
                alt=""
                src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${getThumbnailUrl(
                  imageUrl,
                )}`}
                width={50}
                height={50}
                className="h-12 w-12 rounded-xl border border-[#e4e8f0] bg-white object-cover p-0.5"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#e4e8f0] bg-[#f8fafc] text-[10px] text-[#98a2b3]">
                {t("no_image")}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#101828]">
                {productName(product)}
              </p>
              <p className="truncate text-xs text-[#667085]">
                {t("code")}: {product.code}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label={t("featured-product")}
            className={`admin-action-icon shrink-0 ${
              product.favorite
                ? "!text-[#d97706] hover:!bg-[#fdf6e7]"
                : "!text-[#98a2b3]"
            }`}
            onClick={async (event) => {
              event.stopPropagation();
              await productFavorite(product.itemId, !product.favorite);
            }}
          >
            <GoStarFill className="text-lg" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#eef1f6] pt-3 text-xs text-[#667085]">
          <span className="inline-flex items-center rounded-lg border border-[#e4e8f0] bg-[#f8fafc] px-2 py-1 font-semibold text-[#475467]">
            {locale === "ar"
              ? product.itemCategory?.nameAr
              : product.itemCategory?.nameEn}
          </span>
          <span className="text-base font-bold text-[#101828]">
            {Number(product.price).toLocaleString("en-US")}{" "}
            <span className="text-xs font-medium text-[#667085]">
              {t("currency")}
            </span>
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#eef1f6] pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                product.active
                  ? "border-[#bfe8d7] bg-[#e7f7f0] text-[#087443]"
                  : "border-[#e4e8f0] bg-[#f8fafc] text-[#667085]"
              }`}
              onClick={(event) => {
                event.stopPropagation();
                productActive(product.itemId, !product.active);
              }}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  product.active ? "bg-[#0e8a5f]" : "bg-[#98a2b3]"
                }`}
              />
              {product.active ? t("active") : t("inactive")}
            </button>
            <button
              type="button"
              aria-label={product.available ? t("available_in_store") : t("Currently_unavailable")}
              className="admin-action-icon"
              onClick={(event) => {
                event.stopPropagation();
                productAvailable(product.itemId, !product.available);
              }}
            >
              {product.available ? (
                <IoCheckmarkCircleOutline className="text-lg text-[#0e8a5f]" />
              ) : (
                <MdBlock className="text-[#c2415a]" />
              )}
            </button>
          </div>
          <button
            type="button"
            className="admin-action-delete"
            onClick={(event) => {
              event.stopPropagation();
              deleteProduct(product);
            }}
          >
            <MdDelete className="text-sm" />
            {t("delete")}
          </button>
        </div>
      </div>
    );
  };

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
            setSelectedProductId(null);
            setIsEditMode(false);
          }}
        >
          <FaPlus className="text-xs" />
          <span className="hidden sm:inline">{t("add_new_product")}</span>
        </button>
      }
    />
  );

  return (
    <div
      className={
        fillContainer
          ? "flex h-full min-h-0 w-full flex-col"
          : "w-full"
      }
    >
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
        className={fillContainer ? "flex h-full min-h-0 w-full flex-col" : ""}
        mobileWrapperClassName={
          fillContainer
            ? "lg:hidden flex-1 min-h-0 mt-3 p-3 overflow-y-auto min-w-0 rounded-2xl border border-[#e4e8f0] bg-[#f8fafc]"
            : "lg:hidden max-h-[600px] mt-3 p-3 rounded-2xl border border-[#e4e8f0] bg-[#f8fafc] overflow-y-auto min-w-0"
        }
        desktopWrapperClassName={
          fillContainer
            ? "admin-table-shell hidden lg:block flex-1 min-h-0 min-w-0 mt-3 w-full overflow-x-auto overflow-y-auto"
            : "admin-table-shell hidden lg:block max-h-[560px] min-w-0 mt-3 w-full overflow-x-auto overflow-y-auto"
        }
        tableClassName="admin-table"
        rowClassName="cursor-pointer"
        emptyMessage={t("no_data")}
      />
    </div>
  );
}
