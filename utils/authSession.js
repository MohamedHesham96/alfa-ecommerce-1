import { clearUserScopedCaches } from "../lib/pwa/client";

export const AUTH_STORAGE_KEYS = [
  "accessToken",
  "refreshToken",
  "id",
  "firstName",
  "lastName",
  "address",
  "email",
  "phone",
  "role",
  "username",
  "governorateId",
];

/*
 * Removes every stored account field and the PWA caches that can contain
 * account-adjacent HTML/API data. The promise resolves even when Cache
 * Storage is unavailable so callers can safely await it before redirecting.
 */
export function clearAuthStorage() {
  if (typeof window === "undefined") return Promise.resolve();
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  return clearUserScopedCaches().catch(() => {});
}
