"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import { toast } from "react-toastify";
import { useLanguage } from "../../../context/LanguageContext";
import {
  getConnectivityState,
  setBrowserOnline,
  subscribeConnectivity,
} from "../../../utils/connectivityStore";
import {
  INSTALL_AUTO_PROMPT_DELAY_MS,
  INSTALL_DISMISS_MS,
  INSTALL_DISMISSED_STORAGE_KEY,
  isInstallPromptAllowedPath,
  isPwaEnabled,
} from "../../../lib/pwa/constants";
import {
  INSTALL_MODES,
  getInstallMode,
  isIosSafari,
  isStandaloneMode,
  readDismissedAt,
  shouldOfferInstall,
  writeDismissedAt,
} from "../../../lib/pwa/install";
import {
  applyServiceWorkerUpdate,
  registerServiceWorker,
  subscribeControllerChange,
  unregisterAlfaServiceWorkers,
} from "../../../lib/pwa/registration";
import {
  getCriticalOperationSnapshot,
  subscribeCriticalOperations,
} from "../../../lib/pwa/criticalOperation";
import {
  CROSS_TAB_EVENT,
  getCrossTabCoordinator,
} from "../../../lib/pwa/crossTab";
import { UPDATE_APPLY_RESULT } from "../../../lib/pwa/update";
import OfflineBanner from "./OfflineBanner";
import UpdatePrompt from "./UpdatePrompt";
import InstallPrompt from "./InstallPrompt";

const EMPTY_PWA = {
  isOnline: true,
  isStandalone: false,
  installed: false,
  canInstall: false,
  installMode: INSTALL_MODES.UNAVAILABLE,
  installBannerVisible: false,
  installDialogOpen: false,
  isInstallBusy: false,
  updateAvailable: false,
  isApplyingUpdate: false,
  updateBlocked: false,
  reloadRequired: false,
  criticalOperation: false,
  crossTabCheckout: false,
  openInstallPrompt: () => {},
  closeInstallPrompt: () => {},
  promptInstall: async () => {},
  dismissInstall: () => {},
  applyUpdate: () => UPDATE_APPLY_RESULT.UNAVAILABLE,
  dismissUpdate: () => {},
  reloadForUpdate: () => {},
};

const PwaContext = createContext(EMPTY_PWA);

function getStoredPrompt() {
  if (typeof window === "undefined") return null;
  return window.__alfaDeferredInstallPrompt || null;
}

