"use client";
import { useCallback, useEffect, useState } from "react";
import { MdEmail, MdLocationPin } from "react-icons/md";
import { MdLocalPhone } from "react-icons/md";
import { FiCreditCard, FiMapPin, FiTruck } from "react-icons/fi";

import { useLanguage } from "../../../../../context/LanguageContext.js";
import { getRequest } from "../../../../../utils/requestsUtils.js";

export default function Orders_Details({ orderId, orderType }) {
  const { t } = useLanguage();
  const [orderUser, setOrderUser] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState();
  const [orderAddress, setOrderAddress] = useState();
  const [fulfillmentType, setFulfillmentType] = useState("DELIVERY");
  const [pickupPlace, setPickupPlace] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    workingHours: "",
  });

  const orderItem = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const adminBasePath =
        orderType === "orders" ? "/api/admin/orders" : "/api/admin/return-orders";
      const res = await getRequest(`${adminBasePath}/${orderId}`);
      const resData = res.data;
      setOrderUser(resData.user);
      setPaymentMethod(resData.paymentMethod);
      setOrderAddress(resData.address);
      setFulfillmentType(resData.fulfillmentType || "DELIVERY");
      setPickupPlace({
        name: resData.pickupPlaceName || "",
        description: resData.pickupPlaceDescription || "",
        address: resData.pickupPlaceAddress || "",
        phone: resData.pickupPlacePhone || "",
        workingHours: resData.pickupPlaceWorkingHours || "",
      });
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
      <div className="min-w-0 w-full">
        <div className="h-[420px] admin-skeleton rounded-2xl" aria-busy="true" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-w-0 w-full">
        <div className="admin-alert admin-alert-danger">
          {t("orderDetailsLoadError")}
        </div>
      </div>
    );
  }

  const fullName = `${orderUser.firstName ?? ""} ${orderUser.lastName ?? ""}`.trim();
  const initials =
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <aside className="min-w-0 w-full">
      <section className="admin-card overflow-hidden">
        <div className="admin-card-header">
          <h2 className="admin-card-title">{t("customer_details")}</h2>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#163b5f] text-sm font-bold text-white">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-[#101828]">
                {fullName || "--"}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="admin-stat-icon !h-9 !w-9 admin-tone-rose">
                <MdEmail />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-[#667085]">{t("email")}</p>
                <p className="truncate text-sm font-semibold text-[#101828]">
                  {orderUser.email || "--"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="admin-stat-icon !h-9 !w-9 admin-tone-blue">
                <MdLocalPhone />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-[#667085]">{t("phoneNumber")}</p>
                <p className="truncate text-sm font-semibold text-[#101828]" dir="ltr">
                  {orderUser.phone || "--"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="admin-stat-icon !h-9 !w-9 admin-tone-gray">
                <MdLocationPin />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-[#667085]">{t("governorate")}</p>
                <p className="truncate text-sm font-semibold text-[#101828]">
                  {orderUser.governorate?.nameAr || "--"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 border-t border-[#eef1f6] pt-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#e4e8f0] bg-[#f8fafc] p-3">
              <p className="flex items-center gap-1.5 text-xs text-[#667085]">
                <FiCreditCard />
                {t("payment_method")}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#101828]">
                {t(paymentMethod)}
              </p>
            </div>
            <div className="rounded-xl border border-[#e4e8f0] bg-[#f8fafc] p-3">
              <p className="flex items-center gap-1.5 text-xs text-[#667085]">
                <FiTruck />
                {t("fulfillment_type")}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#101828]">
                {t(fulfillmentType === "PICKUP" ? "pickup" : "delivery")}
              </p>
            </div>
          </div>

          {fulfillmentType === "PICKUP" ? (
            <div className="mt-4 rounded-xl border border-[#e4e8f0] bg-[#fbfcfe] p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[#667085]">
                <FiMapPin />
                {t("pickup_details")}
              </p>
              <p className="mt-2 text-sm font-semibold text-[#101828]">
                {pickupPlace.name || "—"}
              </p>
              {pickupPlace.description ? (
                <p className="mt-1 text-xs leading-5 text-[#667085]">
                  {pickupPlace.description}
                </p>
              ) : null}
              <div className="mt-3 space-y-2 text-xs text-[#475467]">
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
            <div className="mt-4 rounded-xl border border-[#e4e8f0] bg-[#fbfcfe] p-4">
              <p className="text-xs font-semibold text-[#667085]">
                {t("Shipping Address")}
              </p>
              <p className="mt-1.5 text-sm leading-6 text-[#344054]">
                {orderAddress || "—"}
              </p>
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}
