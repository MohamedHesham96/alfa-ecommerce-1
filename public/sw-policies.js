/*
 * Shared PWA caching policy.
 *
 * This file is loaded inside the service worker with importScripts() and is
 * also required directly by the Jest unit tests, so it intentionally stays a
 * plain classic script with a CommonJS export.
 */
(function (global) {
  "use strict";

  var CACHE_PREFIX = "alfa-pwa";
  var OFFLINE_URL = "/offline.html";

  var CACHE_KINDS = [
    "precache",
    "static",
    "fonts",
    "images",
    "pages",
    "publicApi",
  ];

  var CACHE_LIMITS = {
    static: 400,
    fonts: 24,
    images: 120,
    pages: 40,
    publicApi: 80,
  };

  var PUBLIC_PAGE_EXACT = {
    "/": true,
    "/products": true,
    "/user/about": true,
    "/user/home": true,
    "/offline": true,
    "/offline.html": true,
  };

  var PUBLIC_PAGE_PREFIXES = [
    "/products/",
    "/categories/",
    "/user/products/",
    "/user/search/",
  ];

  var PRIVATE_PAGE_PREFIXES = [
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
  ];

  function normalizePathname(pathname) {
    if (!pathname) return "/";
    var normalized = pathname.split("?")[0].split("#")[0];
    if (normalized.length > 1 && normalized.charAt(normalized.length - 1) === "/") {
      normalized = normalized.slice(0, -1);
    }
    return normalized || "/";
  }

  function hasPathPrefix(pathname, prefix) {
    return pathname === prefix || pathname.indexOf(prefix + "/") === 0;
  }

  function isPublicPagePath(pathname) {
    var path = normalizePathname(pathname);
    if (PUBLIC_PAGE_EXACT[path]) return true;
    return PUBLIC_PAGE_PREFIXES.some(function (prefix) {
      return path.indexOf(prefix) === 0;
    });
  }

  function isPrivatePagePath(pathname) {
    var path = normalizePathname(pathname);
    return PRIVATE_PAGE_PREFIXES.some(function (prefix) {
      return hasPathPrefix(path, prefix);
    });
  }

  function isApiRequest(pathname) {
    return normalizePathname(pathname).indexOf("/api/") === 0;
  }

  /*
   * A synthetic query parameter used by the app's server-reachability probe.
   * The probe must always hit the network even when the public API response
   * is still inside the SW cache, otherwise a cached 200 can incorrectly
   * clear the "server unavailable" recovery overlay.
   */
  function isPwaHealthCheck(url) {
    try {
      var parsed = url instanceof URL ? url : new URL(String(url));
      return parsed.searchParams.get("__alfa_health") === "1";
    } catch (error) {
      return false;
    }
  }

  function isSensitiveApiPath(pathname) {
    var path = normalizePathname(pathname);
    var sensitivePrefixes = [
      "/api/auth",
      "/api/users",
      "/api/shopCarts",
      "/api/orders",
      "/api/return-orders",
      "/api/user/",
      "/api/admin",
      "/api/payments",
      "/api/payment",
      "/api/checkout",
      "/api/cart",
    ];
    return sensitivePrefixes.some(function (prefix) {
      return path === prefix || path.indexOf(prefix + "/") === 0 || path.indexOf(prefix) === 0;
    });
  }

  function getApiCachePolicy(pathname, method) {
    if (String(method || "GET").toUpperCase() !== "GET") return null;

    var path = normalizePathname(pathname);
    if (path.indexOf("/api/public/") !== 0) return null;
    if (isSensitiveApiPath(path)) return null;

    var maxAgeMs = 5 * 60 * 1000;
    if (path.indexOf("/api/public/itemCategory") === 0) {
      maxAgeMs = 30 * 60 * 1000;
    } else if (
      path.indexOf("/api/public/sliderImages") === 0 ||
      path.indexOf("/api/public/offers") === 0
    ) {
      maxAgeMs = 15 * 60 * 1000;
    } else if (
      path.indexOf("/api/public/contact") === 0 ||
      path.indexOf("/api/public/governorates") === 0
    ) {
      maxAgeMs = 24 * 60 * 60 * 1000;
    } else if (path.indexOf("/api/public/seo") === 0) {
      maxAgeMs = 6 * 60 * 60 * 1000;
    }

    return {
      cacheKind: "publicApi",
      maxAgeMs: maxAgeMs,
      staleWhileRevalidate: true,
      trimTo: CACHE_LIMITS.publicApi,
    };
  }

  function isCacheableApiRequest(options) {
    var opts = options || {};
    var method = String(opts.method || "GET").toUpperCase();
    if (method !== "GET") return false;
    if (!getApiCachePolicy(opts.pathname, method)) return false;
    if (opts.hasAuthorization) return false;
    if (opts.originAllowed === false) return false;
    return true;
  }

  function isStaticAsset(pathname) {
    var path = normalizePathname(pathname);
    return (
      path.indexOf("/_next/static/") === 0 ||
      path.indexOf("/icons/") === 0 ||
      path.indexOf("/splash/") === 0 ||
      path.indexOf("/font/") === 0 ||
      path === "/manifest.webmanifest" ||
      path === "/favicon.ico"
    );
  }

  function isFontRequest(pathname, destination) {
    if (destination === "font") return true;
    return /\.(woff2?|ttf|otf|eot)$/i.test(normalizePathname(pathname));
  }

  function isImageRequest(pathname, destination) {
    if (destination === "image") return true;
    var path = normalizePathname(pathname);
    if (path.indexOf("/_next/image") === 0) return true;
    return /\.(png|jpe?g|webp|avif|gif|svg|ico)$/i.test(path);
  }

  function isRscRequest(headers, search) {
    if (headers && typeof headers.get === "function") {
      if (headers.get("rsc") === "1") return true;
      if (headers.get("next-router-prefetch")) return true;
    }
    return typeof search === "string" && /(?:^|[?&])_rsc=/.test(search);
  }

  function normalizeLanguage(value) {
    var language = String(value || "").toLowerCase();
    return language.indexOf("en") === 0 ? "en" : "ar";
  }

  function getRequestLanguage(headers) {
    if (!headers || typeof headers.get !== "function") return "ar";
    return normalizeLanguage(headers.get("accept-language"));
  }

  function buildApiCacheKey(urlString, language) {
    var url = new URL(urlString);
    url.searchParams.set("__alfa_lang", normalizeLanguage(language));
    return url.toString();
  }

  function isCacheableResponse(response) {
    if (!response || response.status !== 200 || response.ok !== true) return false;
    if (response.type === "opaque" || response.type === "opaqueredirect") {
      return false;
    }

    var headers = response.headers;
    if (!headers || typeof headers.get !== "function") return false;

    var cacheControl = String(headers.get("cache-control") || "").toLowerCase();
    if (cacheControl.indexOf("no-store") !== -1 || cacheControl.indexOf("private") !== -1) {
      return false;
    }

    var vary = String(headers.get("vary") || "").toLowerCase();
    if (vary === "*") return false;
    if (vary.indexOf("cookie") !== -1 || vary.indexOf("authorization") !== -1) {
      return false;
    }

    if (headers.get("set-cookie")) return false;

    return true;
  }

  /*
   * Public page HTML is cached intentionally for offline navigation. Next.js
   * marks dynamic routes as no-store; the route allowlist above guarantees
   * only pages that do not render account data can reach this function.
   * Any response that sets cookies or varies on Cookie/Authorization is still
   * rejected to prevent user-specific HTML from entering Cache Storage.
   */
  function isCacheablePublicPageResponse(response) {
    if (!response || response.status !== 200 || response.ok !== true) return false;
    if (response.type === "opaque" || response.type === "opaqueredirect") {
      return false;
    }
    if (response.redirected) return false;

    var headers = response.headers;
    if (!headers || typeof headers.get !== "function") return false;

    if (headers.get("set-cookie")) return false;
    if (String(headers.get("vary") || "").toLowerCase() === "*") return false;

    var vary = String(headers.get("vary") || "").toLowerCase();
    if (vary.indexOf("cookie") !== -1 || vary.indexOf("authorization") !== -1) {
      return false;
    }

    var contentType = String(headers.get("content-type") || "").toLowerCase();
    return (
      contentType.indexOf("text/html") !== -1 ||
      contentType.indexOf("application/xhtml+xml") !== -1
    );
  }

  /*
   * A navigation response may only be cached under the public URL that was
   * requested. Redirected responses are never cached: a public route must not
   * be able to store a login page or another private document under a public
   * offline URL.
   */
  function isCacheableNavigationResponse(response, requestUrl) {
    if (!response || response.redirected) return false;
    if (!response.url || !requestUrl) return false;

    try {
      var requested = new URL(String(requestUrl));
      var finalUrl = new URL(String(response.url));
      if (requested.origin !== finalUrl.origin) return false;
      return normalizePathname(requested.pathname) === normalizePathname(finalUrl.pathname);
    } catch (error) {
      return false;
    }
  }

  function shouldCachePage(pathname, hasAuthorization) {
    if (hasAuthorization) return false;
    return isPublicPagePath(pathname) && !isPrivatePagePath(pathname);
  }

  function getCacheName(kind, version) {
    return CACHE_PREFIX + "-" + version + "-" + kind;
  }

  function getCacheNames(version) {
    var names = {};
    CACHE_KINDS.forEach(function (kind) {
      names[kind] = getCacheName(kind, version);
    });
    return names;
  }

  function isManagedCacheName(name) {
    return String(name || "").indexOf(CACHE_PREFIX + "-") === 0;
  }

  var policies = {
    CACHE_PREFIX: CACHE_PREFIX,
    OFFLINE_URL: OFFLINE_URL,
    CACHE_KINDS: CACHE_KINDS,
    CACHE_LIMITS: CACHE_LIMITS,
    PUBLIC_PAGE_PREFIXES: PUBLIC_PAGE_PREFIXES,
    PRIVATE_PAGE_PREFIXES: PRIVATE_PAGE_PREFIXES,
    normalizePathname: normalizePathname,
    isPublicPagePath: isPublicPagePath,
    isPrivatePagePath: isPrivatePagePath,
    isApiRequest: isApiRequest,
    isPwaHealthCheck: isPwaHealthCheck,
    isSensitiveApiPath: isSensitiveApiPath,
    getApiCachePolicy: getApiCachePolicy,
    isCacheableApiRequest: isCacheableApiRequest,
    isStaticAsset: isStaticAsset,
    isFontRequest: isFontRequest,
    isImageRequest: isImageRequest,
    isRscRequest: isRscRequest,
    normalizeLanguage: normalizeLanguage,
    getRequestLanguage: getRequestLanguage,
    buildApiCacheKey: buildApiCacheKey,
    isCacheableResponse: isCacheableResponse,
    isCacheablePublicPageResponse: isCacheablePublicPageResponse,
    isCacheableNavigationResponse: isCacheableNavigationResponse,
    shouldCachePage: shouldCachePage,
    getCacheName: getCacheName,
    getCacheNames: getCacheNames,
    isManagedCacheName: isManagedCacheName,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = policies;
  }
  if (typeof self !== "undefined") {
    self.AlfaPwaPolicies = policies;
  }
})(typeof self !== "undefined" ? self : globalThis);
