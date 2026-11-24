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
  onStatsChange,
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
      if (res) {
        patchProduct(productId, { favorite });
        onStatsChange?.();
      }
    },
    [patchProduct, t, onStatsChange],
  );

  const productActive = useCallback(
    async (productId, active) => {
      const res = await postRequest(
        `/api/admin/items/${productId}/activate/${active}`,
        "",
        t("message"),
      );
      if (res) {
        patchProduct(productId, { active });
        onStatsChange?.();
      }
    },
    [patchProduct, t, onStatsChange],
  );

  const productAvailable = useCallback(
    async (productId, available) => {
      const res = await postRequest(
        `/api/admin/items/${productId}/availability/${available}`,
        "",
        t("message"),
      );
      if (res) {
        patchProduct(productId, { available });
        onStatsChange?.();
      }
    },
    [patchProduct, t, onStatsChange],
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
          onStatsChange?.();
        }
      } catch (error) {
        // The shared request utility already surfaces the error.
      }
    },
    [t, onStatsChange],
  );

  const columns = useMemo(
    () =>
      createProductsColumns({
        t,
        locale,
        onToggleFavorite: productFavorite,
        onToggleActive: productActive,
        onToggleAvailable: productAvailable,
        onDelete: deleteProduct,
      }),
    [
      t,
      locale,
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
                className="h-12 w-12 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] object-cover p-0.5"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-[10px] text-[var(--admin-muted-soft)]">
                {t("no_image")}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--admin-ink)]">
                {productName(product)}
              </p>
              <p className="truncate text-xs text-[var(--admin-muted)]">
                {t("code")}: {product.code}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label={t("featured-product")}
            className={`admin-action-icon shrink-0 ${
              product.favorite
                ? "!text-[var(--admin-warning-text)] hover:!bg-[var(--admin-warning-soft)]"
                : "!text-[var(--admin-muted-soft)]"
            }`}
            onClick={async (event) => {
              event.stopPropagation();
              await productFavorite(product.itemId, !product.favorite);
            }}
          >
            <GoStarFill className="text-lg" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--admin-border-subtle)] pt-3 text-xs text-[var(--admin-muted)]">
          <span className="inline-flex items-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-2 py-1 font-semibold text-[var(--admin-ink-soft)]">
            {locale === "ar"
              ? product.itemCategory?.nameAr
              : product.itemCategory?.nameEn}
          </span>
          <span className="text-base font-bold text-[var(--admin-ink)]">
            {Number(product.price).toLocaleString("en-US")}{" "}
            <span className="text-xs font-medium text-[var(--admin-muted)]">
              {t("currency")}
            </span>
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--admin-border-subtle)] pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              title={product.active ? t("deactivate") : t("activate")}
              aria-label={product.active ? t("deactivate") : t("activate")}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                product.active
                  ? "border-[var(--admin-success-border)] bg-[var(--admin-success-soft)] text-[var(--admin-success-text)]"
                  : "border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]"
              }`}
              onClick={(event) => {
                event.stopPropagation();
                productActive(product.itemId, !product.active);
              }}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  product.active ? "bg-[var(--admin-success)]" : "bg-[var(--admin-muted-soft)]"
                }`}
              />
              {!product.active && locale !== "ar" ? t("inactive") : t("active")}
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
                <IoCheckmarkCircleOutline className="text-lg text-[var(--admin-success)]" />
              ) : (
                <MdBlock className="text-[var(--admin-danger)]" />
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
        onRowClick={(product) => openForm(product.itemId)}
        className={fillContainer ? "flex h-full min-h-0 w-full flex-col" : ""}
        mobileWrapperClassName={
          fillContainer
            ? "lg:hidden flex-1 min-h-0 mt-3 p-3 overflow-y-auto min-w-0 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]"
            : "lg:hidden max-h-[600px] mt-3 p-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] overflow-y-auto min-w-0"
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
