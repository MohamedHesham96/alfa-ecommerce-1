"use client";
import { useCallback, useEffect, useState } from "react";
import { MdEmail, MdLocationPin } from "react-icons/md";
import { MdLocalPhone } from "react-icons/md";
import { FiMapPin } from "react-icons/fi";

import { useLanguage } from "../../../../../context/LanguageContext.js";
import { getRequest } from "../../../../../utils/requestsUtils.js";

export default function Orders_Details({ orderId, orderType }) {
  const { t, locale } = useLanguage();
  const [orderUser, setOrderUser] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
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
      setOrderUser(resData.user ?? {});
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
        <div className="h-[280px] admin-skeleton rounded-2xl" aria-busy="true" />
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
  const governorateName =
    locale === "ar"
      ? orderUser.governorate?.nameAr
      : orderUser.governorate?.nameEn || orderUser.governorate?.nameAr;

  return (
    <aside className="min-w-0 w-full">
      <section className="admin-card overflow-hidden">
        <div className="admin-card-header !px-4 !py-2.5">
          <h2 className="admin-card-title">{t("customer_details")}</h2>
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--admin-primary)] text-xs font-bold text-white">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--admin-ink)]">
                {fullName || "--"}
              </p>
              {orderUser.username ? (
                <p className="truncate text-[11px] text-[var(--admin-muted)]" dir="ltr">
                  @{orderUser.username}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="admin-stat-icon !h-8 !w-8 admin-tone-rose">
                <MdEmail />
              </span>
              <div className="min-w-0">
                <p className="text-[10.5px] text-[var(--admin-muted)]">{t("email")}</p>
                <p className="truncate text-[13px] font-semibold text-[var(--admin-ink)]">
                  {orderUser.email || "--"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="admin-stat-icon !h-8 !w-8 admin-tone-blue">
                <MdLocalPhone />
              </span>
              <div className="min-w-0">
                <p className="text-[10.5px] text-[var(--admin-muted)]">{t("phoneNumber")}</p>
                <p className="truncate text-[13px] font-semibold text-[var(--admin-ink)]" dir="ltr">
                  {orderUser.phone || "--"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="admin-stat-icon !h-8 !w-8 admin-tone-gray">
                <MdLocationPin />
              </span>
              <div className="min-w-0">
                <p className="text-[10.5px] text-[var(--admin-muted)]">{t("governorate")}</p>
                <p className="truncate text-[13px] font-semibold text-[var(--admin-ink)]">
                  {governorateName || "--"}
                </p>
              </div>
            </div>
          </div>

          {fulfillmentType === "PICKUP" ? (
            <div className="mt-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-hover)] p-3">
              <p className="flex items-center gap-1.5 text-[10.5px] font-semibold text-[var(--admin-muted)]">
                <FiMapPin />
                {t("pickup_details")}
              </p>
              <p className="mt-1 text-[13px] font-semibold text-[var(--admin-ink)]">
                {pickupPlace.name || "—"}
              </p>
              {pickupPlace.description ? (
                <p className="mt-1 text-[11px] leading-4 text-[var(--admin-muted)]">
                  {pickupPlace.description}
                </p>
              ) : null}
              <div className="mt-2 space-y-1 text-[11px] text-[var(--admin-ink-soft)]">
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
            <div className="mt-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-hover)] p-3">
              <p className="text-[10.5px] font-semibold text-[var(--admin-muted)]">
                {t("Shipping Address")}
              </p>
              <p className="mt-1 text-[13px] leading-5 text-[var(--admin-ink-soft)]">
                {orderAddress || "—"}
              </p>
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}
