"use client";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "../../../../../context/LanguageContext.js";
import { MdEmail, MdLocationCity, MdLocationPin, MdMyLocation } from "react-icons/md";
import { MdLocalPhone } from "react-icons/md";
import { PiUserListFill } from "react-icons/pi";
import { getRequest } from "../../../../../utils/requestsUtils.js";

export default function Orders_Details({ orderId , orderType }) {
  const { t } = useLanguage();
  const [orderUser, setOrderUser] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [paymentMethod , setPaymentMethod] = useState()
  const [orderAddress, setOrderAddress] = useState()
  const [fulfillmentType, setFulfillmentType] = useState("DELIVERY")
  const [pickupPlace, setPickupPlace] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    workingHours: "",
  })
  const orderItem = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res= await getRequest(`/api/${orderType}/${orderId}`)
      const resData = res.data
      setOrderUser(resData.user);
      setPaymentMethod(resData.paymentMethod)
      setOrderAddress(resData.address)
      setFulfillmentType(resData.fulfillmentType || "DELIVERY")
      setPickupPlace({
        name: resData.pickupPlaceName || "",
        description: resData.pickupPlaceDescription || "",
        address: resData.pickupPlaceAddress || "",
        phone: resData.pickupPlacePhone || "",
        workingHours: resData.pickupPlaceWorkingHours || "",
      })
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [orderType, orderId]);
  useEffect(() => {
    orderItem();
  }, [orderItem]);
  if (loading) {
    return (
      <div className="md:order-2 xs:order-1 xs:w-full md:w-[50%]">
        <div className="h-[420px] animate-pulse rounded-lg bg-white" aria-busy="true" />
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="md:order-2 xs:order-1 xs:w-full md:w-[50%]">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-red-700">
          {t("orderDetailsLoadError")}
        </div>
      </div>
    );
  }
  return (
    <div className="md:order-2 xs:order-1 xs:w-full md:w-[50%] bg-white">
      <div className="  bg-white p-7  border rounded-lg">
        <div className="flex justify-between items-center ">
          <h1 className="text-lg font-semibold">{t("user_info")}</h1>
          {/* <button className={`text-red-700`}>{t("view_profile")}</button> */}
        </div>
        <div>
          <div className="flex gap-5 mt-5 items-center">
            <span className="text-2xl text-[#E76E7D] bg-gray-100 p-2 rounded-md">
              <PiUserListFill />
            </span>

            <div>
              <h1 className="font-semibold">
                {orderUser.firstName + " " + orderUser.lastName}
              </h1>
              {/* <h2 className="text-sm text-gray-500">B.D birthDate</h2> */}
            </div>
          </div>
          <div className="flex gap-5 mt-3 items-center">
            <span className="text-2xl text-[#E76E7D] bg-gray-100 p-2 rounded-md">
              <MdEmail />
            </span>
            <div>
              {/* <h1 className="font-semibold text-gray-500">
                {t("Email Address")}
              </h1> */}
              <h2 className=" font-semibold">{orderUser.email}</h2>
            </div>
          </div>
          <div className="flex gap-5 mt-3 items-center">
            <span className="text-2xl text-[#E76E7D] bg-gray-100 p-2 rounded-md">
              <MdLocalPhone />
            </span>

            <div>
              {/* <h1 className="font-semibold text-gray-500">
                {t("Phone Number")}
              </h1> */}
              <h2 className="font-semibold">{orderUser.phone}</h2>
            </div>
          </div>
           <div className="flex gap-5 mt-3 items-center">
            <span className="text-2xl text-[#E76E7D] bg-gray-100 p-2 rounded-md">
              <MdLocationPin />
            </span>

            <div>
         
              <h2 className="font-semibold">{orderUser.governorate?.nameAr}</h2>
            </div>
          </div>
        </div>
        <hr className="my-10" />
        
        <div>
          <div className="" >
            <h1 className="font-semibold text-sm text-gray-500 ">{t("payment_method")}</h1>
            <h2 className="text-lg mt-2 font-semibold">{t(paymentMethod)}</h2>
          </div>
          <div>
            <h1 className="font-semibold text-sm text-gray-500 mt-5">{t("fulfillment_type")}</h1>
            <h2 className="text-lg mt-2 font-semibold">
              {t(fulfillmentType === "PICKUP" ? "pickup" : "delivery")}
            </h2>
          </div>
          {fulfillmentType === "PICKUP" ? (
            <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h1 className="font-semibold text-sm text-gray-500">{t("pickup_details")}</h1>
              <h2 className="text-lg mt-2 font-semibold">{pickupPlace.name || "—"}</h2>
              {pickupPlace.description ? (
                <p className="mt-1 text-sm text-gray-600">{pickupPlace.description}</p>
              ) : null}
              <div className="mt-3 space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">{t("address")}:</span>{" "}
                  {pickupPlace.address || "—"}
                </p>
                <p>
                  <span className="font-semibold">{t("contact_phone")}:</span>{" "}
                  <span dir="ltr">{pickupPlace.phone || "—"}</span>
                </p>
                <p>
                  <span className="font-semibold">{t("working_hours")}:</span>{" "}
                  {pickupPlace.workingHours || "—"}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="font-semibold text-sm text-gray-500 mt-5">{t("Shipping Address")}</h1>
              <h2 className="text-lg mt-2 font-semibold">{orderAddress}</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
