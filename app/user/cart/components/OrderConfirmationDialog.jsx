"use client";

import { useEffect, useRef } from "react";
import { FiShield, FiX } from "react-icons/fi";

import { useLanguage } from "../../../../context/LanguageContext";

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-gray-500">{label}</span>
      <span className="break-words text-end font-semibold text-gray-800">
        {value || "—"}
      </span>
    </div>
  );
}

export default function OrderConfirmationDialog({
  open,
  onClose,
  onConfirm,
  itemCount,
  fulfillmentLabel,
  addressLabel,
  address,
  paymentMethodLabel,
  total,
}) {
  const { t } = useLanguage();
  const confirmButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    confirmButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-confirmation-title"
      aria-describedby="order-confirmation-description"
    >
      <button
        type="button"
        aria-label={t("close")}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff5f6] text-[#CD4354]">
            <FiShield className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="order-confirmation-title"
              className="text-lg font-bold text-gray-900"
            >
              {t("confirm_order_title")}
            </h2>
            <p
              id="order-confirmation-description"
              className="mt-1 text-xs leading-5 text-gray-500"
            >
              {t("confirm_order_message")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CD4354]/40"
          >
            <FiX className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4 text-sm">
          <SummaryRow label={t("order_items_count")} value={itemCount} />
          <SummaryRow label={t("order_fulfillment")} value={fulfillmentLabel} />
          <SummaryRow label={addressLabel} value={address} />
          <SummaryRow
            label={t("payment_method")}
            value={paymentMethodLabel}
          />
          <div className="flex items-center justify-between gap-4 border-t border-dashed border-gray-200 pt-3 text-base font-bold text-gray-900">
            <span>{t("Total")}</span>
            <span className="text-[#da643b]">{total}</span>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
          >
            {t("confirm_order_edit")}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-full bg-[#E76E7D] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#CD4354] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CD4354]/50 focus-visible:ring-offset-2"
          >
            {t("confirmOrder")}
          </button>
        </div>
      </div>
    </div>
  );
}
