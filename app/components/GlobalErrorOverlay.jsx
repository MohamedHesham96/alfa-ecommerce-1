"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { FaServer } from "react-icons/fa";
import { IoRefresh } from "react-icons/io5";
import { useLanguage } from "../../context/LanguageContext";
import { getRequest } from "../../utils/requestsUtils";
import {
  clearServerFailure,
  getConnectivityState,
  subscribeConnectivity,
} from "../../utils/connectivityStore";

const SERVER_CHECK_ENDPOINT = "/api/public/sliderImages?__alfa_health=1";
const SERVER_CHECK_TIMEOUT = 8000;
const SERVER_RECHECK_INTERVAL = 6000;

const getServerCheckEndpoint = () =>
  `${SERVER_CHECK_ENDPOINT}&_ts=${Date.now()}`;

const withTimeout = (promise, ms) => {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

// Uses the existing API request utility as a health check.
// Any response < 500 means the server is reachable and processing requests.
const checkServer = async () => {
  try {
    await withTimeout(getRequest(getServerCheckEndpoint()), SERVER_CHECK_TIMEOUT);
    return true;
  } catch (error) {
    const status = error?.response?.status;
    return typeof status === "number" && status < 500;
  }
};

/**
 * Full-screen recovery UI for a reachable browser with an unreachable API.
 * Browser-offline handling is intentionally owned by OfflineBanner: the app
 * must remain usable with cached pages while the network is unavailable.
 */
export default function GlobalErrorOverlay() {
  const { t, locale } = useLanguage();
  const [retrying, setRetrying] = useState(false);
  const { browserOnline, serverDown } = useSyncExternalStore(
    subscribeConnectivity,
    getConnectivityState,
    getConnectivityState,
  );

  const mode = browserOnline && serverDown ? "server" : null;

  const translate = (key, fallbackAr, fallbackEn) => {
    const translated = t(key);
    if (translated && translated !== key) return translated;
    return locale === "en" ? fallbackEn : fallbackAr;
  };

  // Automatically hide the server error page once the server is reachable again
  useEffect(() => {
    if (mode !== "server") return undefined;
    let cancelled = false;
    const recheck = async () => {
      const serverUp = await checkServer();
      if (serverUp && !cancelled) clearServerFailure();
    };
    const intervalId = setInterval(recheck, SERVER_RECHECK_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [mode]);

  // Keep the page underneath from scrolling while the error page is visible
  useEffect(() => {
    if (!mode) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mode]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const serverUp = await checkServer();
      if (serverUp) {
        clearServerFailure();
        window.location.reload();
      }
    } finally {
      setRetrying(false);
    }
  };

  if (!mode) return null;

  const title = translate(
    "server_unavailable_title",
    "الخادم غير متاح حاليًا",
    "Server is temporarily unavailable",
  );
  const description = translate(
    "server_unavailable_desc",
    "نواجه مشكلة مؤقتة في الاتصال بالخادم، يرجى المحاولة مرة أخرى",
    "We are facing a temporary issue. Please try again.",
  );
  const retryLabel = translate("retry", "إعادة المحاولة", "Try Again");

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center gap-6 bg-[#f6f5f8] px-6 py-10 text-center animate-fade-in-up"
    >
      <div className="flex h-36 w-36 xs:h-40 xs:w-40 md:h-52 md:w-52 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_12px_40px_rgba(205,67,84,0.15)]">
        <FaServer
          aria-hidden="true"
          className="text-[#CD4354] text-6xl md:text-7xl"
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        <h1 className="xs:text-2xl md:text-4xl font-bold text-gray-800">
          {title}
        </h1>
        <p className="max-w-md text-sm md:text-base leading-relaxed text-gray-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={handleRetry}
        disabled={retrying}
        className="flex items-center gap-2 rounded-full bg-[#CD4354] px-8 py-3 text-sm md:text-base font-semibold text-white transition-colors hover:bg-[#c13b4a] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <IoRefresh
          aria-hidden="true"
          className={retrying ? "animate-spin" : ""}
        />
        {retryLabel}
      </button>
    </div>
  );
}
