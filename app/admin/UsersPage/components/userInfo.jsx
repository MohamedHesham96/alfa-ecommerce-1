"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaUserLarge } from "react-icons/fa6";
import { ImBlocked } from "react-icons/im";
import { IoLocationSharp } from "react-icons/io5";
import { MdEmail, MdLocalPhone } from "react-icons/md";
import { PiUserListFill } from "react-icons/pi";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";

import { useLanguage } from "../../../../context/LanguageContext.js";
import { getRequest, postRequest } from "../../../../utils/requestsUtils";
import UserOrders from "./userOrder";
import AdminPageHeader from "../../components/ui/AdminPageHeader";
import StatCard from "../../components/ui/StatCard";
import StatusBadge from "../../components/ui/StatusBadge";

const ORDER_STAT_TONES = {
  PENDING: "amber",
  PROCESSING: "blue",
  SHIPPED: "purple",
  DELIVERED: "green",
};

export default function UserInfo({ userId }) {
  const { t, locale } = useLanguage();
  const isArabic = locale === "ar";
  const BackIcon = isArabic ? FiArrowRight : FiArrowLeft;

  const [userInfo, setUserInfo] = useState({
    username: "",
    blocked: "",
    active: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    birthDate: "",
  });
  const [orderState, setOrderState] = useState({
    PROCESSING: 0,
    PENDING: 0,
    DELIVERED: 0,
    SHIPPED: 0,
  });
  const [totalOrders, setTotalOrders] = useState(0);

  const getUserInfo = async () => {
    const res = await getRequest(`/api/admin/users/${userId}`);
    const resData = res.data;

    setUserInfo((prev) => ({
      ...prev,
      username: resData.username,
      blocked: resData.blocked,
      active: resData.active,
      firstName: resData.firstName,
      lastName: resData.lastName,
      email: resData.email,
      phone: resData.phone,
      address: resData.address,
      birthDate: resData.birthDate,
    }));
    resData.ordersState.map((state) => {
      setOrderState((prevState) => ({
        ...prevState,
        [state.state]: state.count,
      }));
    });
  };

  const addBlock = async () => {
    await postRequest(`/api/admin/users/${userId}/block`);
    getUserInfo();
  };
  const removeBlock = async () => {
    await postRequest(`/api/admin/users/${userId}/unblock`);
    getUserInfo();
  };

  useEffect(() => {
    getUserInfo();
  }, []);

  const fullName = `${userInfo.firstName ?? ""} ${userInfo.lastName ?? ""}`.trim();
  const initials =
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U";

  const orderCards = [
    { key: "PENDING", label: t("pending_orders") },
    { key: "PROCESSING", label: t("processing_orders") },
    { key: "SHIPPED", label: t("shipped_orders") },
    { key: "DELIVERED", label: t("delivered_orders") },
  ];

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow={t("nav_customers")}
        title={t("page_account_title")}
        description={t("users_description")}
        actions={
          <Link href="/admin/UsersPage/Users" className="admin-btn admin-btn-secondary admin-btn-sm">
            <BackIcon className="text-sm" />
            {t("users_management")}
          </Link>
        }
      />

      <section className="admin-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--admin-primary)] text-lg font-bold text-white shadow-sm">
              {initials || <FaUserLarge />}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold tracking-tight text-[var(--admin-ink)]">
                {fullName || t("user")}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--admin-muted)]">
                <span className="inline-flex items-center gap-1">
                  {t("username")}: {userInfo.username || "--"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <IoLocationSharp className="text-xs" />
                  {t("egypt")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={userInfo.active === true ? "success" : "neutral"}>
              {userInfo.active === true ? t("active") : t("inactive")}
            </StatusBadge>
            <button
              type="button"
              className={`admin-btn admin-btn-sm ${
                userInfo.blocked === false
                  ? "admin-btn-danger"
                  : "admin-btn-secondary"
              }`}
              onClick={() => {
                if (userInfo.blocked === false) {
                  addBlock();
                } else {
                  removeBlock();
                }
              }}
            >
              <ImBlocked className="text-sm" />
              {userInfo.blocked === false ? t("inactive") : t("active")}
            </button>
          </div>
        </div>
        <div className="grid gap-4 border-t border-[var(--admin-border-subtle)] bg-[var(--admin-surface-hover)] p-5 md:grid-cols-3">
          <div className="flex items-center gap-3">
            <span className="admin-stat-icon !h-9 !w-9 admin-tone-rose">
              <MdEmail />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-[var(--admin-muted)]">{t("email")}</p>
              <p className="truncate text-sm font-semibold text-[var(--admin-ink)]">
                {userInfo.email || "--"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="admin-stat-icon !h-9 !w-9 admin-tone-blue">
              <MdLocalPhone />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-[var(--admin-muted)]">{t("phoneNumber")}</p>
              <p className="truncate text-sm font-semibold text-[var(--admin-ink)]" dir="ltr">
                {userInfo.phone || "--"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="admin-stat-icon !h-9 !w-9 admin-tone-gray">
              <PiUserListFill />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-[var(--admin-muted)]">ID</p>
              <p className="truncate text-sm font-semibold text-[var(--admin-ink)]">
                #{userId}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label={t("total_orders")}
          value={totalOrders}
          icon={<PiUserListFill />}
          tone="rose"
        />
        {orderCards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={orderState[card.key] ?? 0}
            icon={<PiUserListFill />}
            tone={ORDER_STAT_TONES[card.key]}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="admin-card min-w-0 overflow-hidden">
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">{t("order_activity")}</h2>
              <p className="admin-card-description">
                {t("recent_orders_description")}
              </p>
            </div>
          </div>
          <div className="p-3 sm:p-4">
            <UserOrders userId={userId} />
          </div>
        </section>

        <section className="admin-card h-fit overflow-hidden">
          <div className="admin-card-header">
            <h2 className="admin-card-title">{t("customer_details")}</h2>
          </div>
          <div className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <span className="admin-stat-icon !h-9 !w-9 admin-tone-rose">
                <PiUserListFill />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-[var(--admin-muted)]">{t("user_info")}</p>
                <p className="text-sm font-semibold text-[var(--admin-ink)]">
                  {fullName || "--"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="admin-stat-icon !h-9 !w-9 admin-tone-blue">
                <MdEmail />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-[var(--admin-muted)]">{t("email")}</p>
                <p className="break-all text-sm font-semibold text-[var(--admin-ink)]">
                  {userInfo.email || "--"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="admin-stat-icon !h-9 !w-9 admin-tone-green">
                <MdLocalPhone />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-[var(--admin-muted)]">{t("phoneNumber")}</p>
                <p className="text-sm font-semibold text-[var(--admin-ink)]" dir="ltr">
                  {userInfo.phone || "--"}
                </p>
              </div>
            </div>
            <div className="border-t border-[var(--admin-border-subtle)] pt-4">
              <p className="text-xs font-semibold text-[var(--admin-muted)]">
                {t("Shipping Address")}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--admin-ink-soft)]">
                {userInfo.address || "--"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
