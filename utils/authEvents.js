/**
 * Cross-component auth notifications.
 *
 * localStorage changes do not re-render components that already read the
 * stored session, and the browser only emits `storage` in other tabs. The
 * login, signup and logout flows therefore broadcast this event so shared UI
 * (header account chip, cart badge, route guards) can sync immediately.
 */
export const AUTH_CHANGED_EVENT = "alfa:auth-changed";

export function notifyAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
