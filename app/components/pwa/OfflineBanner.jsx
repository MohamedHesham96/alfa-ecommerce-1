"use client";

import { useEffect, useRef, useState } from "react";
import { MdWifi, MdWifiOff } from "react-icons/md";
import { useLanguage } from "../../../context/LanguageContext";
import { OFFLINE_RESTORED_MESSAGE_MS } from "../../../lib/pwa/constants";
import { usePwa } from "./PwaProvider";

export default function OfflineBanner() {
  const { isOnline } = usePwa();
  const { t, locale } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [restored, setRestored] = useState(false);
  const previousOnline = useRef(isOnline);

  const translate = (key, fallbackAr, fallbackEn) => {
    const translated = t(key);
    if (translated && translated !== key) return translated;
    return locale === "en" ? fallbackEn : fallbackAr;
  };

  useEffect(() => {
    if (!isOnline) {
      previousOnline.current = false;
      setRestored(false);
      setVisible(true);
      return undefined;
    }

    if (previousOnline.current === false) {
      previousOnline.current = true;
      setRestored(true);
      setVisible(true);
      const timer = window.setTimeout(() => {
        setVisible(false);
        setRestored(false);
      }, OFFLINE_RESTORED_MESSAGE_MS);
      return () => window.clearTimeout(timer);
    }

    previousOnline.current = true;
    return undefined;
  }, [isOnline]);

  if (!visible) return null;

  const Icon = restored ? MdWifi : MdWifiOff;
  const title = restored
    ? translate("pwa_back_online", "تم استعادة الاتصال بالإنترنت", "Back online")
    : translate(
        "pwa_offline_title",
        "أنت غير متصل بالإنترنت",
        "You are offline",
      );

  return (
    <div
      data-testid="offline-banner"
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 top-0 z-[90] ${
        restored ? "bg-[#166534]" : "bg-[#7c2d12]"
      } text-white shadow-lg`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{title}</p>
            {!restored ? (
              <p className="hidden text-xs text-white/85 xs:block">
                {translate(
                  "pwa_offline_message",
                  "يمكنك تصفح الصفحات المحفوظة. الشراء والدفع يتطلبان اتصالًا.",
                  "Saved pages remain available. Checkout needs a connection.",
                )}
              </p>
            ) : null}
          </div>
        </div>

        {restored ? (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/25"
          >
            {translate("pwa_refresh", "تحديث", "Refresh")}
          </button>
        ) : (
          <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/90">
            {translate("pwa_offline_badge", "وضع عدم الاتصال", "Offline mode")}
          </span>
        )}
      </div>
    </div>
  );
}
