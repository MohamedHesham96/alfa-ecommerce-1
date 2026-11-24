"use client";

import { useEffect, useState } from "react";

import { getRequest } from "../../../utils/requestsUtils";

/**
 * Loads one read-only aggregate for an admin header. Refetches whenever the
 * caller bumps `refreshKey` after a mutation in the table.
 */
export function useAdminStats(endpoint, refreshKey = 0) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await getRequest(endpoint);
        if (active) setStats(response?.data ?? null);
      } catch {
        // The shared request helper already surfaces the error.
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [endpoint, refreshKey]);

  return stats;
}
