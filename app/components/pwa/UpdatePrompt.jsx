"use client";

import { LuLoader } from "react-icons/lu";
import { MdSystemUpdateAlt } from "react-icons/md";
import { useLanguage } from "../../../context/LanguageContext";
import { usePwa } from "./PwaProvider";

export default function UpdatePrompt() {
  const {
    isOnline,
    updateAvailable,
    reloadRequired,
    isApplyingUpdate,
    updateBlocked,
    criticalOperation,
    crossTabCheckout,
    applyUpdate,
    dismissUpdate,
    reloadForUpdate,
  } = usePwa();
  const { t, locale } = useLanguage();

  const translate = (key, fallbackAr, fallbackEn) => {
    const translated = t(key);
    if (translated && translated !== key) return translated;
    return locale === "en" ? fallbackEn : fallbackAr;
  };

  if (!updateAvailable && !reloadRequired) return null;

  const showReload = reloadRequired;
  const checkoutBlocked = criticalOperation || crossTabCheckout;
  const blocked = showReload
    ? checkoutBlocked
    : updateBlocked || checkoutBlocked || !isOnline;

  return (
    <div
      data-testid="update-banner"
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[85] mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_18px_50px_rgba(13,6,37,0.22)] animate-fade-in-up lg:bottom-6"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fdecee] text-[#CD4354]">
          <MdSystemUpdateAlt aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900">
            {showReload
              ? translate(
                  "pwa_update_installed",
                  "تم تثبيت تحديث التطبيق",
                  "The app update was installed",
                )
              : translate(
                  "pwa_update_available",
                  "يتوفر إصدار جديد من التطبيق",
                  "A new app version is available",
                )}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            {showReload
              ? blocked
                ? translate(
                    "pwa_update_checkout",
                    "يمكنك التحديث بعد إتمام عملية الشراء الحالية.",
                    "You can update after completing the current checkout.",
                  )
                : translate(
                    "pwa_update_reload_desc",
                    "أعد تحميل هذه الصفحة لاستخدام الإصدار الجديد.",
                    "Refresh this page to use the new version.",
                  )
              : !isOnline
                ? translate(
                    "pwa_update_offline",
                    "أعد الاتصال بالإنترنت لتثبيت التحديث دون فقدان الصفحات المحفوظة.",
                    "Reconnect to install the update without losing saved offline pages.",
                  )
                : blocked
                  ? translate(
                      "pwa_update_checkout",
                      "يمكنك التحديث بعد إتمام عملية الشراء الحالية.",
                      "You can update after completing the current checkout.",
                    )
                  : translate(
                      "pwa_update_desc",
                      "حدّث الآن للحصول على أحدث المنتجات والتحسينات.",
                      "Update now to get the latest products and improvements.",
                    )}
          </p>

          <div className="mt-3 flex items-center justify-end gap-2">
            {!showReload ? (
              <button
                type="button"
                onClick={dismissUpdate}
                disabled={isApplyingUpdate}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {translate("pwa_update_later", "لاحقًا", "Later")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={showReload ? reloadForUpdate : applyUpdate}
              disabled={isApplyingUpdate || blocked}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#CD4354] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#b93c4b] disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isApplyingUpdate && !showReload ? (
                <LuLoader aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              {showReload
                ? translate("pwa_refresh", "تحديث", "Refresh")
                : isApplyingUpdate
                  ? translate("pwa_update_applying", "جارٍ التحديث…", "Updating…")
                  : translate("pwa_update_now", "تحديث الآن", "Update now")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
