"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { getRequest } from "../../../../utils/requestsUtils";

const DashboardSummaryContext = createContext(undefined);

export function DashboardSummaryProvider({ children }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getRequest("/api/admin/dashboard");
      setSummary(response?.data ?? null);
      setError(null);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <DashboardSummaryContext.Provider
      value={{ summary, loading, error, reload }}
    >
      {children}
    </DashboardSummaryContext.Provider>
  );
}

export function useDashboardSummary() {
  const context = useContext(DashboardSummaryContext);
  if (!context) {
    throw new Error(
      "useDashboardSummary must be used within DashboardSummaryProvider",
    );
  }
  return context;
}
