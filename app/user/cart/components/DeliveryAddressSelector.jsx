"use client";

import Link from "next/link";
import { LuLoader } from "react-icons/lu";

import { useLanguage } from "../../../../context/LanguageContext";

export default function DeliveryAddressSelector({
  addresses = [],
  selectedId,
  onSelect,
  loading,
  error,
  onRetry,
  signedIn = true,
}) {
  const { t, locale } = useLanguage();

  if (loading) {
    return (
      <div className="mb-5 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        <LuLoader className="animate-spin" />
        {t("loading_addresses")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
        <p className="text-sm font-semibold text-red-700">
          {t("addresses_load_error")}
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
          >
            {t("retry")}
          </button>
        ) : null}
      </div>
    );
  }

  if (!signedIn) {
    return (
      <p className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        {t("select_address")}
      </p>
    );
  }

  if (!addresses.length) {
    return (
      <div className="mb-5 rounded-xl border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-600">
        <p>{t("noSavedAddresses")}</p>
        <Link
          href="/user/profile"
          className="mt-2 inline-block text-xs font-semibold text-red-600 underline"
        >
          {t("addAddress")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <p className="mb-2 text-sm font-semibold text-gray-700">
        {t("selectDeliveryAddress")}
      </p>
      <div
        role="radiogroup"
        aria-label={t("selectDeliveryAddress")}
        className="max-h-[320px] space-y-2 overflow-y-auto pe-1"
      >
        {addresses.map((address) => {
          const selected =
            String(selectedId) === String(address.userAddressId);
          const governorateName =
            locale === "ar"
              ? address.governorate?.nameAr
              : address.governorate?.nameEn;
          const areaName =
            locale === "ar"
              ? address.area?.nameAr
              : address.area?.nameEn;
          return (
            <label
              key={address.userAddressId}
              data-testid={`delivery-address-${address.userAddressId}`}
              className={`block cursor-pointer rounded-xl border p-3 transition ${
                selected
                  ? "border-[#CD4354] bg-[#fff5f6] ring-2 ring-[#CD4354]/20"
                  : "border-gray-200 bg-white hover:border-[#CD4354]/50 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start gap-2">
                <input
                  type="radio"
                  name="delivery-address"
                  value={address.userAddressId}
                  checked={selected}
                  onChange={() => onSelect(address.userAddressId)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#CD4354]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">
                      {address.label || t("address")}
                    </span>
                    {address.defaultAddress ? (
                      <span className="rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                        {t("defaultAddress")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 break-words text-xs leading-5 text-gray-700">
                    {address.address}
                  </p>
                  {governorateName ? (
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {governorateName}
                      {areaName ? ` · ${areaName}` : ""}
                    </p>
                  ) : null}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
