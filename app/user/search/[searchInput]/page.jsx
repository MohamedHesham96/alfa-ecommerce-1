"use client";

import { Fragment, use, useEffect, useRef, useState } from "react";
import { postRequest } from "../../../../utils/requestsUtils";
import ProductCard from "../../components/ProductCard";
import { useLanguage } from "../../../../context/LanguageContext";
import { useAppConfig } from "../../../../context/AppConfigContext";
import Select from "react-select";
import { MdFilterAlt } from "react-icons/md";
import { LuColumns2, LuColumns3, LuColumns4 } from "react-icons/lu";
import Filter from "./components/filter"
import Pagination from "./components/Pagination"
import { decodeSearchInput } from "../../../../utils/functions";

const DEFAULT_PRICE_BOUNDS = { min: 0, max: 1 };
const FILTER_OPTIONS_LOOKUP_SIZE = 100;

export default function Searchpage({params}) {
    // Route params arrive URL-encoded (Next.js does not decode them): decode
    // once so the heading shows the real text (e.g. Arabic) and the searchText
    // sent to the API matches stored item names.
    const resolvedParams = use(params);
    const searchInput = decodeSearchInput(resolvedParams?.searchInput);

  const { t } = useLanguage();
  const configuredPageSize = useAppConfig("catalog.productsPerPage", 12);
  const configuredGridColumns = useAppConfig("catalog.gridColumns", 4);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [priceBounds, setPriceBounds] = useState(DEFAULT_PRICE_BOUNDS);
  const [brands, setBrands] = useState([]);
  const [years, setYears] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [ascending, setAscending] = useState();
  const [sortBy, setSortBy] = useState();
  const requestSeq = useRef(0);
  const lastQueryKey = useRef(null);
  const lastFetchedKey = useRef("");
  const resultsRef = useRef(null);

  const filtersKey = appliedFilters
    ? [
        appliedFilters.brand ?? "",
        appliedFilters.minPrice ?? "",
        appliedFilters.maxPrice ?? "",
        appliedFilters.rating ?? "",
        appliedFilters.year ?? "",
      ].join("|")
    : "";

  const [prevSearchInput, setPrevSearchInput] = useState(searchInput);
  if (prevSearchInput !== searchInput) {
    setPrevSearchInput(searchInput);
    setAppliedFilters(null);
    setFiltersOpen(false);
  }

  const showOptions = Array.from(
    new Set([9, 12, 18, 24, configuredPageSize]),
  ).sort((left, right) => left - right);
  const [showCount, setShowCount] = useState(configuredPageSize);
  const [gridColumns, setGridColumns] = useState(configuredGridColumns);

  const gridOptions = [
    { value: 2, icon: LuColumns2 },
    { value: 3, icon: LuColumns3 },
    { value: 4, icon: LuColumns4 },
  ];

  const gridLayoutClasses = {
    2: "grid grid-cols-2",
    3: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3",
    4: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  };

  const sortOptions = [
    { value: "", label: t("relevance") },
    { value: "true,price", label: t("priceLowToHigh") },
    { value: "false,price", label: t("priceHighToLow") },
  ];

  const currentValue = sortBy
    ? sortOptions.find((option) => option.value === `${ascending},${sortBy}`)
    : null;

const normalizePage = (payload, fallbackSize) => {
    const data = payload?.data ?? payload ?? {};
    const page = data?.page ?? data ?? {};
    const content = Array.isArray(data)
      ? data
      : Array.isArray(data?.content)
        ? data.content
        : Array.isArray(data?.items)
          ? data.items
          : [];
    const size = Number(page?.size ?? data?.size ?? fallbackSize) || fallbackSize;
    const totalElements =
      Number(
        page?.totalElements ??
          page?.totalItems ??
          page?.totalCount ??
          page?.total ??
          data?.totalElements ??
          data?.totalItems ??
          data?.totalCount ??
          data?.total ??
          0,
      ) || 0;
    const totalPages =
      Number(page?.totalPages ?? page?.totalPage ?? data?.totalPages ?? data?.totalPage ?? 0) ||
      (content.length > 0 ? Math.max(1, Math.ceil(totalElements / size)) : 0);
    const number =
      Number(
        page?.number ?? page?.pageNumber ?? page?.currentPage ??
          data?.number ?? data?.pageNumber ?? data?.currentPage ?? 0,
      ) || 0;
    return { content, number, size, totalElements, totalPages };
  };

  const fetchPage = async (page) => {
    const seq = ++requestSeq.current;
    try {
      setLoading(true);
      const response = await postRequest(
        "/api/public/items/search",
        {
          page,
          size: showCount,
          searchText: searchInput,
          sortBy: sortBy || null,
          ascending: ascending === "false" ? false : true,
          brand: appliedFilters?.brand || null,
          minPrice: appliedFilters?.minPrice ?? null,
          maxPrice: appliedFilters?.maxPrice ?? null,
          rating: appliedFilters?.rating ?? null,
          releaseYear: appliedFilters?.year ?? null,
        },
        '',
      );
      if (seq !== requestSeq.current) return; // ignore stale responses
      const normalized = normalizePage(response, showCount);
      setProducts(normalized.content);
      setCurrentPage(normalized.number);
      setTotalPages(normalized.totalPages);
      setTotalElements(normalized.totalElements);
    } catch (error) {
      // errors are shown by the shared toast system in postRequest
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  };

  useEffect(() => {
    const queryKey = `${searchInput}|${sortBy}|${ascending}|${showCount}|${filtersKey}`;
    const page = lastQueryKey.current !== queryKey ? 0 : currentPage;
    if (lastQueryKey.current !== queryKey) {
      lastQueryKey.current = queryKey;
      setCurrentPage(0);
    }
    const fetchKey = `${queryKey}|${page}`;
    if (lastFetchedKey.current === fetchKey) return;
    lastFetchedKey.current = fetchKey;
    fetchPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchInput, sortBy, ascending, showCount, filtersKey]);

  useEffect(() => {
    let active = true;
    setPriceBounds(DEFAULT_PRICE_BOUNDS);
    setBrands([]);
    setYears([]);

    const probe = (ascendingOrder) =>
      postRequest(
        "/api/public/items/search",
        {
          page: 0,
          size: 1,
          searchText: searchInput,
          sortBy: "price",
          ascending: ascendingOrder,
        },
        '',
      );

    const loadOptions = postRequest(
      "/api/public/items/search",
      {
        page: 0,
        size: FILTER_OPTIONS_LOOKUP_SIZE,
        searchText: searchInput,
        sortBy: "releaseYear",
        ascending: false,
      },
      '',
    );

    Promise.allSettled([probe(true), probe(false), loadOptions]).then(
      ([cheapest, priciest, optionsRes]) => {
        if (!active) return;
        const cheapestPrice = Number(normalizePage(cheapest.value, 1).content[0]?.price);
        const priciestPrice = Number(normalizePage(priciest.value, 1).content[0]?.price);
        const min = Number.isFinite(cheapestPrice) ? cheapestPrice : 0;
        const max = Number.isFinite(priciestPrice) ? priciestPrice : min + 1;
        setPriceBounds({ min, max: max > min ? max : min + 1 });

        const seenBrands = new Set();
        const brandList = [];
        const seenYears = new Set();
        const yearList = [];
        normalizePage(optionsRes.value, FILTER_OPTIONS_LOOKUP_SIZE).content.forEach((product) => {
          const name = typeof product?.brand === "string" ? product.brand.trim() : "";
          if (name && !seenBrands.has(name.toLowerCase())) {
            seenBrands.add(name.toLowerCase());
            brandList.push(name);
          }
          const year = Number(product?.releaseYear);
          if (Number.isInteger(year) && year > 1900 && !seenYears.has(year)) {
            seenYears.add(year);
            yearList.push(year);
          }
        });
        setBrands(brandList);
        setYears(yearList.sort((a, b) => b - a));
      },
    );

    return () => {
      active = false;
    };
  }, [searchInput]);

  const handlePageChange = (page) => {
    if (page === currentPage || page < 0 || page >= totalPages) return;
    setCurrentPage(page);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalResultsText = () => {
    if (!totalElements) return `0 ${t("results")}`;
    const start = currentPage * showCount + 1;
    const end = Math.min((currentPage + 1) * showCount, totalElements);
    return t("showing_results")
      .replace("{start}", start)
      .replace("{end}", end)
      .replace("{total}", totalElements);
  };

  // one state, one request: apply every filter at once and go back to the first page
  const handleApplyFilters = (filters) => {
    setAppliedFilters(filters);
    if (currentPage !== 0) setCurrentPage(0);
  };

  const handleClearFilters = () => {
    setAppliedFilters(null);
    if (currentPage !== 0) setCurrentPage(0);
  };

  return (
    <div className="mb-20 flex flex-col md:flex-row w-full min-h-screen gap-5 p-0">
      <Filter
        priceBounds={priceBounds}
        brands={brands}
        years={years}
        appliedFilters={appliedFilters}
        onFilter={handleApplyFilters}
        onClear={handleClearFilters}
        drawerOpen={filtersOpen}
        onDrawerClose={() => setFiltersOpen(false)}
      />
      <div className="flex flex-col items-start justify-end gap-5 h-full w-full">

        <div
          ref={resultsRef}
          className={`p-2 w-full scroll-mt-4`}
        >
          <span className="text-xl font-bold ">{t("Search_results")}: "{searchInput}" </span>
          <div className="w-full flex justify-between items-center">
          <div className="flex flex-wrap items-center justify-start gap-3 my-5">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="md:hidden bg-white flex items-center gap-2 text-xs font-semibold text-gray-700 border rounded-full px-4 h-10 hover:border-red-400 hover:text-red-600 active:scale-95 transition-all"
            >
              <MdFilterAlt className="w-4 h-4 text-red-600" />
              {t("filters")}
            </button>
            <div className="flex flex-wrap items-center gap-4">
            <div className="bg-white flex  gap-4 items-center text-xs z-50 border rounded-full  px-3 h-10">
              {/* <span>{t("sortBy")}:</span> */}
              <Select
                isSearchable={false}
                options={sortOptions}
                value={currentValue}
                onChange={(selectedOption) => {
                  if (selectedOption) {
                    setAscending(selectedOption.value.split(",")[0]);
                    setSortBy(selectedOption.value.split(",")[1]);
                  } else {
                    setAscending(undefined);
                    setSortBy(undefined);
                  }
                }}
                className="h-full w-[150px]"
                placeholder={t("relevance")}
                styles={{
                  control: (provided) => ({
                    ...provided,
                    border: "none",
                    boxShadow: "none",
                    background: "transparent",
                    fontWeight: "600",
                    height: "100%",
                    width: "100%",
                  }),
                  input: (base) => ({
                    ...base,
                    color: "#374151",
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "#1967d2"
                     
                        : "#ffffff",
                    color: state.isSelected ? "#ffffff" : "#374151",
                    cursor: "pointer",
                    // padding: "px",
                    "&:hover": {
                      backgroundColor: state.isSelected ? "#ffffff" : "#1967d2",
                      color: state.isSelected ? "#1967d2" : "#ffffff"
                    },
                  }),
                }}
              />
            </div>
            <div className="md:flex xs:hidden items-center gap-1 text-sm">
              <span className="font-semibold text-gray-900">{t("show")}:</span>
              {showOptions.map((count, i) => (
                <Fragment key={count}>
                  {i > 0 && <span className="text-gray-300">/</span>}
                  <button
                    type="button"
                    onClick={() => setShowCount(count)}
                    className={`px-1 transition-colors ${
                      showCount === count
                        ? "font-bold text-gray-900"
                        : "font-medium text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    {count}
                  </button>
                </Fragment>
              ))}
            </div>
            </div>
            <div className="md:flex xs:hidden items-center gap-1">
              {gridOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGridColumns(option.value)}
                  className={`p-2 rounded-md transition-colors ${
                    gridColumns === option.value
                      ? "text-gray-900 bg-gray-200"
                      : "text-gray-400 hover:text-gray-700"
                  }`}
                >
                  <option.icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {!loading && totalElements > 0 && (
            <p className="text-sm text-gray-600 mb-4">
              {totalResultsText()}
            </p>
          )}
</div>
          {loading ? (
            <div className={`${gridLayoutClasses[gridColumns]} gap-5 `}>
              {[...Array(8)].map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="h-[320px] bg-gray-100 rounded animate-pulse w-full"
                ></div>
              ))}
            </div>
          ) : products.length != 0 ? (
            <div>
                <div
              className={`${gridLayoutClasses[gridColumns]} p-2 gap-4`}
            >
              {products.map((product, index) => (
                <div key={index} className="">
                  <ProductCard productInfo={product} />
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}

            </div>
          
          ) : (
            <div className="h-10 w-full bg-white flex justify-center py-2  ">
              {t("no_data")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
