"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { fetchSalesReportSummary } from "../../services/salesReportService";

/**
 * Loads the summary for one applied filter set.
 *
 * <p>The summary is treated as belonging to the filters that produced it. When
 * the filters change, the previous summary is hidden immediately, the request
 * is aborted, and only the latest request is allowed to publish a result. This
 * prevents a slow older response from overwriting a newer one.</p>
 */
export function useSalesReportSummary({
  filters,
  enabled,
  refreshKey = 0,
  request = fetchSalesReportSummary,
}) {
  const filterKey = useMemo(() => JSON.stringify(filters ?? {}), [filters]);
  const [state, setState] = useState({
    filterKey: null,
    summary: null,
    loading: false,
    error: false,
  });
  const requestId = useRef(0);

  useEffect(() => {
    if (!enabled) return undefined;

    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;
    const controller = new AbortController();
    let active = true;

    setState({
      filterKey,
      summary: null,
      loading: true,
      error: false,
    });

    request(filters, controller.signal)
      .then((data) => {
        if (!active || requestId.current !== currentRequestId) return;
        setState({
          filterKey,
          summary: data,
          loading: false,
          error: false,
        });
      })
      .catch((error) => {
        if (!active || requestId.current !== currentRequestId) return;
        if (error?.name === "CanceledError" || error?.name === "AbortError") {
          return;
        }
        setState({
          filterKey,
          summary: null,
          loading: false,
          error: true,
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [enabled, filterKey, filters, refreshKey, request]);

  const isCurrent = state.filterKey === filterKey;
  return {
    summary: isCurrent ? state.summary : null,
    loading: enabled && (!isCurrent || state.loading),
    error: enabled && isCurrent && state.error,
    isCurrent,
  };
}