export function PwaProvider({ children }) {
  const pathname = usePathname() || "/";
  const { locale } = useLanguage();
  const localeRef = useRef(locale);

  const connectivity = useSyncExternalStore(
    subscribeConnectivity,
    getConnectivityState,
    getConnectivityState,
  );
  const criticalOperation = useSyncExternalStore(
    subscribeCriticalOperations,
    getCriticalOperationSnapshot,
    getCriticalOperationSnapshot,
  );

  const [registration, setRegistration] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDismissed, setUpdateDismissed] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const [updateBlocked, setUpdateBlocked] = useState(false);
  const [reloadRequired, setReloadRequired] = useState(false);
  const [crossTabCheckout, setCrossTabCheckout] = useState(false);
  const updateGateRef = useRef(null);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIosSafariBrowser, setIsIosSafariBrowser] = useState(false);
  const [dismissedAt, setDismissedAt] = useState(null);
  const [installBannerVisible, setInstallBannerVisible] = useState(false);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [isInstallBusy, setIsInstallBusy] = useState(false);

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  // Kill switch: when the PWA is disabled, remove any existing Alfa service
  // worker registration. Cache Storage is intentionally left untouched.
  useEffect(() => {
    if (
      isPwaEnabled ||
      typeof navigator === "undefined" ||
      !navigator.serviceWorker
    ) {
      return undefined;
    }

    unregisterAlfaServiceWorkers().catch(() => {});
    if (typeof window !== "undefined") {
      window.__alfaDeferredInstallPrompt = null;
    }
    return undefined;
  }, []);

  // Keep connectivity state in one place. GlobalErrorOverlay consumes the
  // same store for server-down handling.
  useEffect(() => {
    const syncOnlineStatus = () => setBrowserOnline(navigator.onLine);
    syncOnlineStatus();
    window.addEventListener("online", syncOnlineStatus);
    window.addEventListener("offline", syncOnlineStatus);
    const intervalId = window.setInterval(syncOnlineStatus, 10000);
    return () => {
      window.removeEventListener("online", syncOnlineStatus);
      window.removeEventListener("offline", syncOnlineStatus);
      window.clearInterval(intervalId);
    };
  }, []);

  // Cross-tab checkout/update coordination.
  useEffect(() => {
    if (!isPwaEnabled) return undefined;

    const coordinator = getCrossTabCoordinator();
    if (!coordinator) return undefined;

    let cancelled = false;
    let retryTimer = null;
    let nextWorkerCheckAt = 0;

    const refreshCheckoutState = async () => {
      const active = await coordinator.isCheckoutActive();
      if (cancelled) return;
      setCrossTabCheckout(active);
      if (!active) setUpdateBlocked(false);
    };

    const checkForWaitingWorker = async () => {
      if (cancelled || typeof navigator === "undefined" || !navigator.serviceWorker) {
        return;
      }
      const now = Date.now();
      if (now < nextWorkerCheckAt) return;
      nextWorkerCheckAt = now + 2000;

      try {
        const latest = await navigator.serviceWorker.getRegistration();
        if (cancelled || !latest) return;
        if (latest.waiting) {
          setRegistration(latest);
          setUpdateAvailable(true);
          setUpdateDismissed(false);
          return;
        }

        // The notification can arrive while the other tab is still finishing
        // the installation. Ask the browser to check the same script, then
        // re-check for a waiting worker once.
        latest.update().catch(() => {});
        if (retryTimer) window.clearTimeout(retryTimer);
        retryTimer = window.setTimeout(async () => {
          if (cancelled) return;
          const retried = await navigator.serviceWorker
            .getRegistration()
            .catch(() => null);
          if (cancelled || !retried?.waiting) return;
          setRegistration(retried);
          setUpdateAvailable(true);
          setUpdateDismissed(false);
        }, 800);
      } catch {
        // A failed check is retried by the next interval/event.
      }
    };

    const unsubscribe = coordinator.subscribe((event) => {
      if (event.type === CROSS_TAB_EVENT.CHECKOUT_CHANGE) {
        refreshCheckoutState();
        return;
      }
      if (event.type === CROSS_TAB_EVENT.UPDATE_AVAILABLE) {
        setUpdateDismissed(false);
        checkForWaitingWorker();
        return;
      }
      if (event.type === CROSS_TAB_EVENT.UPDATE_APPLIED) {
        setUpdateAvailable(false);
        setUpdateDismissed(false);
        setIsApplyingUpdate(false);
        setReloadRequired(true);
      }
    });

    refreshCheckoutState();
    const intervalId = window.setInterval(refreshCheckoutState, 5000);

    return () => {
      cancelled = true;
      unsubscribe();
      window.clearInterval(intervalId);
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, []);

  // A controller change caused by another tab (or by the browser) means this
  // tab is now running old page JS with the new service worker. Ask the user
  // to refresh rather than silently reloading their work.
  useEffect(() => {
    if (!isPwaEnabled) return undefined;
    if (typeof navigator === "undefined" || !navigator.serviceWorker) {
      return undefined;
    }
    const container = navigator.serviceWorker;
    const wasControlledRef = { current: Boolean(container.controller) };

    const unsubscribe = subscribeControllerChange(() => {
      if (updateGateRef.current) {
        // This tab initiated the update. The registration helper notifies all
        // subscribers before it performs the accepted update reload.
        wasControlledRef.current = true;
        getCrossTabCoordinator()?.notifyUpdateApplied();
        return;
      }
      if (!wasControlledRef.current) {
        // First installation: claiming the page is not an app update.
        wasControlledRef.current = true;
        return;
      }
      setUpdateAvailable(false);
      setUpdateDismissed(false);
      setIsApplyingUpdate(false);
      setReloadRequired(true);
    });

    return unsubscribe;
  }, []);

  // Install lifecycle: beforeinstallprompt, iOS Safari instructions, and
  // display-mode changes.
  useEffect(() => {
    if (!isPwaEnabled) return undefined;
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return undefined;
    }

    const nav = navigator;
    setIsStandalone(
      isStandaloneMode({
        matchMedia: window.matchMedia ? window.matchMedia.bind(window) : null,
        navigator: nav,
      }),
    );
    setIsIosSafariBrowser(
      isIosSafari(nav.userAgent, nav.platform, nav.maxTouchPoints),
    );
    setDismissedAt(
      readDismissedAt(localStorage, INSTALL_DISMISSED_STORAGE_KEY),
    );

    const cachedPrompt = getStoredPrompt();
    if (cachedPrompt) setDeferredPrompt(cachedPrompt);

    const onBeforeInstallPrompt = (event) => {
      if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
      }
      window.__alfaDeferredInstallPrompt = event;
      setDeferredPrompt(event);
    };

    const onCachedPrompt = () => {
      const prompt = getStoredPrompt();
      if (prompt) setDeferredPrompt(prompt);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      window.__alfaDeferredInstallPrompt = null;
      setInstallBannerVisible(false);
      setInstallDialogOpen(false);
      try {
        localStorage.removeItem(INSTALL_DISMISSED_STORAGE_KEY);
      } catch {
        // Storage can be unavailable in private modes.
      }
      toast.success(
        localeRef.current === "ar"
          ? "تم تثبيت تطبيق ألفا بنجاح"
          : "The Alfa app was installed",
      );
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("alfa:beforeinstallprompt", onCachedPrompt);
    window.addEventListener("appinstalled", onInstalled);

    let mediaQuery = null;
    let onMediaChange = null;
    if (window.matchMedia) {
      mediaQuery = window.matchMedia("(display-mode: standalone)");
      onMediaChange = (event) => setIsStandalone(Boolean(event.matches));
      if (typeof mediaQuery.addEventListener === "function") {
        mediaQuery.addEventListener("change", onMediaChange);
      } else if (typeof mediaQuery.addListener === "function") {
        mediaQuery.addListener(onMediaChange);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("alfa:beforeinstallprompt", onCachedPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (mediaQuery && onMediaChange) {
        if (typeof mediaQuery.removeEventListener === "function") {
          mediaQuery.removeEventListener("change", onMediaChange);
        } else if (typeof mediaQuery.removeListener === "function") {
          mediaQuery.removeListener(onMediaChange);
        }
      }
    };
  }, []);

  // Service worker registration and update detection.
  useEffect(() => {
    if (!isPwaEnabled) return undefined;

    let cancelled = false;
    let cleanup = null;

    registerServiceWorker({
      onUpdateReady: (nextRegistration) => {
        if (cancelled) return;
        setRegistration(nextRegistration);
        setUpdateAvailable(true);
        setUpdateDismissed(false);
        setReloadRequired(false);
        getCrossTabCoordinator()?.notifyUpdateAvailable();
      },
      onOfflineReady: () => {
        if (cancelled) return;
        toast.info(
          localeRef.current === "ar"
            ? "التطبيق جاهز للعمل دون اتصال"
            : "The app is ready to work offline",
          { autoClose: 4000 },
        );
      },
      onError: (error) => {
        console.warn("[Alfa PWA] Service worker registration failed", error);
      },
    }).then((result) => {
      if (cancelled) {
        if (result && typeof result.cleanup === "function") result.cleanup();
        return;
      }
      if (result && result.registration) {
        setRegistration(result.registration);
      }
      cleanup = result && typeof result.cleanup === "function" ? result.cleanup : null;
    });

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, []);

  useEffect(() => {
    if (!criticalOperation && !crossTabCheckout) setUpdateBlocked(false);
  }, [criticalOperation, crossTabCheckout]);

  useEffect(() => {
    if (!isApplyingUpdate) return undefined;
    const timer = window.setTimeout(() => {
      const gate = updateGateRef.current;
      updateGateRef.current = null;
      if (gate) gate.release();
      setIsApplyingUpdate(false);
      setUpdateBlocked(false);
    }, 15_000);
    return () => window.clearTimeout(timer);
  }, [isApplyingUpdate]);

  const installMode = isPwaEnabled
    ? getInstallMode({
        deferredPrompt,
        isIosSafariBrowser,
        isStandalone,
        installed,
      })
    : INSTALL_MODES.UNAVAILABLE;
  const canInstall =
    isPwaEnabled &&
    (installMode === INSTALL_MODES.NATIVE ||
      installMode === INSTALL_MODES.IOS_INSTRUCTIONS);
  const pathAllowed = isPwaEnabled && isInstallPromptAllowedPath(pathname);
  const updateAvailableVisible =
    isPwaEnabled && updateAvailable && !updateDismissed;

  useEffect(() => {
    if (!pathAllowed) {
      setInstallBannerVisible(false);
      setInstallDialogOpen(false);
      return undefined;
    }
    if (!canInstall || installDialogOpen || updateAvailableVisible || reloadRequired) {
      setInstallBannerVisible(false);
      return undefined;
    }
    if (
      !shouldOfferInstall({
        isStandalone,
        installed,
        deferredPrompt,
        isIosSafariBrowser,
        dismissedAt,
        now: Date.now(),
        dismissDurationMs: INSTALL_DISMISS_MS,
        pathAllowed,
      })
    ) {
      setInstallBannerVisible(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setInstallBannerVisible(true);
    }, INSTALL_AUTO_PROMPT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [
    canInstall,
    deferredPrompt,
    dismissedAt,
    installDialogOpen,
    installed,
    isIosSafariBrowser,
    isStandalone,
    pathAllowed,
    reloadRequired,
    updateAvailableVisible,
  ]);

  const dismissInstall = useCallback(() => {
    const now = Date.now();
    setDismissedAt(now);
    writeDismissedAt(localStorage, INSTALL_DISMISSED_STORAGE_KEY, now);
    setInstallBannerVisible(false);
    setInstallDialogOpen(false);
  }, []);

  const openInstallPrompt = useCallback(() => {
    if (!canInstall) return;
    setInstallBannerVisible(false);
    setInstallDialogOpen(true);
  }, [canInstall]);

  const closeInstallPrompt = useCallback(() => {
    setInstallDialogOpen(false);
  }, []);

  const promptInstall = useCallback(async () => {
    if (installed || isStandalone) return;

    if (!deferredPrompt) {
      if (isIosSafariBrowser) setInstallDialogOpen(true);
      return;
    }

    setIsInstallBusy(true);
    try {
      const promptEvent = deferredPrompt;
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      setDeferredPrompt(null);
      if (typeof window !== "undefined") {
        window.__alfaDeferredInstallPrompt = null;
      }
      if (choice && choice.outcome === "accepted") {
        setInstalled(true);
        setInstallDialogOpen(false);
        setInstallBannerVisible(false);
      } else {
        dismissInstall();
      }
    } catch {
      dismissInstall();
    } finally {
      setIsInstallBusy(false);
    }
  }, [
    deferredPrompt,
    dismissInstall,
    installed,
    isIosSafariBrowser,
    isStandalone,
  ]);

  const applyUpdate = useCallback(async () => {
    if (!isPwaEnabled) return UPDATE_APPLY_RESULT.UNAVAILABLE;
    if (criticalOperation || crossTabCheckout) {
      setUpdateBlocked(true);
      return UPDATE_APPLY_RESULT.BLOCKED;
    }
    if (!connectivity.browserOnline) {
      setUpdateBlocked(false);
      return UPDATE_APPLY_RESULT.OFFLINE;
    }

    const coordinator = getCrossTabCoordinator();
    let gate = null;
    setReloadRequired(false);
    setIsApplyingUpdate(true);

    try {
      if (coordinator) {
        gate = await coordinator.acquireUpdateGate();
        if (!gate || !gate.acquired) {
          setIsApplyingUpdate(false);
          setUpdateBlocked(true);
          return UPDATE_APPLY_RESULT.BLOCKED;
        }
      }

      let activeRegistration = registration;
      if (
        (!activeRegistration || !activeRegistration.waiting) &&
        typeof navigator !== "undefined" &&
        navigator.serviceWorker
      ) {
        const latest = await navigator.serviceWorker
          .getRegistration()
          .catch(() => null);
        if (latest && latest.waiting) {
          activeRegistration = latest;
          setRegistration(latest);
        }
      }

      const result = applyServiceWorkerUpdate(activeRegistration, {
        online: connectivity.browserOnline,
      });

      if (result === UPDATE_APPLY_RESULT.APPLYING) {
        updateGateRef.current = gate;
        gate = null;
        setUpdateBlocked(false);
        return result;
      }

      if (gate) gate.release();
      gate = null;
      setIsApplyingUpdate(false);
      if (result === UPDATE_APPLY_RESULT.BLOCKED) {
        setUpdateBlocked(true);
        return result;
      }
      setUpdateBlocked(false);
      if (result === UPDATE_APPLY_RESULT.UNAVAILABLE) {
        setUpdateAvailable(false);
      }
      return result;
    } catch {
      if (gate) gate.release();
      gate = null;
      setIsApplyingUpdate(false);
      setUpdateBlocked(false);
      return UPDATE_APPLY_RESULT.UNAVAILABLE;
    }
  }, [
    connectivity.browserOnline,
    criticalOperation,
    crossTabCheckout,
    registration,
  ]);

  const dismissUpdate = useCallback(() => {
    setUpdateDismissed(true);
  }, []);

  const reloadForUpdate = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }, []);

  const value = useMemo(
    () => ({
      isOnline: connectivity.browserOnline,
      serverDown: connectivity.serverDown,
      isStandalone,
      installed,
      canInstall,
      installMode,
      installBannerVisible: installBannerVisible && canInstall && pathAllowed,
      installDialogOpen,
      isInstallBusy,
      updateAvailable: updateAvailableVisible,
      isApplyingUpdate,
      updateBlocked,
      reloadRequired,
      criticalOperation,
      crossTabCheckout,
      openInstallPrompt,
      closeInstallPrompt,
      promptInstall,
      dismissInstall,
      applyUpdate,
      dismissUpdate,
      reloadForUpdate,
    }),
    [
      applyUpdate,
      canInstall,
      closeInstallPrompt,
      connectivity.browserOnline,
      connectivity.serverDown,
      criticalOperation,
      crossTabCheckout,
      dismissInstall,
      dismissUpdate,
      installBannerVisible,
      installDialogOpen,
      installMode,
      installed,
      isApplyingUpdate,
      isInstallBusy,
      isStandalone,
      openInstallPrompt,
      pathAllowed,
      promptInstall,
      reloadForUpdate,
      reloadRequired,
      updateAvailableVisible,
      updateBlocked,
    ],
  );

  return (
    <PwaContext.Provider value={value}>
      {children}
      {isPwaEnabled ? (
        <>
          <OfflineBanner />
          <UpdatePrompt />
          <InstallPrompt />
        </>
      ) : null}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  return useContext(PwaContext);
}
