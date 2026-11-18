import {
  __resetAnalyticsForTests,
  createUuid,
  getVisitorId,
  trackPageView,
  trackProductView,
  trackSearch,
  trackWishlistAdd,
} from "../lib/analytics/client";

const VISITOR_KEY = "alfa_analytics_visitor_id";
const SESSION_KEY = "alfa_analytics_session";
const ATTRIBUTION_KEY = "alfa_analytics_attribution";
const ATTRIBUTION_SENT_KEY = "alfa_analytics_attribution_sent";

function setReferrer(value) {
  Object.defineProperty(document, "referrer", {
    configurable: true,
    get: () => value,
  });
}

async function advance(ms) {
  await jest.advanceTimersByTimeAsync(ms);
}

describe("storefront analytics client", () => {
  beforeEach(() => {
    __resetAnalyticsForTests();
    localStorage.clear();
    sessionStorage.clear();
    jest.useFakeTimers();
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://api.test";
    setReferrer("");
    window.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { sessionId: createUuid() } }),
    });
  });

  afterEach(() => {
    __resetAnalyticsForTests();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("persists one first-party visitor id across visits", () => {
    const first = getVisitorId();
    expect(first).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(getVisitorId()).toBe(first);
    expect(localStorage.getItem(VISITOR_KEY)).toBe(first);
  });

  it("batches session start and page view without authentication", async () => {
    setReferrer("https://www.google.com/search?q=alfa");
    trackPageView("/products/alfa");
    expect(window.fetch).not.toHaveBeenCalled();

    await advance(1300);

    expect(window.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = window.fetch.mock.calls[0];
    expect(url).toBe("http://api.test/api/public/analytics/collect");
    expect(options.headers.Authorization).toBeUndefined();
    const body = JSON.parse(options.body);
    expect(body.visitorId).toBe(localStorage.getItem(VISITOR_KEY));
    expect(body.events.map((event) => event.type)).toEqual([
      "SESSION_START",
      "PAGE_VIEW",
    ]);
    expect(body.events[1].path).toBe("/products/alfa");
    expect(body.attribution.referrer).toContain("google.com");
    expect(sessionStorage.getItem(ATTRIBUTION_SENT_KEY)).toBe("true");
  });

  it("attaches the existing access token when present", async () => {
    localStorage.setItem("accessToken", "token-123");
    trackPageView("/");
    await advance(1300);

    const [, options] = window.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer token-123");
  });

  it("de-duplicates accidental repeated page and engagement events", async () => {
    trackPageView("/products/alfa");
    trackPageView("/products/alfa");
    trackProductView(7);
    trackProductView(7);
    trackWishlistAdd(7);
    trackWishlistAdd(7);
    trackSearch("receiver");
    trackSearch("receiver");

    await advance(1300);

    const body = JSON.parse(window.fetch.mock.calls[0][1].body);
    const types = body.events.map((event) => event.type);
    expect(types.filter((type) => type === "PAGE_VIEW")).toHaveLength(1);
    expect(types.filter((type) => type === "PRODUCT_VIEW")).toHaveLength(1);
    expect(types.filter((type) => type === "WISHLIST_ADD")).toHaveLength(1);
    expect(types.filter((type) => type === "SEARCH")).toHaveLength(1);
  });

  it("counts each client-side navigation as its own page view", async () => {
    trackPageView("/");
    trackPageView("/products/alfa");
    trackPageView("/categories/receivers");

    await advance(1300);

    const body = JSON.parse(window.fetch.mock.calls[0][1].body);
    expect(
      body.events.filter((event) => event.type === "PAGE_VIEW").map((event) => event.path),
    ).toEqual(["/", "/products/alfa", "/categories/receivers"]);
  });

  it("creates a new visitor when browser storage is cleared", () => {
    const first = getVisitorId();
    localStorage.clear();
    const second = getVisitorId();
    expect(second).not.toBe(first);
  });

  it("tracks a view for each distinct product without repeating the same one", async () => {
    trackProductView(7);
    trackProductView(7);
    trackProductView(8);

    await advance(1300);

    const body = JSON.parse(window.fetch.mock.calls[0][1].body);
    const productEvents = body.events.filter(
      (event) => event.type === "PRODUCT_VIEW",
    );
    expect(productEvents.map((event) => event.itemId)).toEqual([7, 8]);
  });

  it("starts a new session after thirty minutes of inactivity", async () => {
    const oldSessionId = createUuid();
    const serverSessionId = createUuid();
    window.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { sessionId: serverSessionId },
      }),
    });
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        id: oldSessionId,
        lastActivityAt: Date.now() - 31 * 60 * 1000,
      }),
    );

    trackPageView("/");
    await advance(1300);

    const body = JSON.parse(window.fetch.mock.calls[0][1].body);
    expect(body.sessionId).not.toBe(oldSessionId);
    expect(body.events.map((event) => event.type)).toEqual([
      "SESSION_START",
      "PAGE_VIEW",
    ]);
    const stored = JSON.parse(localStorage.getItem(SESSION_KEY));
    expect(stored.id).toBe(serverSessionId);
  });

  it("never tracks the admin dashboard", async () => {
    trackPageView("/admin/Dashboard");
    await advance(1300);

    expect(window.fetch).not.toHaveBeenCalled();
    expect(localStorage.getItem(VISITOR_KEY)).toBeNull();
  });

  it("reuses the attribution captured on the external landing page", async () => {
    setReferrer("https://www.facebook.com/alfa");
    sessionStorage.setItem(
      ATTRIBUTION_KEY,
      JSON.stringify({ referrer: "https://www.facebook.com/alfa" }),
    );

    trackPageView("/products/alfa");
    await advance(1300);

    const body = JSON.parse(window.fetch.mock.calls[0][1].body);
    expect(body.attribution.referrer).toContain("facebook.com");
  });

  it("keeps event ids on a failed batch and retries idempotently", async () => {
    window.fetch
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { sessionId: createUuid() } }),
      });

    trackPageView("/products/alfa");
    await advance(1300);
    expect(window.fetch).toHaveBeenCalledTimes(1);
    const firstBody = JSON.parse(window.fetch.mock.calls[0][1].body);

    await advance(15000);
    expect(window.fetch).toHaveBeenCalledTimes(2);
    const secondBody = JSON.parse(window.fetch.mock.calls[1][1].body);
    expect(secondBody.events.map((event) => event.eventId)).toEqual(
      firstBody.events.map((event) => event.eventId),
    );
  });
});
