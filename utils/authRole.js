"use client";

import { useEffect, useState } from "react";

export const ADMIN_ROLE = "ADMIN";

/**
 * Reads the role from the existing session storage. This is a UI convenience
 * only: every customer-only operation is also enforced by the backend.
 */
export function getStoredRole() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("role");
  } catch {
    return null;
  }
}

export function isAdminRole(role) {
  return role === ADMIN_ROLE;
}

/**
 * A session needs both the user id and a refresh token. The short-lived access
 * token may be absent until requestsUtils refreshes it.
 */
export function hasStoredSession() {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(
      localStorage.getItem("id") && localStorage.getItem("refreshToken"),
    );
  } catch {
    return false;
  }
}

/**
 * Event-handler guard that does not depend on a component's render state.
 * This keeps a programmatic click from reaching a customer API even during
 * the first render before the role hook has hydrated.
 */
export function isAdminSession() {
  return isAdminRole(getStoredRole());
}

/**
 * Reuses the single session stored in localStorage. `ready` stays false on
 * the server and during the first client render so admin-only UI is not
 * rendered from a stale assumption.
 */
export function useAuthRole() {
  const [role, setRole] = useState(null);
  const [hasSession, setHasSession] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const syncRole = () => {
      setRole(getStoredRole());
      setHasSession(hasStoredSession());
      setReady(true);
    };

    syncRole();
    window.addEventListener("storage", syncRole);
    return () => window.removeEventListener("storage", syncRole);
  }, []);

  return {
    role,
    ready,
    hasSession,
    isAdmin: isAdminRole(role),
  };
}
