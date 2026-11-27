"use client";

import { FiChevronLeft, FiChevronRight, FiMapPin } from "react-icons/fi";
import { PiUser } from "react-icons/pi";

import { useLanguage } from "../../../context/LanguageContext";

export default function HeaderAccountChip({
  isAdmin,
  hasSession,
  username,
  addressLabel,
  addressMeta,
  addressTitle,
  onClick,
}) {
  const { t, locale } = useLanguage();
  const Chevron = locale === "ar" ? FiChevronLeft : FiChevronRight;
  const showAddress = !isAdmin && Boolean(addressLabel);
  const displayName = isAdmin
    ? t("dashboard")
    : username || `${t("login")} / ${t("register")}`;
  const ariaLabel = isAdmin
    ? t("dashboard")
    : hasSession || username
      ? `${t("personalAccount")} - ${displayName}${
          showAddress ? ` - ${t("default_address_label")}: ${addressLabel}` : ""
        }`
      : `${t("login")} / ${t("register")}`;

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={showAddress ? addressTitle : undefined}
      onClick={onClick}
      className="group inline-flex items-center gap-2.5 rounded-full bg-white p-1.5 text-start shadow-[0_8px_24px_-10px_rgba(13,6,37,0.55)] ring-1 ring-white/70 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-10px_rgba(13,6,37,0.7)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0d0625] text-white ring-2 ring-[#d63b4d]/20 transition-colors duration-200 group-hover:bg-[#d63b4d]">
        <PiUser className="h-4 w-4" aria-hidden="true" />
      </span>

      <span className="flex min-w-0 flex-col items-start pe-1 leading-tight">
        {!isAdmin && username ? (
          <span className="text-[10px] font-semibold text-[#b8243b]/70">
            {t("hello")}
          </span>
        ) : null}
        <span className="max-w-[130px] truncate text-sm font-bold text-[#7f1d2d]">
          {displayName}
        </span>
      </span>

      {showAddress ? (
        <>
          <span
            className="h-9 w-px shrink-0 bg-[#b8243b]/15"
            aria-hidden="true"
          />
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff5f6] text-[#CD4354]">
              <FiMapPin className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="text-[9px] font-bold text-[#b8243b]/60">
                {t("default_address_label")}
              </span>
              <span className="max-w-[180px] truncate text-xs font-bold text-[#5f1520]">
                {addressLabel}
                {addressMeta ? ` · ${addressMeta}` : ""}
              </span>
            </span>
          </span>
          <Chevron
            className="me-1 h-3.5 w-3.5 shrink-0 text-[#b8243b]/40 transition group-hover:text-[#b8243b]"
            aria-hidden="true"
          />
        </>
      ) : null}
    </button>
  );
}
