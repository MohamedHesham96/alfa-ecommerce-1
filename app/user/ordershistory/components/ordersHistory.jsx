"use client";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { FaRegCalendar } from "react-icons/fa";
import { IoMdSearch } from "react-icons/io";
import { VscCircleFilled } from "react-icons/vsc";
import { postRequest } from "../../../../utils/requestsUtils";
import { useLanguage } from "../../../../context/LanguageContext";
import { useRouter } from "next/navigation";
import { useIdContext } from "../../../../context/idContext";
import { getThumbnailUrl } from "../../../../utils/functions";
import Pagination from "../../search/[searchInput]/components/Pagination";
export default function OrdersHistory() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [inputSearch, setInputSearch] = useState(null);
  const [state, setState] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { locale } = useLanguage();

  const [loading, setLoading] = useState(true);
  const navigate = useRouter();
  const { setSelectedProductId } = useIdContext();
  const PAGE_SIZE = 5;
  const getOrders = useCallback(async () => {
    try {
      setLoading(true)
      const res = await postRequest(
        "/api/orders/search",
        {
          page: currentPage,
          size: PAGE_SIZE,
          searchText: inputSearch,
          orderState: state,
        },
        ""
      );
      console.log(res.data);
      setOrders(res.data.content);
      setTotalPages(res.data.totalPages || 0);
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
    finally{
      setLoading(false)
    }
  }, [currentPage, inputSearch, state]);

  const handlePageChange = (page) => {
    if (page === currentPage || page < 0 || page >= totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    getOrders();
  }, [getOrders]);
  return (
    <div >
      <div className="md:flex xs:block justify-between  items-center  mb-10">
        <div className="flex flex-col gap-2">
          <span className="text-3xl font-bold">{t("orderHistory")} </span>
          <span className=" text-gray-500 opacity-90">
            {t("trackAndManage")}
          </span>
        </div>
        <div className="flex justify-start items-center mt-5 bg-white border rounded-full">
          <span className="text-[#e14a5c] h-full  rounded-s-full text-2xl p-2 ">
            <IoMdSearch />
          </span>
          <input
            type="text"
            placeholder={t("searchByOrderNumber")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setInputSearch(e.target.value);
                setCurrentPage(0);
              }
            }}
            className="w-[250px] bg-none p-2 outline-none rounded-full text-sm"
          />
        </div>
      </div>
      <div className="relative">
        <div className="flex gap-6 md:text-lg xs:text-sm items-center  ">
          <span
            className={` border-b hover:text-red-600 hover:border-red-600 py-4 cursor-pointer 
               ${state === null ? "text-red-600 border-red-600" : "text-gray-500"}
              `}
            onClick={() => {
              setState(null);
              setCurrentPage(0);
            }}
          >
            {t("all")}
          </span>
          <span
            className={`border-b hover:text-red-600 hover:border-red-600 py-4 cursor-pointer
               ${
                 state === "PENDING"
                   ? "text-red-600 border-red-600"
                   : "text-gray-500"
               }
              `}
            onClick={() => {
              setState("PENDING");
              setCurrentPage(0);
            }}
          >
            {t("PENDING")}
          </span>
          <span
            className={`border-b hover:text-red-600 hover:border-red-600 py-4 cursor-pointer 
               ${
                 state === "PROCESSING"
                   ? "text-red-600 border-red-600"
                   : "text-gray-500"
               }
              `}
            onClick={() => {
              setState("PROCESSING");
              setCurrentPage(0);
            }}
          >
            {t("PROCESSING")}
          </span>
          <span
            className={`border-b hover:text-red-600 hover:border-red-600 py-4 cursor-pointer
            ${
              state === "SHIPPED"
                ? "text-red-600 hover border-red-600"
                : "text-gray-500"
            }  
            `}
            onClick={() => {
              setState("SHIPPED");
              setCurrentPage(0);
            }}
          >
            {t("SHIPPED")}
          </span>
          <span
            className={` border-b hover:text-red-600 hover:border-red-600 py-4 cursor-pointer 
              ${
                state === "DELIVERED"
                  ? "text-red-600 border-red-600"
                  : "text-gray-500"
              }
              `}
            onClick={() => {
              setState("DELIVERED");
              setCurrentPage(0);
            }}
          >
            {t("DELIVERED")}
          </span>
          <span
            className={` border-b hover:text-red-600 hover:border-red-600 py-4 cursor-pointer 
              ${
                state === "CANCELLED"
                  ? "text-red-600 border-red-600"
                  : "text-gray-500"
              }
              `}
            onClick={() => {
              setState("CANCELLED");
              setCurrentPage(0);
            }}
          >
            {t("CANCELLED")}
          </span>
        </div>
        <hr className=""></hr>
      </div>
      {loading ? (
        // Skeleton rows
        [...Array(2)].map((_, index) => (
          <div key={`skeleton-${index}`} className="py-5 flex flex-col gap-5">
            <div className="w-full bg-white   rounded-md shadow-sm p-5">
              <div className="flex justify-between">
                <div className="flex items-center gap-5">
                  <span className="h-4 bg-gray-200 rounded animate-pulse w-24"></span>
                  <span className="h-4 bg-gray-200 rounded animate-pulse w-24"></span>
                  <span className="h-4 bg-gray-200 rounded animate-pulse w-24"></span>
                </div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              </div>
              <div className="flex justify-between items-center ">
                <div className="mt-10 grid grid-cols-3 gap-x-10 gap-y-5 w-[80%]">
                  <div className="h-16 bg-gray-200 rounded animate-pulse "></div>
                  <div className=" h-16 bg-gray-200 rounded animate-pulse "></div>
                  <div className="h-16 bg-gray-200 rounded animate-pulse "></div>
                </div>
                <div className="h-10 bg-gray-200 rounded animate-pulse w-[200px] mx-5"></div>
              </div>
            </div>
          </div>
        ))
      ) : orders.length === 0 ? (
        <div className="w-full h-[400px]"></div>
      ) : (
        <div className="py-5 flex flex-col gap-5">
          {orders.map((order, index) => {
            const date = new Date(order.createdDate);
            const dateOnly = date.toLocaleDateString("en-GB");
            return (
              <div
                key={index}
                className="w-full bg-white   rounded-3xl shadow-sm p-5"
              >
                <div className="flex justify-between items-baseline">
                  <div className="flex md:flex-row xs:flex-col gap-5">
                    <span className="p-1 text-sm text-gray-700 rounded-md font-semibold bg-gray-100">
                      {order.code}
                    </span>
                    {order.fulfillmentType === "PICKUP" ? (
                      <span className="p-1 text-xs rounded-md font-semibold bg-green-100 text-green-700">
                        {t("pickup")}
                      </span>
                    ) : null}
                    <div className="flex items-center gap-2">
                       <span className=" text-sm text-gray-700 rounded-md font-semibold flex  items-center gap-2">
                      <FaRegCalendar /> {dateOnly}
                    </span>
                    <br/>
                    <span
                      className={`flex items-center ${
                        order.state === "PROCESSING"
                          ? "text-blue-600"
                          : order.state === "PENDING"
                          ? " text-orange-400"
                          : order.state === "SHIPPED"
                          ? "text-yellow-600":
                          order.state === "CANCELLED"
                          ? "text-red-600"
                          : "text-green-600"
                      } `}
                    >
                      <VscCircleFilled />
                      {t(order.state)}
                    </span>
                    </div>
                   
                  </div>
                  <div className="flex items-center text-lg gap-1 mx-5">
                    <span className=" text-gray-600">{t("Total")}: </span>
                    <span className="text-[#e14a5c] font-semibold">
                      {order.netTotal.toLocaleString("en-US")} {t("currency")}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between  ">
                  <div className="mt-10 grid xl:grid-cols-3 md:grid-cols-2 gap-x-3 gap-y-3 lg:w-[80%] xs:w-full">
                    {order.orderItemLines.map((itemLine, index) => {
                      return (
                        <div
                          className="bg-gray-50 p-2 rounded-3xl flex items-center gap-3 cursor-pointer"
                          key={index}
                          onClick={() => {
                            setSelectedProductId(itemLine.item.itemId);
                            navigate.push(
                              `/user/productdetails/${itemLine.item.nameEn}/${itemLine.item.itemId}`
                            );
                          }}
                        >
                          <Image
                            src={
                              process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL +
                             getThumbnailUrl(itemLine.item.images[0]?.imageUrl)
                            }
                            alt=""
                            width={60}
                            height={60}
                            className="object-fill rounded-3xl"
                          />
                          <div className="flex flex-col  font-semibold ">
                            <span className="">
                              {locale === "ar"
                                ? itemLine.item.nameAr
                                : itemLine.item.nameEn}
                            </span>
                            <div className="flex xs:flex-col lg:flex-row gap-3 mt-2 text-xs">
                             
                              <span className="text-gray-500 ">
                                {t("quantity")} : {itemLine.quantity}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div
                    className="w-[200px] h-[30px] text-sm flex justify-end xs:text-sm md:text-base rounded-full  mt-10"
                    onClick={() => {
                      navigate.push(`/user/orderdetails/${order.orderId}`);
                    }}
                  >
                    <button className="px-2 bg-red-600 text-white rounded-full hover:bg-red-700">
                {t("orderDetails")}
                    </button    >
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {totalPages > 1 && !loading && orders.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
