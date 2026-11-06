/**
 * Central PWA kill switch.
 *
 * PWA support is disabled unless NEXT_PUBLIC_ENABLE_PWA is explicitly "true".
 * This keeps every PWA implementation file intact while allowing the feature
 * to be suspended and restored with one build-time environment variable.
 */
export const isPwaEnabled =
  process.env.NEXT_PUBLIC_ENABLE_PWA === "true";

export const SW_PATH = "/sw.js";
export const SW_SCOPE = "/";

export const INSTALL_DISMISSED_STORAGE_KEY = "alfa.pwa.installDismissedAt";
export const INSTALL_DISMISS_MS = 14 * 24 * 60 * 60 * 1000;
export const INSTALL_AUTO_PROMPT_DELAY_MS = 12000;
export const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;
export const OFFLINE_RESTORED_MESSAGE_MS = 4500;

const PUBLIC_INSTALL_PREFIXES = [
  "/products",
  "/categories/",
  "/user/products",
  "/user/search/",
  "/user/home",
  "/user/about",
];

const BLOCKED_INSTALL_PREFIXES = [
  "/admin",
  "/signin",
  "/signup",
  "/forgotpassword",
  "/confirmedemail",
  "/email-failed",
  "/user/cart",
  "/user/profile",
  "/user/wishlist",
  "/user/ordershistory",
  "/user/orderdetails",
  "/user/returnorders",
  "/user/returnorderdetails",
  "/__reviews-preview",
  "/offline",
];

export const isPwaDevEnabled =
  process.env.NEXT_PUBLIC_ENABLE_PWA_DEV === "true";

export function getApiBaseOrigin() {
  return getOriginFromUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
}

export function getApiImageBaseOrigin() {
  return getOriginFromUrl(process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL);
}

function getOriginFromUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function isInstallPromptAllowedPath(pathname) {
  const path = String(pathname || "/");
  if (path === "/") return true;
  if (
    BLOCKED_INSTALL_PREFIXES.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    )
  ) {
    return false;
  }
  return PUBLIC_INSTALL_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
