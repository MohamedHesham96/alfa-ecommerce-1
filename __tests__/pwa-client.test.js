jest.mock("../lib/pwa/constants", () => ({
  ...jest.requireActual("../lib/pwa/constants"),
  isPwaEnabled: true,
}));

import {
  clearUserScopedCaches,
  configureServiceWorker,
  ensurePersistentStorage,
  invalidateCatalogCaches,
  isAppControlledByServiceWorker,
  postToServiceWorker,
} from "../lib/pwa/client";

function setServiceWorkerController(controller) {
  Object.defineProperty(window.navigator, "serviceWorker", {
    configurable: true,
    value: {
      controller,
      ready: Promise.resolve({}),
      addEventListener: jest.fn(),
    },
  });
}

describe("PWA cache client", () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  let cacheStore;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://api.test";
    cacheStore = {
      keys: jest.fn(() =>
        Promise.resolve([
          "alfa-pwa-v1-pages",
          "alfa-pwa-v1-publicApi",
          "alfa-pwa-v1-images",
          "alfa-pwa-v1-static",
          "unrelated-cache",
        ]),
      ),
      delete: jest.fn(() => Promise.resolve(true)),
    };
    global.caches = cacheStore;
    setServiceWorkerController({ postMessage: jest.fn() });
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalApiUrl;
    delete global.caches;
  });

  it("posts messages to the active controller", () => {
    const result = postToServiceWorker({ type: "CLEAR_USER_DATA" });
    expect(result).toBe(true);
    expect(
      window.navigator.serviceWorker.controller.postMessage,
    ).toHaveBeenCalledWith({ type: "CLEAR_USER_DATA" });
  });

  it("sends API origins to the service worker", () => {
    configureServiceWorker();
    expect(
      window.navigator.serviceWorker.controller.postMessage,
    ).toHaveBeenCalledWith({
      type: "CONFIGURE",
      apiOrigins: expect.arrayContaining([
        window.location.origin,
        "http://api.test",
      ]),
    });
  });

  it("also configures a separate image CDN origin", () => {
    const originalImageBase = process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL;
    process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL = "https://cdn.test/images";
    try {
      configureServiceWorker();
      expect(
        window.navigator.serviceWorker.controller.postMessage,
      ).toHaveBeenCalledWith({
        type: "CONFIGURE",
        apiOrigins: expect.arrayContaining([
          window.location.origin,
          "http://api.test",
          "https://cdn.test",
        ]),
      });
    } finally {
      if (originalImageBase === undefined) {
        delete process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL;
      } else {
        process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL = originalImageBase;
      }
    }
  });

  it("clears only user-scoped caches", async () => {
    const cleared = await clearUserScopedCaches();
    expect(cleared).toEqual([
      "alfa-pwa-v1-pages",
      "alfa-pwa-v1-publicApi",
    ]);
    expect(cacheStore.delete).toHaveBeenCalledTimes(2);
    expect(cacheStore.delete).not.toHaveBeenCalledWith("alfa-pwa-v1-images");
    expect(cacheStore.delete).not.toHaveBeenCalledWith("unrelated-cache");
  });

  it("invalidates catalog page, API, and image caches after admin mutations", async () => {
    await invalidateCatalogCaches();
    expect(cacheStore.delete).toHaveBeenCalledWith("alfa-pwa-v1-pages");
    expect(cacheStore.delete).toHaveBeenCalledWith("alfa-pwa-v1-publicApi");
    expect(cacheStore.delete).toHaveBeenCalledWith("alfa-pwa-v1-images");
  });

  it("requests persistent storage when supported", async () => {
    Object.defineProperty(window.navigator, "storage", {
      configurable: true,
      value: { persist: jest.fn(() => Promise.resolve(true)) },
    });
    await expect(ensurePersistentStorage()).resolves.toBe(true);
  });

  it("reports whether the app is controlled", () => {
    expect(isAppControlledByServiceWorker()).toBe(true);
    setServiceWorkerController(null);
    expect(isAppControlledByServiceWorker()).toBe(false);
  });
});
