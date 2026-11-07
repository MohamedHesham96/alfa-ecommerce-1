"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";

import {
  getAppConfigState,
  getAppConfigValue,
  initializeAppConfig,
  refreshAppConfig,
  subscribe,
} from "../lib/appConfigStore";
import { getDefaultAppConfig } from "../lib/appConfigDefaults";

const AppConfigContext = createContext({
  refresh: refreshAppConfig,
});

/**
 * Per-request initial values. Using context for the server snapshot prevents
 * concurrent server renders from observing another request's module state.
 */
const AppConfigInitialValuesContext = createContext(null);

/**
 * Initializes the shared configuration store from server-rendered values.
 *
 * The store is initialized during render (not in an effect) so the first
 * client paint uses exactly the same values as the server HTML. Without this,
 * configuration-dependent navigation could flash or hydrate differently.
 */
export function AppConfigProvider({
  initialConfig = {},
  initialVersion = 0,
  children,
}) {
  const initialized = useRef(false);
  if (!initialized.current) {
    initializeAppConfig(initialConfig, initialVersion);
    initialized.current = true;
  }

  useEffect(() => {
    if (!initialConfig || Object.keys(initialConfig).length === 0) {
      refreshAppConfig().catch(() => {
        // Safe defaults remain active. The next navigation can retry.
      });
    }
  }, [initialConfig]);

  useEffect(() => {
    // Keep long-lived tabs reasonably fresh without polling on every render.
    // The backend snapshot TTL is 30 seconds; one minute is the documented
    // frontend consistency window for an already-open tab.
    const refresh = () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }
      refreshAppConfig().catch(() => {});
    };
    const interval = setInterval(refresh, 60_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const value = useMemo(() => ({ refresh: refreshAppConfig }), []);
  return (
    <AppConfigInitialValuesContext.Provider value={initialConfig}>
      <AppConfigContext.Provider value={value}>
        {children}
      </AppConfigContext.Provider>
    </AppConfigInitialValuesContext.Provider>
  );
}

/**
 * Reads one configuration value. The selector returns the value itself, so
 * React only rerenders this component when that key changes.
 */
export function useAppConfig(key, fallback) {
  const initialValues = useContext(AppConfigInitialValuesContext);
  const subscribeToStore = useCallback((listener) => subscribe(listener), []);
  const getSnapshot = useCallback(
    () => getAppConfigValue(key, fallback),
    [key, fallback],
  );
  const getServerSnapshot = useCallback(() => {
    if (
      initialValues &&
      Object.prototype.hasOwnProperty.call(initialValues, key)
    ) {
      return initialValues[key];
    }
    return getDefaultAppConfig(key, fallback);
  }, [initialValues, key, fallback]);
  return useSyncExternalStore(
    subscribeToStore,
    getSnapshot,
    getServerSnapshot,
  );
}

/** Boolean feature-flag helper. Missing or invalid flags are disabled. */
export function useFeature(featureKey) {
  return Boolean(useAppConfig(featureKey, false));
}

/** Whole-store access for administrative refresh flows. */
export function useAppConfigStore() {
  const state = useSyncExternalStore(
    subscribe,
    getAppConfigState,
    getAppConfigState,
  );
  return useMemo(
    () => ({
      ...state,
      refresh: refreshAppConfig,
    }),
    [state],
  );
}

export function useAppConfigContext() {
  return useContext(AppConfigContext);
}
