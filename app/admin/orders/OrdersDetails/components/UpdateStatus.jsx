"use client";
import { FaBox, FaCheck, FaShoppingBag, FaTruck } from "react-icons/fa";
import { useEffect, useState } from "react";
import { TfiTimer } from "react-icons/tfi";
import { GiMoneyStack } from "react-icons/gi";

import { postRequest } from "../../../../../utils/requestsUtils";
import { useOrderDetailsContext } from "../../../../../context/orderDetailsContext";
import { useLanguage } from "../../../../../context/LanguageContext";

export default function UpdateStatus({ orderId, orderType }) {
  const [activeStep, setActiveStep] = useState();
  const { t } = useLanguage();
  const { selectedOrderState, setSelectedOrderState, refreshOrderHistory } =
    useOrderDetailsContext();
  const [orderStepPath, setOrderStepPath] = useState(5);

  useEffect(() => {
    if (selectedOrderState === "PENDING") {
      setActiveStep(1);
      setOrderStepPath(8);
    } else if (
      selectedOrderState === "PROCESSING" ||
      selectedOrderState === "APPROVED"
    ) {
      setActiveStep(2);
      setOrderStepPath(orderType === "orders" ? 19 : 27);
    } else if (
      selectedOrderState === "SHIPPED" ||
      selectedOrderState === "REJECTED"
    ) {
      setActiveStep(3);
      setOrderStepPath(23);
    } else if (
      selectedOrderState === "DELIVERED" ||
      selectedOrderState === "REFUNDED"
    ) {
      setActiveStep(4);
      setOrderStepPath(30);
    } else {
      setActiveStep(0);
      setOrderStepPath(1);
    }
  }, [selectedOrderState, orderType]);

  const returnOrderSteps = [
    {
      icon: <TfiTimer size={18} />,
      label: t("PENDING"),
      value: "PENDING",
    },
    { icon: <FaCheck size={18} />, label: t("APPROVED"), value: "APPROVED" },
    { icon: <GiMoneyStack size={18} />, label: t("REFUNDED"), value: "REFUNDED" },
  ];
  const orderSteps = [
    {
      icon: <TfiTimer size={18} />,
      label: t("PENDING"),
      value: "PENDING",
    },
    {
      icon: <FaBox size={18} />,
      label: orderType === "orders" ? t("PROCESSING") : t("APPROVED"),
      value: orderType === "orders" ? "PROCESSING" : "APPROVED",
    },
    {
      icon: <FaTruck size={18} />,
      label: orderType === "orders" ? t("SHIPPED") : t("REFUNDED"),
      value: orderType === "orders" ? "SHIPPED" : "REFUNDED",
    },
    { icon: <FaCheck size={18} />, label: t("DELIVERED"), value: "DELIVERED" },
  ];

  const changeState = async (state) => {
    try {
      if (state === "CANCELED") {
        "";
      } else {
        const res = await postRequest(
          `/api/admin/${orderType}/${orderId}/changeState/${state}`,
          "",
          t("message"),
        );
        if (res?.success === true) {
          setSelectedOrderState(state);
          refreshOrderHistory();
        }
      }
    } catch (error) {}
  };

  const steps = orderType !== "orders" ? returnOrderSteps : orderSteps;

  return (
    <section className="admin-card mt-4 p-4 sm:p-5">
      <div className="admin-section-heading !mb-4">
        <div>
          <h2 className="admin-card-title">{t("fulfillment_progress")}</h2>
          <p className="admin-card-description">
            {t("status")}: {t(selectedOrderState)}
          </p>
        </div>
        <span className="admin-badge admin-badge-gray">
          <FaShoppingBag className="text-[10px]" />
          {t(orderType === "orders" ? "orders" : "returns")}
        </span>
      </div>

      <div className="relative flex h-20 items-center px-2">
        <div
          className="absolute start-6 end-6 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-[var(--admin-border)]"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-[var(--admin-accent)] transition-all duration-300"
            style={{
              width: `${Math.min(100, activeStep * orderStepPath)}%`,
            }}
          />
        </div>
        <div className="relative z-10 flex w-full items-start justify-between">
          {steps.map((step, index) => {
            const completed = index + 1 <= activeStep;
            return (
              <button
                key={step.value ?? index}
                type="button"
                className="group flex max-w-[110px] flex-col items-center gap-2 text-center"
                onClick={() => changeState(step.value)}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    completed
                      ? "border-[var(--admin-accent)] bg-[var(--admin-accent-soft)] text-[var(--admin-accent)] shadow-[0_0_0_4px_var(--admin-focus-ring)]"
                      : "border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-muted-soft)] group-hover:border-[var(--admin-border-strong)]"
                  }`}
                >
                  {step.icon}
                </span>
                <span
                  className={`text-[11px] font-semibold leading-4 ${
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
    </section>
  );
}
