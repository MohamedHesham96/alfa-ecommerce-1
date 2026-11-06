const policies = require("../public/sw-policies.js");

function makeResponse({
  status = 200,
  type = "basic",
  headers = {},
  redirected = false,
  url = "http://localhost:3000/",
} = {}) {
  const normalized = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );
  return {
    status,
    ok: status >= 200 && status < 300,
    type,
    redirected,
    url,
    headers: {
      get(name) {
        return normalized[String(name).toLowerCase()] ?? null;
      },
    },
  };
}

describe("PWA caching policies", () => {
  it("creates versioned cache names and identifies only managed caches", () => {
    const names = policies.getCacheNames("abc123");
    expect(names.pages).toBe("alfa-pwa-abc123-pages");
    expect(names.publicApi).toBe("alfa-pwa-abc123-publicApi");
    expect(names.images).toBe("alfa-pwa-abc123-images");
    expect(policies.isManagedCacheName(names.pages)).toBe(true);
    expect(policies.isManagedCacheName("other-app-cache")).toBe(false);
  });

  it("allows only public GET API requests", () => {
    expect(
      policies.isCacheableApiRequest({
        method: "GET",
        pathname: "/api/public/items/15",
        originAllowed: true,
      }),
    ).toBe(true);

    expect(
      policies.isCacheableApiRequest({
        method: "POST",
        pathname: "/api/public/items/search",
        originAllowed: true,
      }),
    ).toBe(false);

    expect(
      policies.isCacheableApiRequest({
        method: "GET",
        pathname: "/api/public/items/15",
        hasAuthorization: true,
        originAllowed: true,
      }),
    ).toBe(false);

    expect(
      policies.isCacheableApiRequest({
        method: "GET",
        pathname: "/api/public/items/15",
        originAllowed: false,
      }),
    ).toBe(false);
  });

  it.each([
    "/api/auth/login",
    "/api/auth/refresh",
    "/api/users",
    "/api/users/orders/place-order",
    "/api/shopCarts",
    "/api/shopCarts/addLine",
    "/api/orders/search",
    "/api/return-orders/search",
    "/api/admin/items/search",
    "/api/payments/intent",
  ])("never caches private or transactional endpoint %s", (pathname) => {
    expect(policies.getApiCachePolicy(pathname, "GET")).toBeNull();
  });

  it("uses short product TTLs and longer reference-data TTLs", () => {
    expect(
      policies.getApiCachePolicy("/api/public/items/15", "GET").maxAgeMs,
    ).toBe(5 * 60 * 1000);
    expect(
      policies.getApiCachePolicy("/api/public/itemCategory/all", "GET").maxAgeMs,
    ).toBe(30 * 60 * 1000);
    expect(
      policies.getApiCachePolicy("/api/public/governorates", "GET").maxAgeMs,
    ).toBe(24 * 60 * 60 * 1000);
  });

  it("allowlists only public pages for offline navigation", () => {
    expect(policies.isPublicPagePath("/")).toBe(true);
    expect(policies.isPublicPagePath("/products")).toBe(true);
    expect(policies.isPublicPagePath("/products/phone")).toBe(true);
    expect(policies.isPublicPagePath("/categories/phones")).toBe(true);
    expect(policies.isPublicPagePath("/user/search/laptop")).toBe(true);
    expect(policies.isPublicPagePath("/user/about")).toBe(true);

    expect(policies.isPublicPagePath("/admin/Dashboard")).toBe(false);
    expect(policies.isPublicPagePath("/user/cart")).toBe(false);
    expect(policies.isPublicPagePath("/user/profile")).toBe(false);
    expect(policies.isPublicPagePath("/user/wishlist")).toBe(false);
    expect(policies.isPublicPagePath("/user/ordershistory")).toBe(false);
    expect(policies.isPublicPagePath("/signin")).toBe(false);
    expect(policies.isPrivatePagePath("/user/cart")).toBe(true);
  });

  it("never caches pages requested with authorization", () => {
    expect(policies.shouldCachePage("/products/phone", false)).toBe(true);
    expect(policies.shouldCachePage("/products/phone", true)).toBe(false);
    expect(policies.shouldCachePage("/user/cart", false)).toBe(false);
  });

  it("rejects uncacheable API responses", () => {
    expect(policies.isCacheableResponse(makeResponse())).toBe(true);
    expect(
      policies.isCacheableResponse(
        makeResponse({ headers: { "cache-control": "no-store" } }),
      ),
    ).toBe(false);
    expect(
      policies.isCacheableResponse(
        makeResponse({ headers: { "cache-control": "private, max-age=0" } }),
      ),
    ).toBe(false);
    expect(policies.isCacheableResponse(makeResponse({ status: 500 }))).toBe(
      false,
    );
    expect(
      policies.isCacheableResponse(makeResponse({ type: "opaque" })),
    ).toBe(false);
    expect(
      policies.isCacheableResponse(
        makeResponse({ headers: { "set-cookie": "session=secret" } }),
      ),
    ).toBe(false);
    expect(
      policies.isCacheableResponse(
        makeResponse({ headers: { vary: "Cookie, Accept-Language" } }),
      ),
    ).toBe(false);
    expect(
      policies.isCacheableResponse(
        makeResponse({ headers: { vary: "Authorization" } }),
      ),
    ).toBe(false);
  });

  it("identifies the server-reachability probe so it always bypasses caches", () => {
    expect(
      policies.isPwaHealthCheck(
        "https://api.example.com/api/public/sliderImages?__alfa_health=1",
      ),
    ).toBe(true);
    expect(
      policies.isPwaHealthCheck(
        "https://api.example.com/api/public/sliderImages?__alfa_health=0",
      ),
    ).toBe(false);
    expect(
      policies.isPwaHealthCheck("https://api.example.com/api/public/sliderImages"),
    ).toBe(false);
  });

  it("allows public HTML marked no-store but rejects user-specific Vary", () => {
    expect(
      policies.isCacheablePublicPageResponse(
        makeResponse({
          headers: {
            "cache-control": "no-store, private",
            "content-type": "text/html; charset=utf-8",
          },
        }),
      ),
    ).toBe(true);

    expect(
      policies.isCacheablePublicPageResponse(
        makeResponse({
          headers: {
            "content-type": "text/html",
            vary: "Cookie",
          },
        }),
      ),
    ).toBe(false);

    expect(
      policies.isCacheablePublicPageResponse(
        makeResponse({
          headers: {
            "content-type": "text/html",
            "set-cookie": "session=secret",
          },
        }),
      ),
    ).toBe(false);

    expect(
      policies.isCacheablePublicPageResponse(
        makeResponse({
          headers: { "content-type": "application/json" },
        }),
      ),
    ).toBe(false);
  });

  it("only caches navigation responses at the requested public URL", () => {
    const pageHeaders = { "content-type": "text/html; charset=utf-8" };
    expect(
      policies.isCacheableNavigationResponse(
        makeResponse({
          headers: pageHeaders,
          url: "https://alfa.test/products",
        }),
        "https://alfa.test/products",
      ),
    ).toBe(true);

    expect(
      policies.isCacheableNavigationResponse(
        makeResponse({
          headers: pageHeaders,
          redirected: true,
          url: "https://alfa.test/signin",
        }),
        "https://alfa.test/products",
      ),
    ).toBe(false);

    expect(
      policies.isCacheableNavigationResponse(
        makeResponse({
          headers: pageHeaders,
          url: "https://alfa.test/signin",
        }),
        "https://alfa.test/products",
      ),
    ).toBe(false);

    expect(
      policies.isCacheableNavigationResponse(
        makeResponse({
          headers: pageHeaders,
          url: "https://other.test/products",
        }),
        "https://alfa.test/products",
      ),
    ).toBe(false);
  });

  it("separates API cache entries by language", () => {
    const ar = policies.buildApiCacheKey(
      "http://api.test/api/public/items/1?x=1",
      "ar",
    );
    const en = policies.buildApiCacheKey(
      "http://api.test/api/public/items/1?x=1",
      "en",
    );
    expect(ar).not.toBe(en);
    expect(ar).toContain("__alfa_lang=ar");
    expect(en).toContain("__alfa_lang=en");
  });

  it("identifies RSC, static, font, and image requests", () => {
    const headers = { get: (name) => (name === "rsc" ? "1" : null) };
    expect(policies.isRscRequest(headers, "")).toBe(true);
    expect(policies.isRscRequest({ get: () => null }, "?x=1&_rsc=abc")).toBe(
      true,
    );
    expect(policies.isStaticAsset("/_next/static/chunks/app.js")).toBe(true);
    expect(policies.isStaticAsset("/manifest.webmanifest")).toBe(true);
    expect(policies.isFontRequest("/_next/static/media/font.woff2", "font")).toBe(
      true,
    );
    expect(policies.isImageRequest("/_next/image", "image")).toBe(true);
    expect(policies.isImageRequest("/Images/logo.png", "")).toBe(true);
    expect(policies.isImageRequest("/api/public/items/1", "")).toBe(false);
  });
});
