"use client";

import {
  DEFAULT_APP_CONFIG,
  getDefaultAppConfig,
} from "./appConfigDefaults";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8787"
).replace(/\/+$/, "");

/**
 * Installation-level frontend configuration store.
 *
 * A single module-level store is shared by every component. Components that
 * read one key subscribe through `useSyncExternalStore`, so a refresh only
 * rerenders the components whose key actually changed.
 */
let state = {
  values: { ...DEFAULT_APP_CONFIG },
  version: 0,
  status: "idle",
  error: null,
};

const listeners = new Set();
let refreshInFlight = null;

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAppConfigState() {
  return state;
}

export function getAppConfigValue(key, fallback) {
  const value = state.values[key];
  if (value !== undefined) {
    return value;
  }
  return getDefaultAppConfig(key, fallback);
}

/** Applies server-rendered values before the first client render. */
export function initializeAppConfig(values = {}, version = 0) {
  state = {
    values: { ...DEFAULT_APP_CONFIG, ...values },
    version,
    status: "ready",
    error: null,
  };
  emit();
}

/**
 * Refetches public configuration from the backend. Concurrent callers share
 * one request so a page with several config consumers still makes one call.
 */
export function refreshAppConfig() {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  state = { ...state, status: "refreshing", error: null };
  emit();

  refreshInFlight = fetch(`${API_BASE_URL}/api/public/config`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Configuration request failed (${response.status})`);
      }
      const json = await response.json();
      const data = json?.data ?? json;
      state = {
        values: { ...DEFAULT_APP_CONFIG, ...(data?.values || {}) },
        version: Number(data?.version) || 0,
        status: "ready",
        error: null,
      };
      emit();
      return state;
    })
    .catch((error) => {
      state = {
        ...state,
        status: "error",
        error: error?.message || "Configuration could not be loaded",
      };
      emit();
      throw error;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

/** Test-only helper: restores the store to safe defaults. */
export function resetAppConfigForTests(values = {}) {
  initializeAppConfig(values, 0);
  refreshInFlight = null;
}
