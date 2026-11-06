"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { LuLoader } from "react-icons/lu";
import { MdAddCircleOutline, MdClose, MdInstallMobile, MdShare } from "react-icons/md";
import { useLanguage } from "../../../context/LanguageContext";
import { INSTALL_MODES } from "../../../lib/pwa/install";
import { usePwa } from "./PwaProvider";

export default function InstallPrompt() {
  const {
    installed,
    isStandalone,
    canInstall,
    installMode,
    installBannerVisible,
    installDialogOpen,
    isInstallBusy,
    openInstallPrompt,
    closeInstallPrompt,
    promptInstall,
    dismissInstall,
  } = usePwa();
  const { t, locale } = useLanguage();
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  const translate = (key, fallbackAr, fallbackEn) => {
    const translated = t(key);
    if (translated && translated !== key) return translated;
    return locale === "en" ? fallbackEn : fallbackAr;
  };

  useEffect(() => {
    if (!installDialogOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") closeInstallPrompt();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [installDialogOpen, closeInstallPrompt]);

  if (installed || isStandalone || !canInstall) return null;

  const isIosInstructions = installMode === INSTALL_MODES.IOS_INSTRUCTIONS;

  return (
    <>
      {installBannerVisible && !installDialogOpen ? (
        <div
          data-testid="install-banner"
          className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[84] mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_18px_50px_rgba(13,6,37,0.22)] animate-fade-in-up lg:bottom-6"
        >
          <div className="flex items-start gap-3">
            <span className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
              <Image
                src="/icons/icon-192.png"
                alt=""
                width={48}
                height={48}
                unoptimized
                className="h-full w-full object-cover"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900">
                {translate("pwa_install_title", "ثبّت تطبيق ألفا", "Install the Alfa app")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                {isIosInstructions
                  ? translate(
                      "pwa_ios_install_short",
                      "أضف ألفا إلى الشاشة الرئيسية لتصفح أسرع.",
                      "Add Alfa to your Home Screen for faster shopping.",
                    )
                  : translate(
                      "pwa_install_desc",
                      "تسوق أسرع من الشاشة الرئيسية، مع تجربة ملء الشاشة.",
                      "Shop faster from your Home Screen with a full-screen experience.",
                    )}
              </p>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={dismissInstall}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  {translate("pwa_not_now", "لاحقًا", "Not now")}
                </button>
                <button
                  type="button"
                  onClick={isIosInstructions ? openInstallPrompt : promptInstall}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#CD4354] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#b93c4b]"
                >
                  <MdInstallMobile aria-hidden="true" className="h-4 w-4" />
                  {isIosInstructions
                    ? translate("pwa_ios_how", "كيفية التثبيت", "How to install")
                    : translate("pwa_install_now", "تثبيت الآن", "Install now")}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissInstall}
              aria-label={translate("close", "إغلاق", "Close")}
              className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <MdClose aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}

      {installDialogOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-3 xs:items-center xs:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeInstallPrompt();
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-title"
            data-testid="install-dialog"
            className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl xs:rounded-3xl sm:p-6"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="relative flex h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
                  <Image
                    src="/icons/icon-192.png"
                    alt=""
                    width={56}
                    height={56}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                </span>
                <div>
                  <h2 id="pwa-install-title" className="text-lg font-bold text-gray-900">
                    {isIosInstructions
                      ? translate(
                          "pwa_ios_install_title",
                          "أضف ألفا إلى الشاشة الرئيسية",
                          "Add Alfa to your Home Screen",
                        )
                      : translate("pwa_install_title", "ثبّت تطبيق ألفا", "Install the Alfa app")}
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">Alfa E-commerce</p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeInstallPrompt}
                aria-label={translate("close", "إغلاق", "Close")}
                className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <MdClose aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            {isIosInstructions ? (
              <div className="mt-5">
                <p className="text-sm leading-relaxed text-gray-600">
                  {translate(
                    "pwa_ios_install_desc",
                    "افتح الموقع في Safari ثم أضفه إلى الشاشة الرئيسية للاستمتاع بتجربة التطبيق.",
                    "Open this site in Safari, then add it to your Home Screen to use the app experience.",
                  )}
                </p>
                <ol className="mt-4 space-y-3">
                  <li className="flex items-start gap-3 rounded-2xl bg-gray-50 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#CD4354] shadow-sm">
                      1
                    </span>
                    <span className="flex items-center gap-2 text-sm text-gray-700">
                      <MdShare aria-hidden="true" className="h-4 w-4 shrink-0 text-[#CD4354]" />
                      {translate(
                        "pwa_ios_step_1",
                        "اضغط زر المشاركة في Safari.",
                        "Tap the Share button in Safari.",
                      )}
                    </span>
                  </li>
                  <li className="flex items-start gap-3 rounded-2xl bg-gray-50 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#CD4354] shadow-sm">
                      2
                    </span>
                    <span className="flex items-center gap-2 text-sm text-gray-700">
                      <MdAddCircleOutline aria-hidden="true" className="h-4 w-4 shrink-0 text-[#CD4354]" />
                      {translate(
                        "pwa_ios_step_2",
                        "اختر «إضافة إلى الشاشة الرئيسية».",
                        "Choose “Add to Home Screen”.",
                      )}
                    </span>
                  </li>
                  <li className="flex items-start gap-3 rounded-2xl bg-gray-50 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#CD4354] shadow-sm">
                      3
                    </span>
                    <span className="text-sm text-gray-700">
                      {translate(
                        "pwa_ios_step_3",
                        "اضغط «إضافة» لفتح التطبيق.",
                        "Tap “Add” to open the app.",
                      )}
                    </span>
                  </li>
                </ol>
                <button
                  type="button"
                  onClick={closeInstallPrompt}
                  className="mt-5 w-full rounded-full bg-[#CD4354] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b93c4b]"
                >
                  {translate("pwa_got_it", "حسنًا", "Got it")}
                </button>
              </div>
            ) : (
              <div className="mt-5">
                <p className="text-sm leading-relaxed text-gray-600">
                  {translate(
                    "pwa_install_desc",
                    "تسوق أسرع من الشاشة الرئيسية، مع تجربة ملء الشاشة وإمكانية تصفح الصفحات المحفوظة دون اتصال.",
                    "Shop faster from your Home Screen with a full-screen experience and offline access to saved pages.",
                  )}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#CD4354]" />
                    {translate("pwa_install_benefit_1", "وصول أسرع من الشاشة الرئيسية", "Faster access from your Home Screen")}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#CD4354]" />
                    {translate("pwa_install_benefit_2", "عرض ملء الشاشة بدون شريط المتصفح", "A full-screen experience without browser chrome")}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#CD4354]" />
                    {translate("pwa_install_benefit_3", "تصفح أسرع للصفحات التي زرتها", "Faster access to pages you have visited")}
                  </li>
                </ul>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={dismissInstall}
                    className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    {translate("pwa_not_now", "لاحقًا", "Not now")}
                  </button>
                  <button
                    type="button"
                    onClick={promptInstall}
                    disabled={isInstallBusy}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#CD4354] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b93c4b] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isInstallBusy ? (
                      <LuLoader aria-hidden="true" className="h-4 w-4 animate-spin" />
                    ) : (
                      <MdInstallMobile aria-hidden="true" className="h-4 w-4" />
                    )}
                    {translate("pwa_install_now", "تثبيت الآن", "Install now")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
