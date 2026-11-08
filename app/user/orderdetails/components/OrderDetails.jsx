"use client";
import Image from "next/image";
import { MdCancel } from "react-icons/md";
import { getRequest, postRequest } from "../../../../utils/requestsUtils";
import { useCallback, useEffect, useState } from "react";
import { useIdContext } from "../../../../context/idContext";
import { useRouter } from "next/navigation";
import { FaBox, FaCheck, FaTruck } from "react-icons/fa";
import { getThumbnailUrl } from "../../../../utils/functions";
import { TfiTimer } from "react-icons/tfi";
import ProductReturnForm from './ProductReturnForm'
import { useLanguage } from "../../../../context/LanguageContext";
import { useFeature } from "../../../../context/AppConfigContext";
export default function OrderDetails({ orderId }) {
  const [order, setOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [orderSummary, setOrderSummary] = useState({
    total: "",
    state: "",
    createdDate: "",
    itemsNum: "",
    totalDiscount: "",
    totalOrder: "",
    paymentMethod: "",
    shippingCost: "",
    fulfillmentType: "DELIVERY",
    pickupPlaceName: "",
    pickupPlaceDescription: "",
    pickupPlaceAddress: "",
    pickupPlacePhone: "",
    pickupPlaceWorkingHours: "",
  });
  
  const [isOpenPopup, setOpenPopup] = useState(false);
  const { setSelectedProductId } = useIdContext();
  const navigate = useRouter();
  const { t ,locale} = useLanguage();
  const orderCancellationEnabled = useFeature(
    "features.orderCancellation.enabled",
  );


  const steps = [
    { icon: <TfiTimer size={20} />, label: t("PENDING") },
    { icon: <FaBox size={20} />, label: t("PROCESSING") },
    { icon: <FaTruck size={20} />, label: t("SHIPPED") },
    { icon: <FaCheck size={20} />, label: t("DELIVERED") },
  ];
  const [orderStepPath, setOrderStepPath] = useState();
  const [activeStep, setActiveStep] = useState();
  const [productdata, setProductData] = useState({
    id: "",
    image: "",
    name: "",
    quantity: "",
  });
  const getOrder = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await getRequest(`/api/orders/${orderId}`);
      const resData = res.data;
      setOrder(resData.orderItemLines);
      setOrderSummary((prev) => ({
        ...prev,
        total: resData.total,
        state: resData.state,
        createdDate: resData.createdDate,
        itemsNum: resData.orderItemLines.length,
        totalDiscount: resData.totalDiscount,
        totalOrder: resData.netTotal,
        paymentMethod: resData.paymentMethod,
        shippingCost: resData.shippingCost,
        fulfillmentType: resData.fulfillmentType || "DELIVERY",
        pickupPlaceName: resData.pickupPlaceName || "",
        pickupPlaceDescription: resData.pickupPlaceDescription || "",
        pickupPlaceAddress: resData.pickupPlaceAddress || "",
        pickupPlacePhone: resData.pickupPlacePhone || "",
        pickupPlaceWorkingHours: resData.pickupPlaceWorkingHours || "",
      }));
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [orderId]);
  const orderCancel = async () => {
    try {
      if (orderSummary.state === "PENDING")
        await postRequest(
          `/api/orders/${orderId}/cancel`,
          "",
          t("message"),
        );
      window.location.reload();

    } catch (error) {
    }
  };


  useEffect(() => {
    getOrder();
  }, [getOrder]);
  useEffect(() => {
    if (orderSummary.state === "PENDING") {
      setActiveStep(1);
      setOrderStepPath(6);
    } else if (orderSummary.state === "PROCESSING") {
      setActiveStep(2);
      setOrderStepPath(19);
    } else if (orderSummary.state === "SHIPPED") {
      setActiveStep(3);
      setOrderStepPath(23);
    } else if (orderSummary.state === "DELIVERED") {
      setActiveStep(4);
      setOrderStepPath(30);
    } else {
      setActiveStep(0);
      setOrderStepPath(1);
    }
  }, [orderSummary.state]);

  const date = new Date(orderSummary.createdDate);
  const dateOnly = date.toLocaleDateString("en-GB");

  if (loading) {
    return (
      <div className="w-full h-full p-5" aria-busy="true">
        <div className="mb-6 h-16 animate-pulse rounded-2xl bg-white" />
        <div className="flex md:flex-row xs:flex-col gap-7">
          <div className="h-[420px] w-full animate-pulse rounded-3xl bg-white md:w-[60%]" />
          <div className="h-[420px] w-full animate-pulse rounded-3xl bg-white md:w-[40%]" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-full p-5">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-semibold text-red-700">
            {t("orderDetailsLoadError")}
          </p>
          <button
            type="button"
            onClick={getOrder}
            className="mt-4 rounded-lg bg-[#e14a5c] px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            {t("retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-5">
      <ProductReturnForm productdata ={productdata}  isOpenPopup ={isOpenPopup} setOpenPopup={setOpenPopup}/>
      <div className="relative flex items-center h-16 px-4 my-5">
        <div
          className="absolute top-1/2 left-0 right-0 h-0.5"
          style={{
            background: `linear-gradient(${locale === "en" ? "to right" : "to left"
              }, red ${activeStep * orderStepPath}%, #e0e0e0 ${activeStep * orderStepPath
              }%)`,
          }}
        ></div>
        <div className="flex justify-between w-full relative z-10">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center"
              onClick={() => {
                // console.log(step.l);
                changeState(step.label);
              }}
            >
              {/* الدائرة المحيطة بالأيقونة */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${index + 1 <= activeStep
                    ? "bg-red-100 border-2 border-red-300"
                    : "bg-gray-100 border-2 border-gray-300"
                  }`}
              >
                {/* الأيقونة (ملونة حسب المرحلة النشطة) */}
                <div
                  className={
                    index + 1 <= activeStep ? "text-red-600" : "text-gray-400"
                  }
                >
                  {step.icon}
                </div>
              </div>
              {/* العنوان تحت الأيقونة */}
              <span
                className={`text-xs mt-1 font-medium transition-opacity ${index + 1 <= activeStep
                    ? "text-red-600 opacity-100"
                    : "text-gray-500 opacity-70"
                  }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="relative flex md:flex-row xs:flex-col gap-7 ">
        {/* ── Mobile (XS) card layout ─────────────────────────────── */}
        <div className="xs:flex md:hidden flex-col gap-0 w-full rounded-3xl bg-white overflow-hidden">
          {order.map((product, index) => {
            const productImage = `${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${getThumbnailUrl(
              product.item?.images?.[0]?.imageUrl
            )}`;
            const openProduct = () => {
              setSelectedProductId(product.item.itemId);
              navigate.push(`/user/productdetails/${product.item.itemId}`);
            };
            return (
              <div key={index} className="flex p-4 border-b border-gray-100">
                <div className="flex gap-4 w-full">
                  <div
                    className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 cursor-pointer"
                    onClick={openProduct}
                  >
                    <Image
                      alt=""
                      src={productImage}
                      width={96}
                      height={96}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col">
                    <div
                      className="flex items-start justify-between gap-2 cursor-pointer"
                      onClick={openProduct}
                    >
                      <h1 className="font-semibold text-lg text-gray-900 leading-snug break-words">
                        {localStorage.locale === "ar"
                          ? product.item.nameAr
                          : product.item.nameEn}
                      </h1>
                    </div>

                    <div className="flex flex-col divide-y divide-dotted divide-gray-200 mt-2">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-500">
                          {t("price")}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {product.unitPrice.toLocaleString("en-US")}{" "}
                          {t("currency")}
                          {product.oldUnitPrice ? (
                            <span className="text-xs text-gray-500 line-through mx-2">
                              {product.oldUnitPrice.toLocaleString("en-US")}{" "}
                              {t("currency")}
                            </span>
                          ) : (
                            ""
                          )}
                        </span>
                      </div>

                      {/* <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-500">
                          {t("discount")}
                        </span>
                        {product.oldUnitPrice ? (
                          <span className="bg-red-600 text-sm px-2 py-0.5 text-white rounded-md">
                            {(
                              ((product.oldUnitPrice - product.unitPrice) /
                                product.oldUnitPrice) *
                              100
                            ).toFixed()}
                            %
                          </span>
                        ) : (
                          "--"
                        )}
                      </div> */}

                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-500">
                          {t("quantity")}
                        </span>
                        <div className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1 text-gray-700 min-w-[50px]">
                          <span className="font-medium text-sm">
                            {product.quantity}
                          </span>
                        </div>
                      </div>

                      {orderSummary.state === "DELIVERED" ? (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-500">
                            {t("Returned_quantity")}
                          </span>
                          <div className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1 text-gray-700 min-w-[50px]">
                            <span className="font-medium text-sm">
                              {product.returnedQuantity}
                            </span>
                          </div>
                        </div>
                      ) : (
                        ""
                      )}

                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-500">
                          {t("total")}
                        </span>
                        <span className="text-sm font-bold text-[#da643b]">
                          {product.totalPrice.toLocaleString("en-US")}{" "}
                          {t("currency")}
                        </span>
                      </div>
                    </div>

                    {orderSummary.state === "DELIVERED" ? (
                      <button
                        className={`${product.returnedQuantity !== product.quantity
                            ? "bg-red-600"
                            : "bg-gray-500 cursor-not-allowed"
                          } px-3 py-1.5 text-sm text-center rounded-lg text-white mt-2 self-end`}
                        onClick={() => {
                          if (
                            product.returnedQuantity !== product.quantity
                          ) {
                            setOpenPopup(true);
                            setProductData((prev) => ({
                              ...prev,
                              id: product.itemLineId,
                              image:
                                process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL +
                                getThumbnailUrl(
                                  product.item?.images?.[0]?.imageUrl                                   
                                ),
                              name:
                                localStorage.locale === "ar"
                                  ? product.item.nameAr
                                  : product.item.nameEn,
                              quantity: product.quantity,
                            }));
                          }
                        }}
                      >
                        {t("return")}
                      </button>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Desktop / Tablet table layout ───────────────────────── */}
        <div className="xs:hidden md:flex items-start w-full min-w-0 overflow-x-auto rounded-3xl bg-white">
          <table className="w-full ">
            <thead className="text-justify uppercase tracking-wide">
              <tr className="h-20 border-b border-b-gray-200 border-gray-100">
                <th className=" px-10">{t("product")}</th>
                <th className="px-5 ">{t("price")}</th>
                {/* <th className="px-5 text-start">{t("discount")}</th> */}
                <th className="px-5 ">{t("quantity")}</th>
                {orderSummary.state === "DELIVERED" ? (
                  <th className="">{t("Returned_quantity")} </th>
                ) : (
                  ""
                )}
                <th className="text-end px-5 ">{t("total")}</th>
                {orderSummary.state === "DELIVERED" ? (
                  <th className=" "> </th>
                ) : (
                  ""
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white text-md w-full">
              {order.map((product, index) => {
                return (
                  <tr
                    key={index}
                    className="transition-colors hover:bg-gray-50/60"
                  >
                    <td
                      className="py-5 px-5 cursor-pointer"
                      onClick={() => {
                        setSelectedProductId(product.item.itemId);
                        navigate.push(
                          `/user/productdetails/${product.item.nameEn}/${product.item.itemId}`,
                        );
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                          <Image
                            alt=""
                            src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${getThumbnailUrl(
                              product.item.images[0]?.imageUrl
                            )}`}
                            width={80}
                            height={80}
                            className="h-full w-full object-fill"
                          />
                        </div>

                        <div>
                          <h1 className="font-semibold text-sm text-gray-900">
                            {localStorage.locale === "ar"
                              ? product.item.nameAr
                              : product.item.nameEn}
                          </h1>

                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-5">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-gray-900">
                          {product.unitPrice.toLocaleString("en-US")}{" "}
                          {t("currency")}
                        </span>

                        {product.oldUnitPrice ? (
                          <span className="text-xs text-gray-500 line-through">
                            {product.oldUnitPrice.toLocaleString("en-US")}{" "}
                            {t("currency")}
                          </span>
                        ) : (
                          ""
                        )}
                      </div>
                    </td>

                    <td className="py-5 px-5">
                      <div className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1 text-gray-700 min-w-[50px]">
                        <span className="font-medium text-sm">
                          {product.quantity}
                        </span>
                      </div>
                    </td>
                    {orderSummary.state === "DELIVERED" ? (
                      <td className="text-center">
                        <div className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1 text-gray-700 min-w-[50px]">
                          <span className="font-medium text-sm">
                            {product.returnedQuantity}
                          </span>
                        </div>
                      </td>
                    ) : (
                      ""
                    )}
                    <td className="py-5 px-5 text-end">
                      <span className="font-semibold text-[#da643b]">
                        {product.totalPrice.toLocaleString("en-US")}{" "}
                        {t("currency")}
                      </span>
                    </td>
                    {orderSummary.state === "DELIVERED" ? (
                      <td className="py-5 px-5 text-end">
                        <button
                          className={`${product.returnedQuantity !== product.quantity
                              ? "bg-[#e14a5c]"
                              : "bg-gray-500 cursor-not-allowed"
                            } px-3 py-1.5 text-sm text-center rounded-full text-white`}
                          onClick={() => {
                            if (
                              product.returnedQuantity !== product.quantity
                            ) {
                              setOpenPopup(true);
                              setProductData((prev) => ({
                                ...prev,
                                id: product.itemLineId,
                                image:
                                  process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL +
                                  getThumbnailUrl(
                                    product.item?.images?.[0]?.imageUrl
                                  ),
                                name:
                                  localStorage.locale === "ar"
                                    ? product.item.nameAr
                                    : product.item.nameEn,
                                quantity: product.quantity,
                              }));
                            }
                          }}
                        >
                          {t("return")}
                        </button>
                      </td>
                    ) : (
                      ""
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>


        <div className=" md:w-[40%]  xs:w-full">
          <div className=" p-7  w-full bg-white rounded-3xl">
            <div className="flex justify-between items-center mb-10">
              <h1 className=" text-2xl font-bold">{t("orderSummary")} </h1>
              {orderSummary.state === "CANCELLED" ? (
                <h1 className="flex items-center gap-2 text-lg font-bold text-red-600">
                  <MdCancel />
                  {t("CANCELLED")}
                </h1>
              ) : (
                ""
              )}
            </div>

            <div className="flex justify-between orderss-center mb-5">
              <span className="text-gray-600"> {t("createdDate")}</span>
              <span className="font-semibold">{dateOnly}</span>
            </div>

            <div className="flex justify-between orderss-center mb-5">
              <span className="text-gray-600">
                {t("totalProducts") + " " + `[${orderSummary.itemsNum}]`}
              </span>

              <span className="font-semibold">
                {Number(orderSummary.total ?? 0).toLocaleString("en-US") +
                  " " +
                  t("currency")}
              </span>
            </div>

            <div className="flex justify-between items-center mb-5">
              <span className="text-gray-600 font">{t("payment_method")}</span>
              <span className="font-semibold">{t(orderSummary.paymentMethod)}</span>
            </div>

            <div className="flex justify-between items-center mb-5">
              <span className="text-gray-600">{t("fulfillment_type")}</span>
              <span className="font-semibold">
                {t(
                  orderSummary.fulfillmentType === "PICKUP"
                    ? "pickup"
                    : "delivery",
                )}
              </span>
            </div>

            {orderSummary.fulfillmentType === "PICKUP" ? (
              <div className="mb-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <h2 className="text-sm font-bold text-gray-900">
                  {t("pickup_details")}
                </h2>
                <p className="mt-2 text-sm font-semibold text-gray-800">
                  {orderSummary.pickupPlaceName || "—"}
                </p>
                {orderSummary.pickupPlaceDescription ? (
                  <p className="mt-1 text-xs leading-5 text-gray-600">
                    {orderSummary.pickupPlaceDescription}
                  </p>
                ) : null}
                <div className="mt-3 space-y-1.5 text-xs text-gray-700">
                  <p>
                    <span className="font-semibold">{t("address")}:</span>{" "}
                    {orderSummary.pickupPlaceAddress || "—"}
                  </p>
                  <p>
                    <span className="font-semibold">
                      {t("contact_phone")}:
                    </span>{" "}
                    <span dir="ltr">
                      {orderSummary.pickupPlacePhone || "—"}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold">
                      {t("working_hours")}:
                    </span>{" "}
                    {orderSummary.pickupPlaceWorkingHours || "—"}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="flex justify-between items-center">
              <span className="text-gray-600">{t("shippingCost")} </span>
              <span className="font-semibold">
                {Number(orderSummary.shippingCost ?? 0).toLocaleString("en-US") +
                  " " +
                  t("currency")}
              </span>
            </div>

            <hr className="my-6" />
            <div className="flex justify-between orderss-center text-2xl font-semibold">
              <span>{t("Total")} </span>
              <span className="">
                {orderSummary.totalOrder.toLocaleString("en-US") +
                  " " +
                  t("currency")}
              </span>
            </div>
            {orderCancellationEnabled ? (
              <button
                className={`w-full h-8  mt-7 rounded-full text-white ${orderSummary.state === "PENDING"
                    ? "bg-[#e14a5c] hover:bg-red-600"
                    : "bg-gray-500 cursor-not-allowed"
                  }`}
                onClick={orderCancel}
              >
                {t("order_cancel")}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
