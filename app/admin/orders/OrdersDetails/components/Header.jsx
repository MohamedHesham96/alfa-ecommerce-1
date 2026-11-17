"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MdCancel } from "react-icons/md";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";

import { useLanguage } from "../../../../../context/LanguageContext";
import { postRequest } from "../../../../../utils/requestsUtils.js";
import { useOrderDetailsContext } from "../../../../../context/orderDetailsContext.jsx";
import StatusBadge from "../../../components/ui/StatusBadge";

export default function Orders_Details({ orderId, orderType }) {
  const { t, locale } = useLanguage();
  const { selectedOrderCode } = useOrderDetailsContext();
  const { selectedOrderDate } = useOrderDetailsContext();
  const { selectedOrderState } = useOrderDetailsContext();

  const date = new Date(selectedOrderDate);
  const fullDateTime = Number.isNaN(date.getTime())
    ? "--"
    : date.toLocaleDateString("en-GB");
  const router = useRouter();
  const isArabic = locale === "ar";
  const BackIcon = isArabic ? FiArrowRight : FiArrowLeft;

  const orderCancel = async () => {
    try {
      if (orderType === "orders") {
        await postRequest(
          `/api/admin/orders/${orderId}/changeState/CANCELLED`,
          "",
          t("message"),
        );
      } else {
      }
      router.refresh();
    } catch (error) {}
  };

  return (
    <div className="w-full">
      <Link
        href={orderType === "orders" ? "/admin/orders" : "/admin/Returns"}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#667085] transition-colors hover:text-[#101828]"
      >
        <BackIcon className="text-sm" />
        {orderType === "orders" ? t("back_to_orders") : t("back_to_returns")}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="admin-page-eyebrow">
            {orderType === "orders" ? t("order_details") : t("return_details")}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#101828]">
            {selectedOrderCode}
          </h1>
          <p className="mt-1 text-xs text-[#667085]">
            {t("placed_on")} {fullDateTime}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedOrderState ? (
            <StatusBadge
              tone={
                selectedOrderState === "PENDING"
                  ? "pending"
                  : selectedOrderState === "PROCESSING" ||
                      selectedOrderState === "APPROVED"
                    ? "processing"
                    : selectedOrderState === "SHIPPED"
                      ? "shipped"
                      : selectedOrderState === "DELIVERED" ||
                          selectedOrderState === "REFUNDED"
                        ? "delivered"
                        : selectedOrderState === "REJECTED"
                          ? "rejected"
                          : "cancelled"
              }
            >
              {t(selectedOrderState)}
            </StatusBadge>
          ) : null}

          {selectedOrderState !== "CANCELLED" &&
          selectedOrderState !== "DELIVERED" &&
          selectedOrderState !== "REFUNDED" &&
          orderType === "orders" ? (
            <button
              type="button"
              className="admin-btn admin-btn-danger admin-btn-sm"
              onClick={orderCancel}
            >
              <MdCancel className="text-base" />
              {t("order_cancel")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
