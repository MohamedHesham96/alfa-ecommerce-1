"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { fetchSystemSettingsAccess } from "../services/systemConfigurationService";

const DENIED_ACCESS = {
  internalAdmin: false,
  clientAdmin: false,
  globalClientAccessEnabled: false,
  globalClientEditingEnabled: false,
  canAccessSettings: false,
  canEditSettings: false,
  visibleSettingCount: 0,
};

const SystemSettingsAccessContext = createContext(null);

/**
 * Loads the backend capability document once for the admin shell. The menu and
 * the route gate consume the same state, so the tab is never rendered while
 * permissions are still unknown and stale localStorage values are not trusted.
 */
export function SystemSettingsAccessProvider({ children }) {
  const [state, setState] = useState({ status: "loading", access: null });

  const refresh = useCallback(async () => {
    if (typeof window === "undefined") return;

    if (localStorage.getItem("role") !== "ADMIN") {
      setState({ status: "ready", access: DENIED_ACCESS });
      return;
    }

    setState((previous) => ({ ...previous, status: "loading" }));
    try {
      const access = await fetchSystemSettingsAccess();
      setState({ status: "ready", access: access || DENIED_ACCESS });
    } catch {
      // Fail closed: hide the tab and the route until the backend confirms.
      setState({ status: "ready", access: DENIED_ACCESS });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      ...state,
      access: state.access || DENIED_ACCESS,
      canAccess: state.status === "ready" && state.access?.canAccessSettings === true,
      canEdit: state.status === "ready" && state.access?.canEditSettings === true,
      refresh,
    }),
    [state, refresh],
  );

  return (
    <SystemSettingsAccessContext.Provider value={value}>
      {children}
    </SystemSettingsAccessContext.Provider>
  );
}

export function useSystemSettingsAccess() {
  const context = useContext(SystemSettingsAccessContext);
  if (!context) {
    return {
      status: "loading",
      access: DENIED_ACCESS,
      canAccess: false,
      canEdit: false,
      refresh: async () => {},
    };
  }
  return context;
}
