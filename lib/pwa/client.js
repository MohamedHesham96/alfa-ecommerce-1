import { getApiBaseOrigin, getApiImageBaseOrigin } from "./constants";

function getContainer() {
  if (typeof navigator === "undefined") return null;
  return navigator.serviceWorker || null;
}

export function postToServiceWorker(message) {
  const container = getContainer();
  if (!container) return false;

  if (container.controller) {
    container.controller.postMessage(message);
    return true;
  }

  if (container.ready && typeof container.ready.then === "function") {
    container.ready
      .then((registration) => {
        const target =
          registration.active ||
          registration.waiting ||
          registration.installing ||
          null;
        if (target) target.postMessage(message);
      })
      .catch(() => {});
  }

  return false;
}

export function configureServiceWorker(registration = null) {
  const container = getContainer();
  const target =
    (container && container.controller) ||
    registration?.active ||
    registration?.waiting ||
    registration?.installing ||
    null;

  const origins = [
    typeof window !== "undefined" ? window.location.origin : null,
    getApiBaseOrigin(),
    getApiImageBaseOrigin(),
  ].filter(Boolean);

  const message = {
    type: "CONFIGURE",
    apiOrigins: Array.from(new Set(origins)),
  };

  if (target) {
    target.postMessage(message);
    return true;
  }
  return postToServiceWorker(message);
}

async function deleteManagedCaches(suffixes) {
  if (typeof caches === "undefined" || !caches || typeof caches.keys !== "function") {
    return [];
  }

  const names = await caches.keys();
  const managed = names.filter((name) =>
    suffixes.some((suffix) => name.startsWith("alfa-pwa-") && name.endsWith(`-${suffix}`)),
  );

  await Promise.all(managed.map((name) => caches.delete(name)));
  return managed;
}

/*
 * Page HTML and public API entries are user-scoped runtime data. Static
 * assets, fonts, and public product images are safe to keep for offline use.
 */
export async function clearUserScopedCaches() {
  postToServiceWorker({ type: "CLEAR_USER_DATA" });
  return deleteManagedCaches(["pages", "publicApi"]);
}

export async function invalidateCatalogCaches() {
  postToServiceWorker({ type: "INVALIDATE_CATALOG" });
  return deleteManagedCaches(["pages", "publicApi", "images"]);
}

export async function ensurePersistentStorage() {
  if (
    typeof navigator === "undefined" ||
    !navigator.storage ||
    typeof navigator.storage.persist !== "function"
  ) {
    return false;
  }

  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export function isAppControlledByServiceWorker() {
  const container = getContainer();
  return Boolean(container && container.controller);
}
