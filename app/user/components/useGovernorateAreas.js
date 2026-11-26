"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getRequest } from "../../../utils/requestsUtils";

// Areas are reference data that rarely change during a shopping session.
// Caching per governorate avoids repeated requests when the customer switches
// back and forth between governorates or between saved addresses.
const areaCache = new Map();

export function clearGovernorateAreasCache() {
  areaCache.clear();
}

export function useGovernorateAreas(governorateId, enabled = true) {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [loadedFor, setLoadedFor] = useState(null);
  const requestId = useRef(0);
  const wasEnabled = useRef(enabled);

  useEffect(() => {
    // Activation may follow a period where the feature was off and area fees
    // changed. Do not serve a list cached from the previous activation.
    if (enabled && !wasEnabled.current) {
      clearGovernorateAreasCache();
    }
    wasEnabled.current = enabled;
  }, [enabled]);

  const load = useCallback(
    async (id, { force = false } = {}) => {
      if (!id || !enabled) {
        setAreas([]);
        setLoadedFor(null);
        setLoading(false);
        setError(false);
        return;
      }

      const cacheKey = String(id);
      if (!force && areaCache.has(cacheKey)) {
        setAreas(areaCache.get(cacheKey));
        setLoadedFor(cacheKey);
        setLoading(false);
        setError(false);
        return;
      }

      const currentRequest = ++requestId.current;
      // Never leave the previous governorate's list visible while the next
      // list is loading: an area from another governorate must not be
      // selectable or remain selected.
      setAreas([]);
      setLoadedFor(null);
      setLoading(true);
      setError(false);
      try {
        const response = await getRequest(
          `/api/public/governorates/${id}/areas`,
          { suppressErrorToast: true },
        );
        const list = Array.isArray(response?.data) ? response.data : [];
        areaCache.set(cacheKey, list);
        if (currentRequest === requestId.current) {
          setAreas(list);
          setLoadedFor(cacheKey);
        }
      } catch {
        if (currentRequest === requestId.current) {
          setAreas([]);
          setLoadedFor(cacheKey);
          setError(true);
        }
      } finally {
        if (currentRequest === requestId.current) {
          setLoading(false);
        }
      }
    },
    [enabled],
  );

  useEffect(() => {
    load(governorateId);
    return () => {
      // Invalidate only the in-flight result; the cache stays warm.
      requestId.current += 1;
    };
  }, [governorateId, load]);

  const reload = useCallback(
    () => load(governorateId, { force: true }),
    [governorateId, load],
  );

  return { areas, loading, error, reload, loadedFor };
}
