"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MdCancel } from "react-icons/md";
import { FiArrowLeft, FiArrowRight, FiCalendar } from "react-icons/fi";
import { FaBox, FaCheck, FaTruck } from "react-icons/fa";
import { TfiTimer } from "react-icons/tfi";
import { GiMoneyStack } from "react-icons/gi";

import { useLanguage } from "../../../../../context/LanguageContext";
import { postRequest } from "../../../../../utils/requestsUtils.js";
import { useOrderDetailsContext } from "../../../../../context/orderDetailsContext.jsx";
import StatusBadge from "../../../components/ui/StatusBadge";

export default function Orders_Details({ orderId, orderType }) {
  const { t, locale } = useLanguage();
  const { selectedOrderCode, selectedOrderDate, selectedOrderState } =
    useOrderDetailsContext();
  const { setSelectedOrderState, refreshOrderHistory } =
    useOrderDetailsContext();
  const { orderSummary } = useOrderDetailsContext();

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
        const res = await postRequest(
          `/api/admin/orders/${orderId}/changeState/CANCELLED`,
          "",
          t("message"),
        );
        if (res?.success === true) {
          setSelectedOrderState("CANCELLED");
          refreshOrderHistory();
        }
      }
      router.refresh();
    } catch (error) {}
  };

  const changeState = async (state) => {
    try {
      const res = await postRequest(
        `/api/admin/${orderType}/${orderId}/changeState/${state}`,
        "",
        t("message"),
      );
      if (res?.success === true) {
        setSelectedOrderState(state);
        refreshOrderHistory();
      }
    } catch (error) {}
  };

  const returnOrderSteps = [
    { icon: <TfiTimer size={12} />, label: t("PENDING"), value: "PENDING" },
    { icon: <FaCheck size={12} />, label: t("APPROVED"), value: "APPROVED" },
    { icon: <GiMoneyStack size={12} />, label: t("REFUNDED"), value: "REFUNDED" },
  ];
  const orderSteps = [
    { icon: <TfiTimer size={12} />, label: t("PENDING"), value: "PENDING" },
    {
      icon: <FaBox size={12} />,
      label: orderType === "orders" ? t("PROCESSING") : t("APPROVED"),
      value: orderType === "orders" ? "PROCESSING" : "APPROVED",
    },
    {
      icon: <FaTruck size={12} />,
      label: orderType === "orders" ? t("SHIPPED") : t("REFUNDED"),
      value: orderType === "orders" ? "SHIPPED" : "REFUNDED",
    },
    { icon: <FaCheck size={12} />, label: t("DELIVERED"), value: "DELIVERED" },
  ];

  const steps = orderType !== "orders" ? returnOrderSteps : orderSteps;

  const activeStep = (() => {
    if (orderType !== "orders") {
      if (selectedOrderState === "PENDING") return 1;
      if (selectedOrderState === "APPROVED") return 2;
      if (selectedOrderState === "REFUNDED") return 3;
      return 0;
    }
    if (selectedOrderState === "PENDING") return 1;
    if (
      selectedOrderState === "PROCESSING" ||
      selectedOrderState === "APPROVED"
    )
      return 2;
    if (selectedOrderState === "SHIPPED") return 3;
    if (
      selectedOrderState === "DELIVERED" ||
      selectedOrderState === "REFUNDED"
    )
      return 4;
    return 0;
  })();

  const progress =
    steps.length > 1
      ? ((Math.max(1, activeStep) - 1) / (steps.length - 1)) * 100
      : 0;
  const edgeInset = `${50 / steps.length}%`;

  const money = (value) =>
    `${Number(value ?? 0).toLocaleString("en-US")} ${t("currency")}`;
  const discount = Number(orderSummary?.discount ?? 0);
  const summaryCells = [
    {
      key: "items",
      label: t("items"),
      value: orderSummary ? orderSummary.itemCount : null,
    },
    {
      key: "subtotal",
      label: t("subtotal"),
      value: orderSummary
        ? money(Number(orderSummary.total ?? 0) + discount)
        : null,
    },
    {
      key: "shipping",
      label: t("shippingCost"),
      value: orderSummary ? money(orderSummary.shippingCost) : null,
    },
    {
      key: "total",
      label: t("total"),
      value: orderSummary ? money(orderSummary.netTotal) : null,
      strong: true,
      note: discount > 0 ? `${t("discount")}: ${money(discount)}` : null,
    },
    {
      key: "payment",
      label: t("payment_method"),
      value: orderSummary?.paymentMethod ? t(orderSummary.paymentMethod) : null,
    },
    {
      key: "fulfillment",
      label: t("fulfillment_type"),
      value: orderSummary?.fulfillmentType
        ? t(orderSummary.fulfillmentType === "PICKUP" ? "pickup" : "delivery")
        : null,
    },
  ];

  return (
    <section className="admin-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
          <Link
            href={orderType === "orders" ? "/admin/orders" : "/admin/Returns"}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--admin-muted)] transition-colors hover:text-[var(--admin-ink)]"
          >
            <BackIcon className="text-[11px]" />
            {orderType === "orders" ? t("back_to_orders") : t("back_to_returns")}
          </Link>
          <span className="hidden h-4 w-px bg-[var(--admin-border)] sm:block" aria-hidden="true" />
          <div className="min-w-0">
            <p className="admin-page-eyebrow !mb-0 !text-[10px]">
              {orderType === "orders" ? t("order_details") : t("return_details")}
            </p>
            <h1 className="text-xl font-bold leading-tight tracking-tight text-[var(--admin-ink)]">
              {selectedOrderCode || "—"}
            </h1>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--admin-muted)]">
            <FiCalendar className="text-[11px]" />
            {t("placed_on")} {fullDateTime}
          </span>
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

      <dl className="grid grid-cols-2 gap-px border-y border-[var(--admin-border-subtle)] bg-[var(--admin-border-subtle)] sm:grid-cols-3 lg:grid-cols-6">
        {summaryCells.map((cell) => (
          <div key={cell.key} className="min-w-0 bg-[var(--admin-surface)] px-4 py-2">
            <dt className="truncate text-[10.5px] font-semibold text-[var(--admin-muted)]">
              {cell.label}
            </dt>
            <dd
              className={`truncate text-[13px] font-bold ${
                cell.strong ? "text-[var(--admin-danger-text)]" : "text-[var(--admin-ink)]"
              }`}
              title={cell.value ?? undefined}
            >
              {cell.value ?? "—"}
            </dd>
            {cell.note ? (
              <dd className="truncate text-[10px] text-[var(--admin-muted)]">{cell.note}</dd>
            ) : null}
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-1.5 px-4 pt-2">
        <span className="text-[10.5px] font-bold text-[var(--admin-ink)]">
          {t("fulfillment_progress")}
        </span>
        <span className="text-[10.5px] text-[var(--admin-muted)]">
          {t("status")}:{" "}
          <span className="font-semibold text-[var(--admin-danger-text)]">
            {t(selectedOrderState)}
          </span>
        </span>
      </div>

      <div className="px-4 pb-2.5 pt-1.5">
        <div className="relative">
          <div
            className="absolute top-[12px] h-0.5 rounded-full bg-[var(--admin-border)]"
            style={{ insetInlineStart: edgeInset, insetInlineEnd: edgeInset }}
            aria-hidden="true"
          >
            <div
              className="h-full rounded-full bg-[var(--admin-accent)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="relative z-10 flex items-start">
            {steps.map((step, index) => {
              const completed = index + 1 <= activeStep;
              return (
                <button
                  key={step.value ?? index}
                  type="button"
                  title={step.label}
                  className="group flex flex-1 flex-col items-center gap-1 text-center"
                  onClick={() => changeState(step.value)}
                >
                  <span
                    className={`flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 bg-[var(--admin-surface)] transition-all duration-300 ${
                      completed
                        ? "border-[var(--admin-accent)] bg-[var(--admin-danger-soft)] text-[var(--admin-accent)]"
                        : "border-[var(--admin-border)] text-[var(--admin-muted-soft)] group-hover:border-[var(--admin-border-strong)]"
                    }`}
                  >
                    {step.icon}
                  </span>
                  <span
                    className={`text-[10px] font-semibold leading-3 ${
                      completed ? "text-[var(--admin-danger-text)]" : "text-[var(--admin-muted-soft)]"
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
