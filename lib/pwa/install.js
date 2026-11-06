/**
 * Pure install-prompt helpers. Kept free of browser globals so they can be
 * unit tested without a DOM and reused by the React provider.
 */

export const INSTALL_MODES = {
  INSTALLED: "installed",
  NATIVE: "native",
  IOS_INSTRUCTIONS: "ios-instructions",
  UNAVAILABLE: "unavailable",
};

export function isStandaloneMode({ matchMedia, navigator } = {}) {
  try {
    if (typeof matchMedia === "function") {
      const standalone = matchMedia("(display-mode: standalone)");
      if (standalone && standalone.matches) return true;
      const overlay = matchMedia("(display-mode: window-controls-overlay)");
      if (overlay && overlay.matches) return true;
    }
    if (navigator && navigator.standalone === true) return true;
  } catch {
    return false;
  }
  return false;
}

export function isIosDevice(userAgent, platform, maxTouchPoints) {
  const ua = String(userAgent || "");
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  // iPadOS 13+ reports a desktop macOS user agent but has touch points.
  return /MacIntel/i.test(String(platform || "")) && Number(maxTouchPoints || 0) > 1;
}

export function isIosSafari(userAgent, platform, maxTouchPoints) {
  if (!isIosDevice(userAgent, platform, maxTouchPoints)) return false;
  const ua = String(userAgent || "");
  return !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|DuckDuckGo/i.test(ua);
}

export function getInstallMode({
  deferredPrompt = null,
  isIosSafariBrowser = false,
  isStandalone = false,
  installed = false,
} = {}) {
  if (installed || isStandalone) return INSTALL_MODES.INSTALLED;
  if (deferredPrompt) return INSTALL_MODES.NATIVE;
  if (isIosSafariBrowser) return INSTALL_MODES.IOS_INSTRUCTIONS;
  return INSTALL_MODES.UNAVAILABLE;
}

export function isDismissalActive(dismissedAt, now, durationMs) {
  if (!dismissedAt) return false;
  const timestamp = Number(dismissedAt);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return false;
  return Number(now) - timestamp < Number(durationMs);
}

export function shouldOfferInstall({
  isStandalone = false,
  installed = false,
  deferredPrompt = null,
  isIosSafariBrowser = false,
  dismissedAt = null,
  now = Date.now(),
  dismissDurationMs = 0,
  pathAllowed = true,
} = {}) {
  if (installed || isStandalone) return false;
  if (!pathAllowed) return false;
  if (isDismissalActive(dismissedAt, now, dismissDurationMs)) return false;
  return Boolean(deferredPrompt || isIosSafariBrowser);
}

export function readDismissedAt(storage, key) {
  if (!storage || typeof storage.getItem !== "function") return null;
  try {
    const value = Number(storage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function writeDismissedAt(storage, key, value = Date.now()) {
  if (!storage || typeof storage.setItem !== "function") return false;
  try {
    storage.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
}
