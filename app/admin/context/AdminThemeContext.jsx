"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getRequest, putRequest } from "../../../utils/requestsUtils";
import {
  ADMIN_THEME_ATTRIBUTE,
  ADMIN_THEME_DARK,
  ADMIN_THEME_LIGHT,
  ADMIN_THEME_STORAGE_PREFIX,
} from "./adminThemeConstants";

export {
  ADMIN_THEME_ATTRIBUTE,
  ADMIN_THEME_DARK,
  ADMIN_THEME_LIGHT,
  ADMIN_THEME_STORAGE_PREFIX,
} from "./adminThemeConstants";

const AdminThemeContext = createContext({
  theme: ADMIN_THEME_LIGHT,
  isReady: false,
  setTheme: () => {},
});

export function normalizeAdminTheme(value) {
  if (value === ADMIN_THEME_DARK) return ADMIN_THEME_DARK;
  if (value === ADMIN_THEME_LIGHT) return ADMIN_THEME_LIGHT;
  return null;
}

/**
 * The cache key includes the authenticated administrator id, so signing in as
 * another administrator on the same browser can never inherit the first
 * administrator's theme. The database remains the source of truth: the cache
 * only prevents a first-paint flash while the saved value is loaded.
 */
export function getAdminThemeStorageKey() {
  if (typeof window === "undefined") return null;
  try {
    const userId = localStorage.getItem("id");
    return `${ADMIN_THEME_STORAGE_PREFIX}:${userId || "guest"}`;
  } catch {
    return null;
  }
}

function readCachedTheme() {
  if (typeof window === "undefined") return ADMIN_THEME_LIGHT;
  try {
    const key = getAdminThemeStorageKey();
    return normalizeAdminTheme(key ? localStorage.getItem(key) : null) ?? ADMIN_THEME_LIGHT;
  } catch {
    return ADMIN_THEME_LIGHT;
  }
}

function writeCachedTheme(theme) {
  if (typeof window === "undefined") return;
  try {
    const key = getAdminThemeStorageKey();
    if (key) localStorage.setItem(key, theme);
  } catch {
    // A disabled/full storage must never break the dashboard.
  }
}

function applyThemeToDocument(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === ADMIN_THEME_DARK) {
    root.setAttribute(ADMIN_THEME_ATTRIBUTE, "dark");
  } else {
    root.removeAttribute(ADMIN_THEME_ATTRIBUTE);
  }
  // Native controls (date pickers, selects, scrollbars) follow the admin theme
  // through color-scheme. It is removed again when the admin area unmounts, so
  // customer pages keep their existing appearance.
  root.style.colorScheme = theme === ADMIN_THEME_DARK ? "dark" : "light";
}

function clearThemeFromDocument() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.removeAttribute(ADMIN_THEME_ATTRIBUTE);
  root.style.removeProperty("color-scheme");
}

export function AdminThemeProvider({ children }) {
  const [theme, setThemeState] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const themeRef = useRef(ADMIN_THEME_LIGHT);
  // Once the administrator has chosen a theme, a late GET response must not
  // overwrite that choice. Sequential saves keep rapid clicks in order.
  const userSelectedRef = useRef(false);
  const saveChainRef = useRef(Promise.resolve());

  useLayoutEffect(() => {
    // Apply the cached theme before the browser paints. The server-rendered
    // bootstrap script covers full page loads; this covers client-side
    // navigation into the admin area, where scripts inserted by React do not
    // execute.
    const cachedTheme = readCachedTheme();
    themeRef.current = cachedTheme;
    setThemeState(cachedTheme);
    applyThemeToDocument(cachedTheme);
  }, []);

  useEffect(() => {
    let cancelled = false;

    getRequest("/api/admin/theme")
      .then((response) => {
        if (cancelled || userSelectedRef.current) return;
        const savedTheme = normalizeAdminTheme(response?.data?.themePreference);
        if (!savedTheme) return;
        themeRef.current = savedTheme;
        setThemeState(savedTheme);
        applyThemeToDocument(savedTheme);
        writeCachedTheme(savedTheme);
      })
      .catch(() => {
        // The cached/default theme stays active. The dashboard must remain
        // fully usable if the preference endpoint is temporarily unavailable.
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });

    return () => {
      cancelled = true;
      clearThemeFromDocument();
    };
  }, []);

  const setTheme = useCallback((nextTheme) => {
    const normalized = normalizeAdminTheme(nextTheme);
    if (!normalized || normalized === themeRef.current) return;

    userSelectedRef.current = true;
    themeRef.current = normalized;
    setThemeState(normalized);
    applyThemeToDocument(normalized);
    writeCachedTheme(normalized);

    // Optimistic UI + persisted database value. Chaining keeps the final
    // database write aligned with the last click if the user toggles quickly.
    saveChainRef.current = saveChainRef.current
      .catch(() => {})
      .then(() =>
        putRequest("/api/admin/theme", { themePreference: normalized }, ""),
      )
      .catch(() => {
        // The shared request layer reports the failure. The selected theme is
        // kept for this session; the next successful load restores the value
        // that the database actually holds.
      });
  }, []);

  const value = useMemo(
    () => ({ theme: theme ?? ADMIN_THEME_LIGHT, isReady, setTheme }),
    [theme, isReady, setTheme],
  );

  return (
    <AdminThemeContext.Provider value={value}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}
