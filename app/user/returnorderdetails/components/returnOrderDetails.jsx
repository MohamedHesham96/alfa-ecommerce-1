"use client";
import Image from "next/image";
import { MdCancel, MdDelete } from "react-icons/md";
import { getRequest, postRequest } from "../../../../utils/requestsUtils";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "../../../../context/LanguageContext";
import { useRouter } from "next/navigation";
import {  FaCheck } from "react-icons/fa";
import { getThumbnailUrl } from "../../../../utils/functions";
import { GiMoneyStack } from "react-icons/gi";
import { TfiTimer } from "react-icons/tfi";

export default function OrderDetails({ returnOrderId }) {
  const [order, setOrder] = useState({});
  // const [itemPrice, setItemPrice] = useState(0);
  // const [totalDiscount, setTotalDiscount] = useState(0);
  // const [itemsNum, setItemsNum] = useState();
  // const [createdDate, setCreatedDate] = useState();
  // const [state, setState] = useState();
  // const [total, setTotal] = useState(0);
  const [quantity, setQuantity] = useState();
  const [reason, setReason] = useState();
  const [orderSummary, setOrderSummary] = useState({
    total: "",
    state: "",
    quantity:"",

    createdDate: "",
    itemsNum: "",
    totalDiscount: "",
    unitPrice: "",
    reason: "",
    reasonMessage: "",
  });
const navigate = useRouter();
  const { t } = useLanguage();
  const { locale } = useLanguage();

  const steps = [
    { icon: <TfiTimer  size={20} />, label: t("PENDING") },
    { icon: <FaCheck  size={20} />, label: t("APPROVED") },
    { icon: <GiMoneyStack size={20} />, label: t("REFUNDED") },
  ];
  const [orderStepPath, setOrderStepPath] = useState();
  const [activeStep, setActiveStep] = useState();


  const getOrder = useCallback(async () => {
    const res = await getRequest(`/api/return-orders/${returnOrderId}`);
    const resData = res.data;
    setOrder(resData.item);
    setOrderSummary((prev) => ({
      ...prev,
      total: resData.unitPrice,
      state: resData.state,
      quantity: resData.quantity,
      createdDate: resData.createdDate,
      itemsNum: resData.length,
      totalDiscount: resData.refundAmount,
      unitPrice: resData.unitPrice,
      reasonMessage: resData.reasonMessage,
      reason: resData.reason,
    }));
  }, [returnOrderId]);
  const orderCancel = async () => {
    try {
      if (state === "PENDING")
        await postRequest(
          `/api/user/orders/${returnOrderId}/cancel`,
          "",
          t("message"),
        );
    } catch (error) {
    }
  };

  useEffect(() => {
    getOrder();
  }, [getOrder]);
  useEffect(() => {
    if (orderSummary.state === "PENDING") {
      setActiveStep(1);
      setOrderStepPath(8);
    } else if (orderSummary.state === "APPROVED") {
      setActiveStep(2);
      setOrderStepPath(27);
    
    } else if (orderSummary.state === "REFUNDED") {
      setActiveStep(4);
      setOrderStepPath(30);
    } else {
      setActiveStep(0);
      setOrderStepPath(1);
    }
  }, [orderSummary.state]);

  const date = new Date(orderSummary.createdDate);
  const dateOnly = date.toLocaleDateString("en-GB");
  return (
    <div className="w-full h-full p-10">
      <div className="relative flex items-center h-16 px-4 my-5">
        <div
          className="absolute top-1/2 left-0 right-0 h-0.5"
          style={{
            background: `linear-gradient(${
              locale === "en" ? "to right" : "to left"
            }, red ${activeStep * orderStepPath}%, #e0e0e0 ${
              activeStep * orderStepPath
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
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  index + 1 <= activeStep
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
                className={`text-xs mt-1 font-medium transition-opacity ${
                  index + 1 <= activeStep
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
          <div className="flex p-4 border-b border-gray-100">
            <div className="flex gap-4 w-full">
              <div
                className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 cursor-pointer"
                onClick={() =>
                  navigate.push(`/user/productdetails/${order.itemId}`)
                }
              >
                <Image
                  alt=""
                  src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${getThumbnailUrl(
                    order.images?.[0]?.imageUrl || order.mainImageURL
                  )}`}
                  width={96}
                  height={96}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="flex-1 min-w-0 flex flex-col">
                <div
                  className="flex items-start justify-between gap-2 cursor-pointer"
                  onClick={() =>
                    navigate.push(`/user/productdetails/${order.itemId}`)
                  }
                >
                  <h1 className="font-semibold text-lg text-gray-900 leading-snug break-words">
                    {locale === "ar" ? order.nameAr : order.nameEn}
                  </h1>
                </div>

                <div className="flex flex-col divide-y divide-dotted divide-gray-200 mt-2">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500">{t("price")}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {order.price?.toLocaleString("en-US")} {t("currency")}
                      {order.oldPrice ? (
                        <span className="text-xs text-gray-500 line-through mx-2">
                          {order.oldPrice.toLocaleString("en-US")}{" "}
                          {t("currency")}
                        </span>
                      ) : (
                        ""
                      )}
                    </span>
                  </div>


                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500">
                      {t("quantity")}
                    </span>
                    <div className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1 text-gray-700 min-w-[50px]">
                      <span className="font-medium text-sm">
                        {orderSummary.quantity}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500">{t("total")}</span>
                    <span className="text-sm font-bold text-[#da643b]">
                      {(order.price * orderSummary.quantity).toLocaleString(
                        "en-US"
                      )}{" "}
                      {t("currency")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Desktop / Tablet table layout ───────────────────────── */}
        <div className="xs:hidden md:flex w-full min-w-0 overflow-x-auto rounded-3xl bg-white">
          <table className="w-full min-w-[640px]">
            <thead className="text-center uppercase tracking-wide">
              <tr className="h-20 border-b border-b-gray-200 border-gray-100">
                <th className="px-5 text-start">{t("product")}</th>
                <th className="px-5 text-start">{t("price")}</th>
                <th className="px-5 text-start">{t("quantity")}</th>
                <th className="px-5 text-end">{t("total")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white text-md w-full">
              <tr className="transition-colors hover:bg-gray-50/60">
                <td
                  className="py-5 px-5 cursor-pointer"
                  onClick={() =>
                    navigate.push(`/user/productdetails/${order.itemId}`)
                  }
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                      <Image
                        alt=""
                        src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${getThumbnailUrl(
                          order.images?.[0]?.imageUrl || order.mainImageURL
                        )}`}
                        width={80}
                        height={80}
                        className="h-full w-full object-fill"
                      />
                    </div>

                    <div>
                      <h1 className="font-semibold text-sm text-gray-900">
                        {locale === "ar" ? order.nameAr : order.nameEn}
                      </h1>
                      <h1 className="text-xs text-gray-500">{order.code}</h1>
                    </div>
                  </div>
                </td>
                <td className="py-5 px-5">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-900">
                      {order.price?.toLocaleString("en-US")} {t("currency")}
                    </span>

                    {order.oldPrice ? (
                      <span className="text-xs text-gray-500 line-through">
                        {order.oldPrice.toLocaleString("en-US")}{" "}
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
                      {orderSummary.quantity}
                    </span>
                  </div>
                </td>
                <td className="py-5 px-5 text-end">
                  <span className="font-semibold text-[#da643b]">
                    {(order.price * orderSummary.quantity).toLocaleString(
                      "en-US"
                    )}{" "}
                    {t("currency")}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className=" md:w-[40%]  xs:w-full">
          <div className=" p-7  w-full bg-white rounded-3xl">
            <div className="flex justify-between items-center mb-10">
              <h1 className=" text-2xl font-bold">{t("returnSummary")} </h1>
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

           
            <div className="flex justify-between items-center mb-5">
              <span className="text-gray-600">{t("reason")} </span>
              <span className="font-semibold">{t(orderSummary.reason)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">{t("reasonMessage")} </span>
              <span className="font-semibold">
                {orderSummary.reasonMessage}
              </span>
            </div>

            <hr className="my-6" />
            <div className="flex justify-between orderss-center text-2xl font-semibold">
              <span>{t("total")} </span>
              <span className="">
                {orderSummary.total.toLocaleString("en-US") +
                  " " +
                  t("currency")}
              </span>
            </div>
            <button
              className={`w-full h-8  mt-7 rounded-full text-white ${
                orderSummary.state === "PENDING"
                  ? "bg-[#e14a5c] hover:bg-red-600"
                  : "bg-gray-500 cursor-not-allowed"
              }`}
              onClick={orderCancel}
            >
              {t("return_cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
