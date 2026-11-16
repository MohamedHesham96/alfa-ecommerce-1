"use client";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { FaCircle, FaPlus } from "react-icons/fa";
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
        className="mb-3 cursor-pointer rounded-xl border bg-white p-3 hover:bg-gray-100"
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
                className="my-1 h-14 w-14 rounded-xl border p-1"
              />
            ) : (
              <div className="my-1 flex h-14 w-14 items-center justify-center rounded-xl border bg-gray-100 text-[10px] text-gray-400">
                {t("no_image")}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold">
                {productName(product)}
              </h1>
              <h1 className="truncate text-xs text-gray-500">
                {t("code")} : {product.code}
              </h1>
            </div>
          </div>
          <button
            type="button"
            className={`flex shrink-0 items-center justify-center text-lg ${
              product.favorite ? "text-yellow-500" : "text-gray-500"
            }`}
            onClick={async (event) => {
              event.stopPropagation();
              await productFavorite(product.itemId, !product.favorite);
            }}
          >
            <GoStarFill />
          </button>
        </div>
        <div className="mt-3 border-t pt-3 text-xs text-gray-500">
          {locale === "ar"
            ? product.itemCategory?.nameAr
            : product.itemCategory?.nameEn}
        </div>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div className="min-w-0 text-base font-bold">
            {Number(product.price).toLocaleString("en-US")} {t("currency")}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={`flex items-center justify-center text-base ${
                product.active ? "text-green-600" : "text-gray-600"
              }`}
              onClick={(event) => {
                event.stopPropagation();
                productActive(product.itemId, !product.active);
              }}
            >
              <FaCircle />
            </button>
            <button
              type="button"
              className="flex items-center justify-center text-lg"
              onClick={(event) => {
                event.stopPropagation();
                productAvailable(product.itemId, !product.available);
              }}
            >
              {product.available ? (
                <IoCheckmarkCircleOutline className="text-green-500" />
              ) : (
                <MdBlock className="text-red-500" />
              )}
            </button>
          </div>
          <button
            type="button"
            className="flex items-center gap-1 rounded-md bg-red-300 px-2 py-1 text-sm font-semibold text-red-800 hover:bg-red-400"
            onClick={(event) => {
              event.stopPropagation();
              deleteProduct(product);
            }}
          >
            <MdDelete />
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
      className="!p-3 xs:gap-4"
      actions={
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-md bg-[#E76E7D] p-2 text-center text-white xs:text-xs md:text-sm"
          onClick={() => {
            setIsFormOpen(true);
            setSelectedProductId(null);
            setIsEditMode(false);
          }}
        >
          <span className="text-base">
            <FaPlus />
          </span>
          <h1 className="xs:hidden md:block">{t("add_new_product")}</h1>
        </button>
      }
    />
  );

  return (
    <div
      className={
        fillContainer
          ? "flex h-full min-h-0 w-full flex-col p-5"
          : "w-full p-5"
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
            ? "lg:hidden flex-1 min-h-0 mt-3 border p-3 rounded-3xl overflow-y-auto min-w-0"
            : "lg:hidden h-[600px] mt-3 border p-3 rounded-3xl overflow-y-auto min-w-0"
        }
        desktopWrapperClassName={
          fillContainer
            ? "hidden lg:block flex-1 min-h-0 min-w-0 mt-3 w-full overflow-x-auto overflow-y-auto"
            : "hidden lg:block max-h-[520px] min-w-0 mt-3 w-full overflow-x-auto overflow-y-auto"
        }
        tableClassName="w-full h-auto border rounded-3xl"
        headerClassName="bg-[#ececec] text-xs text-justify sticky top-0 z-10"
        rowClassName="border hover:bg-gray-100 hover:bg-opacity-40 cursor-pointer"
        emptyMessage={t("no_data")}
      />
    </div>
  );
}
