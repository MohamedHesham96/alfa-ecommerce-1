export const SIGN_IN_PATH = "/signin";
export const RETURN_URL_PARAM = "returnUrl";

// Accepted aliases make the mechanism reusable for links produced by other
// flows while keeping returnUrl as the canonical parameter we generate.
const RETURN_URL_PARAMS = [RETURN_URL_PARAM, "redirectUrl", "next"];

// Never send a post-login redirect back into an API, static asset, or the
// sign-in page itself.
const BLOCKED_PATH_PREFIXES = [
  "/api",
  "/_next",
  "/images",
  "/icons",
  "/splash",
  "/font",
  "/locales",
];

const getOrigin = (origin) => {
  if (origin) return origin;
  if (typeof window === "undefined") return null;
  return window.location.origin;
};

/** Current browser path, including query string and hash. */
export const getCurrentRelativeUrl = () => {
  if (typeof window === "undefined") return "/";
  const { pathname, search, hash } = window.location;
  return `${pathname || "/"}${search || ""}${hash || ""}`;
};

/**
 * Returns a safe, same-origin application path or null.
 *
 * Open-redirect protection:
 * - only root-relative paths are accepted;
 * - protocol-relative and backslash variants are rejected;
 * - the URL is parsed against the current origin and must stay there;
 * - control characters and encoded slashes/backslashes are rejected;
 * - the sign-in page and server/static paths are excluded.
 */
export const sanitizeReturnUrl = (value, origin) => {
  if (typeof value !== "string") return null;

  const candidate = value.trim();
  if (!candidate || candidate.length > 4096 || !candidate.startsWith("/")) {
    return null;
  }
  if (candidate.startsWith("//") || candidate.includes("\\")) return null;
  if (/[\u0000-\u001f\u007f]/.test(candidate)) return null;

  const baseOrigin = getOrigin(origin);
  if (!baseOrigin) return null;

  let url;
  try {
    url = new URL(candidate, baseOrigin);
  } catch {
    return null;
  }

  if (url.origin !== baseOrigin) return null;
  if (!url.pathname.startsWith("/") || url.pathname.startsWith("//")) {
    return null;
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
  if (
    decodedPath.startsWith("//") ||
    decodedPath.includes("\\") ||
    decodedPath.includes("//") ||
    decodedPath.includes("/../") ||
    decodedPath.includes("/./") ||
    decodedPath.endsWith("/..") ||
    decodedPath.endsWith("/.") ||
    decodedPath.includes("?") ||
    decodedPath.includes("#") ||
    /[\u0000-\u001f\u007f]/.test(decodedPath)
  ) {
    return null;
  }

  if (
    decodedPath === SIGN_IN_PATH ||
    decodedPath.startsWith(`${SIGN_IN_PATH}/`)
  ) {
    return null;
  }

  if (
    BLOCKED_PATH_PREFIXES.some(
      (prefix) =>
        decodedPath === prefix || decodedPath.startsWith(`${prefix}/`),
    )
  ) {
    return null;
  }

  return `${url.pathname}${url.search}${url.hash}`;
};

/** Reads and validates a return URL from a query string. */
export const getReturnUrlFromSearch = (search, origin) => {
  if (typeof search !== "string" || !search) return null;

  const params = new URLSearchParams(
    search.startsWith("?") ? search : `?${search}`,
  );

  for (const key of RETURN_URL_PARAMS) {
    const value = params.get(key);
    if (!value) continue;

    const safe = sanitizeReturnUrl(value, origin);
    if (safe) return safe;
  }

  return null;
};

/** Reads and validates a return URL from the current browser location. */
export const getReturnUrlFromLocation = () => {
  if (typeof window === "undefined") return null;
  return getReturnUrlFromSearch(window.location.search, window.location.origin);
};

/**
 * Builds the sign-in URL and preserves the destination as a single encoded
 * query parameter. The root path is intentionally omitted so normal login
 * keeps its existing default destination.
 */
export const buildSignInUrl = (returnUrl, origin) => {
  const safeReturnUrl = sanitizeReturnUrl(returnUrl, origin);
  if (!safeReturnUrl || safeReturnUrl === "/") return SIGN_IN_PATH;

  return `${SIGN_IN_PATH}?${RETURN_URL_PARAM}=${encodeURIComponent(
    safeReturnUrl,
  )}`;
};
