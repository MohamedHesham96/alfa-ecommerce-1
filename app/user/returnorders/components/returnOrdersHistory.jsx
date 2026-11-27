"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiCalendar,
  FiHash,
  FiInfo,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { TbTruckReturn } from "react-icons/tb";

import { postRequest } from "../../../../utils/requestsUtils";
import { useLanguage } from "../../../../context/LanguageContext";
import { useIdContext } from "../../../../context/idContext";
import { getThumbnailUrl } from "../../../../utils/functions";
import Pagination from "../../search/[searchInput]/components/Pagination";

const PAGE_SIZE = 5;

const RETURN_STATE_STYLES = {
  PENDING: {
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  APPROVED: {
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  REFUNDED: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    badge: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  CANCELLED: {
    badge: "border-gray-200 bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
  },
};

const DEFAULT_STATE_STYLE = {
  badge: "border-gray-200 bg-gray-50 text-gray-600",
  dot: "bg-gray-400",
};

const FILTER_STATES = [
  { value: "", labelKey: "all" },
  { value: "PENDING", labelKey: "PENDING" },
  { value: "APPROVED", labelKey: "APPROVED" },
  { value: "REFUNDED", labelKey: "REFUNDED" },
  { value: "REJECTED", labelKey: "REJECTED" },
  { value: "CANCELLED", labelKey: "CANCELLED" },
];

function formatMoney(value) {
  return Number(value ?? 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function ItemThumbnail({ src, alt }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
      {src && !failed ? (
        <Image
          src={src}
          alt={alt}
          width={80}
          height={80}
          className="h-full w-full object-contain p-1"
          onError={() => setFailed(true)}
        />
      ) : (
        <FiPackage className="text-2xl text-gray-300" aria-hidden="true" />
      )}
    </span>
  );
}

export default function ReturnOrders() {
  const { t, locale } = useLanguage();
  const navigate = useRouter();
  const { setSelectedProductId } = useIdContext();
  const [orders, setOrders] = useState([]);
  const [searchDraft, setSearchDraft] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [state, setState] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const getReturnOrders = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await postRequest(
        "/api/return-orders/search",
        {
          page: currentPage,
          size: PAGE_SIZE,
          searchText: appliedSearch || null,
          // The return-order endpoint filters by `returnState`. The previous
          // `orderState` key was ignored by the backend, so every tab returned
          // the same list.
          returnState: state,
        },
        "",
        false,
        { suppressErrorToast: true },
      );
      setOrders(Array.isArray(res.data?.content) ? res.data.content : []);
      setTotalPages(res.data?.totalPages || 0);
    } catch {
      setOrders([]);
      setTotalPages(0);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, currentPage, state]);

  useEffect(() => {
    getReturnOrders();
  }, [getReturnOrders]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const nextSearch = searchDraft.trim();
    if (nextSearch === appliedSearch) return;
    setAppliedSearch(nextSearch);
    setCurrentPage(0);
  };

  const clearSearch = () => {
    setSearchDraft("");
    if (!appliedSearch) return;
    setAppliedSearch("");
    setCurrentPage(0);
  };

  const handleFilterChange = (nextState) => {
    if (nextState === state) return;
    setState(nextState);
    setCurrentPage(0);
  };

  const resetFilters = () => {
    setSearchDraft("");
    setAppliedSearch("");
    setState("");
    setCurrentPage(0);
  };

  const handlePageChange = (page) => {
    if (page === currentPage || page < 0 || page >= totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openProduct = (order) => {
    if (!order.item?.itemId) return;
    setSelectedProductId(order.item.itemId);
    navigate.push(
      `/user/productdetails/${encodeURIComponent(
        order.item.nameEn || order.item.nameAr || "",
      )}/${order.item.itemId}`,
    );
  };

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
      dateStyle: "medium",
    }).format(date);
  };

  const hasActiveQuery = Boolean(appliedSearch) || Boolean(state);
  const imageBase = process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL || "";
  const DetailsArrow = locale === "ar" ? FiArrowLeft : FiArrowRight;

  return (
    <div className="w-full">
      <header className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fff5f6] px-3 py-1 text-xs font-bold text-[#CD4354]">
            <TbTruckReturn className="text-sm" aria-hidden="true" />
            {t("return_order")}
          </span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
            {t("returnsHistory")}
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-6 text-gray-500">
            {t("returnsHistorySubtitle")}
          </p>
        </div>

        <form
          role="search"
          onSubmit={handleSearchSubmit}
          className="flex w-full items-center gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-sm transition focus-within:border-[#CD4354]/50 focus-within:ring-2 focus-within:ring-[#CD4354]/10 sm:w-[360px]"
        >
          <span className="ps-3 text-lg text-[#CD4354]">
            <FiSearch aria-hidden="true" />
          </span>
          <input
            type="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder={t("returns_search_placeholder")}
            aria-label={t("returns_search_placeholder")}
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
          {searchDraft ? (
            <button
              type="button"
              onClick={clearSearch}
              aria-label={t("clear")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <FiX aria-hidden="true" />
            </button>
          ) : null}
          <button
            type="submit"
            className="shrink-0 rounded-full bg-[#E76E7D] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#CD4354] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CD4354]/40"
          >
            {t("search")}
          </button>
        </form>
      </header>

      <div
        className="mb-5 flex gap-2 overflow-x-auto pb-1"
        role="group"
        aria-label={t("filters")}
      >
        {FILTER_STATES.map((filter) => {
          const active = state === filter.value;
          const style = RETURN_STATE_STYLES[filter.value];
          return (
            <button
              key={filter.value || "all"}
              type="button"
              aria-pressed={active}
              onClick={() => handleFilterChange(filter.value)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CD4354]/30 ${
                active
                  ? "border-[#CD4354] bg-[#CD4354] text-white shadow-sm"
                  : "border-gray-200 bg-white text-gray-600 hover:border-[#CD4354]/40 hover:bg-[#fff5f6] hover:text-[#CD4354]"
              }`}
            >
              {style ? (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    active ? "bg-white" : style.dot
                  }`}
                  aria-hidden="true"
                />
              ) : null}
              {t(filter.labelKey)}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-label={t("loading")}>
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/60 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="h-6 w-28 animate-pulse rounded-full bg-gray-200" />
                  <span className="h-6 w-24 animate-pulse rounded-full bg-gray-200" />
                  <span className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                </div>
                <span className="h-8 w-24 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center">
                <span className="h-20 w-20 animate-pulse rounded-2xl bg-gray-200" />
                <div className="flex-1 space-y-3">
                  <span className="block h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                  <span className="block h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                </div>
                <span className="h-10 w-full animate-pulse rounded-full bg-gray-200 sm:w-40" />
              </div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl text-red-500 shadow-sm">
            <FiAlertCircle aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm font-bold text-red-800">
            {t("returns_load_error")}
          </p>
          <button
            type="button"
            onClick={getReturnOrders}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#CD4354] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#b53a49]"
          >
            <FiRefreshCw aria-hidden="true" />
            {t("retry")}
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff5f6] text-2xl text-[#CD4354]">
            <TbTruckReturn aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-gray-900">
            {hasActiveQuery ? t("no_results") : t("returns_empty_title")}
          </h2>
          <p className="mt-1 max-w-md text-sm leading-6 text-gray-500">
            {hasActiveQuery ? t("empty_hint") : t("returns_empty_desc")}
          </p>
          {hasActiveQuery ? (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 rounded-full bg-[#E76E7D] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#CD4354]"
            >
              {t("show_all_returns")}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const style =
              RETURN_STATE_STYLES[order.state] ?? DEFAULT_STATE_STYLE;
            const itemName =
              locale === "ar"
                ? order.item?.nameAr || order.item?.nameEn
                : order.item?.nameEn || order.item?.nameAr;
            const imageUrl = order.item?.images?.[0]?.imageUrl
              ? `${imageBase}${getThumbnailUrl(order.item.images[0].imageUrl)}`
              : null;

            return (
              <article
                key={order.returnOrderId}
                className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 bg-gray-50/60 px-5 py-4">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-700 ring-1 ring-gray-200">
                      <FiHash aria-hidden="true" />
                      {order.code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${style.badge}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                        aria-hidden="true"
                      />
                      {t(order.state)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
                      <FiCalendar aria-hidden="true" />
                      {formatDate(order.createdDate)}
                    </span>
                  </div>

                  <div className="text-start sm:text-end">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      {t("refundAmount")}
                    </p>
                    <p className="text-lg font-bold text-[#da643b]">
                      {formatMoney(order.refundAmount)} {t("currency")}
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 px-5 py-5 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="flex min-w-0 items-start gap-4">
                    <button
                      type="button"
                      onClick={() => openProduct(order)}
                      className="shrink-0 rounded-2xl transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CD4354]/40"
                      aria-label={itemName}
                    >
                      <ItemThumbnail src={imageUrl} alt={itemName || ""} />
                    </button>

                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => openProduct(order)}
                        className="line-clamp-2 text-start text-sm font-bold text-gray-900 transition hover:text-[#CD4354] sm:text-base"
                      >
                        {itemName || "—"}
                      </button>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>
                          {t("quantity")}:{" "}
                          <span className="font-semibold text-gray-700">
                            {order.quantity}
                          </span>
                        </span>
                        <span>
                          {t("price")}:{" "}
                          <span className="font-semibold text-gray-700">
                            {formatMoney(order.unitPrice)} {t("currency")}
                          </span>
                        </span>
                        {order.paymentMethod ? (
                          <span>
                            {t("payment_method")}:{" "}
                            <span className="font-semibold text-gray-700">
                              {t(order.paymentMethod)}
                            </span>
                          </span>
                        ) : null}
                      </div>

                      {order.reason ? (
                        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-100">
                          <FiInfo aria-hidden="true" />
                          {t("reason")}: {t(order.reason)}
                        </span>
                      ) : null}

                      {order.reasonMessage ? (
                        <p className="mt-2 line-clamp-2 text-xs leading-6 text-gray-500">
                          {order.reasonMessage}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate.push(
                        `/user/returnorderdetails/${order.returnOrderId}`,
                      )
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E76E7D] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#CD4354] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CD4354]/40 lg:w-auto"
                  >
                    {t("orderDetails")}
                    <DetailsArrow aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 && !loading && orders.length > 0 ? (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      ) : null}
    </div>
  );
}
