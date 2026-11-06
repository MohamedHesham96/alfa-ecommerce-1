"use client";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { getRequest, postRequest } from "../../../../../utils/requestsUtils";
import ProductCard from "../../../components/ProductCard";
import { useLanguage } from "../../../../../context/LanguageContext";
import { BsList, BsStarFill, BsClockHistory, BsFire } from "react-icons/bs";
import Select from "react-select";
import { MdOutlineDownloading } from "react-icons/md";
import Pagination from "../../../search/[searchInput]/components/Pagination";

export default function ProductsBySection({ params }) {
  const { section } = use(params);

  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ascending, setAscending] = useState();
  const [sortBy, setSortBy] = useState();
  const resultsRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 12;

  const sortOptions = [
    { value: "true,price", label: t("priceLowToHigh") },
    { value: "false,price", label: t("priceHighToLow") },
  ];


  const currentValue = sortBy
    ? sortOptions.find((option) => option.value === `${ascending},${sortBy}`)
    : null;

  const sectionTitle =
    section === "topLast30Days"
      ? t("Best_pick_of_the_week")
      : section === "recentWatched"
        ? t("recentWatched")
        : section === "all"
          ? t("view_all_products")
          : section === "newProducts"
            ? t("New_arrivals")
            : t("morerecommendedproducts");

  const sectionIcon =
    section === "topLast30Days"
      ? <BsStarFill className="text-red-600" />
      : section === "recentWatched"
        ? <BsClockHistory className="text-red-600" />
        : section === "all"
          ? <BsList className="text-red-600" />
          : section === "newProducts"
            ? <BsFire className="text-red-600" />
            : <BsFire className="text-red-600" />;

  const normalizePage = useCallback((payload, fallbackSize) => {
    const data = payload?.data ?? payload ?? {};
    const content = Array.isArray(data)
      ? data
      : Array.isArray(data?.content)
        ? data.content
        : Array.isArray(data?.items)
          ? data.items
          : [];
    const size = Number(data?.size ?? fallbackSize) || fallbackSize;
    const totalElements =
      Number(
        data?.totalElements ??
          data?.totalItems ??
          data?.totalCount ??
          data?.total ??
          0,
      ) || 0;
    const totalPages =
      Number(data?.totalPages ?? data?.totalPage ?? 0) ||
      (content.length > 0 ? Math.max(1, Math.ceil(totalElements / size)) : 0);
    const number =
      Number(data?.number ?? data?.pageNumber ?? data?.currentPage ?? 0) || 0;
    return { content, number, size, totalElements, totalPages };
  }, []);

  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;

  const getAllProducts = useCallback(async (loading, requestedPage) => {
    try {
      setLoading(loading);

      const page = requestedPage ?? currentPageRef.current;
      const response =
        section === "topLast30Days"
          ? await getRequest(
            "/api/public/items/topRated/last30Days",
            {
              page,
              size: PAGE_SIZE,
              sortBy: sortBy || null,
              ascending: ascending || true,
            },
            "",
          ) :
          section === "morerecommendedproducts"
            ? await postRequest(
              "/api/public/items/search",
              {
                page,
                size: PAGE_SIZE,
                isFavorite: true,
                sortBy: sortBy || null,
                ascending: ascending || true,
              },
              "",
            )
            : section === "recentWatched"
              ? await getRequest(
                "/api/users/recentWatchedItems",
                {
                  page,
                  size: PAGE_SIZE,
                  sortBy: sortBy || null,
                  ascending: ascending || true,
                },
                "",
              )
              : section === "all"
                ? await postRequest(
                  "/api/public/items/search",
                  {
                    page,
                    size: PAGE_SIZE,
                    sortBy: sortBy || null,
                    ascending: ascending || true,
                  },
                  "",
                )
                : await getRequest(
                  "/api/public/items/recent",
                  {
                    page,
                    size: PAGE_SIZE,
                    sortBy: sortBy || null,
                    ascending: ascending || true,
                  },
                  "",
                );
console.log(response) 
      const normalized = normalizePage(response, PAGE_SIZE);
      setProducts(normalized.content);
      setCurrentPage(normalized.number);
      setTotalPages(normalized.totalPages);
      setTotalElements(normalized.totalElements);

    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [section, sortBy, ascending, normalizePage]);

  useEffect(() => {
    setCurrentPage(0);
    getAllProducts(true, 0);
  }, [getAllProducts]);

  const handlePageChange = (page) => {
    if (page === currentPage || page < 0 || page >= totalPages) return;
    setCurrentPage(page);
    getAllProducts(true, page);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const totalResultsText = () => {
    if (!totalElements) return `0 ${t("results")}`;
    const start = currentPage * PAGE_SIZE + 1;
    const end = Math.min((currentPage + 1) * PAGE_SIZE, totalElements);
    return t("showing_results")
      .replace("{start}", start)
      .replace("{end}", end)
      .replace("{total}", totalElements);
  };

  return (
    <div className=" w-full">
      <div ref={resultsRef} className="flex flex-col items-start justify-start  ">


        <div className="p-3 w-full ">
          <div className="mb-4">
            <h1 className="flex items-center font-semibold gap-2 xs:text-base md:text-lg mb-1">
              {sectionIcon}
              {sectionTitle}
            </h1>
            <hr className="w-24 h-1 border-0 rounded-full bg-gradient-to-l from-red-200 via-red-400 to-red-200" />
          </div>
          <div className="flex gap-5 ">
            <div className="bg-white flex  gap-4 items-center  border rounded-full  px-3 h-10  mb-5">
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
                className="h-full w-[200px] z-50"
                placeholder={t("select")}
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
                      ? "#dc2626"
                      : state.isFocused
                        ? "#fee2e2"
                        : "#ffffff",
                    color: state.isSelected ? "#ffffff" : "#374151",
                    cursor: "pointer",
                    padding: "10px",
                    "&:hover": {
                      backgroundColor: state.isSelected ? "#dc2626" : "#fee2e2",
                    },
                  }),
                }}
              />
            </div>
          </div>

          {loading ? (
            <div className="grid xl:grid-cols-6 lg:grid-cols-5 md:grid-cols-4 sm:grid-cols-3 xs:grid-cols-1 gap-5">
              {[...Array(6)].map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="h-[280px] bg-gray-100 rounded animate-pulse w-full"
                ></div>
              ))}
            </div>
          ) : products.length != 0 ? (
            <div>
              {/* {(section === "all" || section === "newProducts") && ( */}
                <p className="text-sm text-gray-600 mb-4">
                  {totalResultsText()}
                </p>
              {/* )} */}
              <div
                className="grid xl:grid-cols-6 lg:grid-cols-5 md:grid-cols-4 sm:grid-cols-3 xs:grid-cols-2 p-2 gap-5"
              >
                {products.map((product, index) => (
                  <div key={index}>
                    <ProductCard productInfo={product} />
                  </div>
                ))
                 
                  }
              </div>

              {totalPages > 1 && (
                           <Pagination
                             currentPage={currentPage}
                             totalPages={totalPages}
                             onPageChange={handlePageChange}
                           />
                         )}
              {/* )
              ) : (
              <div
                className={`w-full  justify-center items-center ${products.length < 10 ? "hidden" : "flex"}`}
              >
                {
                  hasMore ? (
                    <button
                      className=" text-red-600 px-5 py-1 shadow-md  my-3 rounded-lg"
                      onClick={() => {
                        pageNum.current += 1;
                        getAllProducts(false);
                      }}
                    >
                      <MdOutlineDownloading className="text-4xl" />
                    </button>
                  ) : (
                    <span className="text-gray-500 my-3">{t("no_more_products")}</span>
                  )
                } */}

              {/* </div> */}
              {/* )} */}
            </div>
          ) : (
            <div className="h-screen w-full">
              <div className="h-10 w-full bg-white flex justify-center py-2  ">
                {t("no_data")}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}