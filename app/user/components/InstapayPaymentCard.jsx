"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FiExternalLink, FiShield, FiX } from "react-icons/fi";
import { PiQrCode } from "react-icons/pi";

import { useAppConfig } from "../../../context/AppConfigContext";
import { useLanguage } from "../../../context/LanguageContext";

const PAYMENT_LINK_KEY = "payments.instapay.paymentLink";
const QR_IMAGE_KEY = "instapay.qr";
const LEGACY_QR_IMAGE_KEY = "payments.instapay.qrImage";
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");

function normalizePaymentLink(value) {
  const trimmed = String(value ?? "").trim();
  if (!/^https?:\/\//i.test(trimmed)) return "";
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.toString()
      : "";
  } catch {
    return "";
  }
}

function resolveImageSource(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  if (/^data:image\//i.test(trimmed)) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/images/")) return `${API_BASE_URL}${trimmed}`;
  if (trimmed.startsWith("/")) return trimmed;
  return `/${trimmed}`;
}

export default function InstapayPaymentCard({
  paymentMethod,
  orderState,
  className = "",
}) {
  const { t } = useLanguage();
  const paymentLinkValue = useAppConfig(PAYMENT_LINK_KEY, "");
  const configuredQrImage = useAppConfig(QR_IMAGE_KEY, "");
  const legacyQrImage = useAppConfig(LEGACY_QR_IMAGE_KEY, "");
  const qrImageValue = configuredQrImage || legacyQrImage;
  const [qrOpen, setQrOpen] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);

  const method =
    paymentMethod && typeof paymentMethod === "object"
      ? paymentMethod.value
      : paymentMethod;
  const paymentLink = normalizePaymentLink(paymentLinkValue);
  const qrImage = resolveImageSource(qrImageValue);
  const visible =
    method === "INSTAPAY" &&
    orderState !== "CANCELLED" &&
    Boolean(paymentLink || qrImage);

  useEffect(() => {
    if (!qrOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setQrOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [qrOpen]);

  if (!visible) return null;

  return (
    <>
      <div
        className={`overflow-hidden rounded-2xl border border-[#7c3aed]/20 bg-white shadow-[0_18px_45px_-24px_rgba(76,29,149,0.55)] ${className}`}
      >
        <div className="relative overflow-hidden bg-gradient-to-l from-[#3b1b8c] via-[#5b2c8d] to-[#7c3aed] px-4 py-3.5">
          <div className="pointer-events-none absolute -left-8 -top-10 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-12 min-w-[8.25rem] shrink-0 items-center justify-center rounded-2xl bg-white px-3 shadow-[0_8px_20px_-8px_rgba(13,6,37,0.8)]">
              <Image
                src="/Images/instapay-logo.png"
                alt="InstaPay"
                width={130}
                height={17}
                className="h-auto w-[118px]"
              />
            </span>
            <div className="min-w-0 flex-1 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">
                {t("secure_payment")}
              </p>
              <h3 className="truncate text-base font-bold">
                {t("pay_with_instapay")}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-4">
          <p className="text-sm leading-6 text-gray-600">
            {t("instapay_payment_link_hint")}
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            {paymentLink ? (
              <a
                href={paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-[#3b1b8c] via-[#5b2c8d] to-[#7c3aed] px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_-12px_rgba(91,44,141,0.9)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-12px_rgba(91,44,141,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]/40"
              >
                <span>{t("open_payment_link")}</span>
                <FiExternalLink className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            ) : null}

            {qrImage ? (
              <button
                type="button"
                onClick={() => {
                  setQrFailed(false);
                  setQrOpen(true);
                }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#7c3aed]/25 bg-[#f5f3ff] px-4 py-2.5 text-sm font-bold text-[#5b2c8d] transition hover:border-[#7c3aed]/50 hover:bg-[#ede9fe] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]/30"
              >
                <PiQrCode className="h-4 w-4" />
                <span>{t("show_instapay_qr")}</span>
              </button>
            ) : null}
          </div>

          <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
            <FiShield className="h-3.5 w-3.5 text-[#7c3aed]" />
            {t("instapay_link_new_tab")}
          </p>
        </div>
      </div>

      {qrOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t("instapay_qr_title")}
        >
          <button
            type="button"
            aria-label={t("close")}
            onClick={() => setQrOpen(false)}
            className="absolute inset-0 bg-[#0d0625]/70 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 bg-gradient-to-l from-[#3b1b8c] via-[#5b2c8d] to-[#7c3aed] px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-9 min-w-[6.75rem] items-center justify-center rounded-xl bg-white px-2.5">
                  <Image
                    src="/Images/instapay-logo.png"
                    alt="InstaPay"
                    width={104}
                    height={14}
                    className="h-auto w-[96px]"
                  />
                </span>
                <h3 className="text-sm font-bold">{t("instapay_qr_title")}</h3>
              </div>
              <button
                type="button"
                onClick={() => setQrOpen(false)}
                aria-label={t("close")}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white hover:text-[#5b2c8d] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="mx-auto flex max-w-[280px] items-center justify-center rounded-2xl border border-[#7c3aed]/15 bg-white p-3 shadow-inner">
                {qrFailed ? (
                  <p className="px-2 py-10 text-center text-sm font-semibold text-red-600">
                    {t("instapay_qr_unavailable")}
                  </p>
                ) : (
                  // The configured QR may be any external or local image path,
                  // so the native image element avoids Next image host rules.
                  <img
                    src={qrImage}
                    alt={t("instapay_qr_title")}
                    className="h-auto max-h-[300px] w-full object-contain"
                    onError={() => setQrFailed(true)}
                  />
                )}
              </div>
              <p className="mt-4 text-center text-xs leading-5 text-gray-500">
                {t("instapay_qr_hint")}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
