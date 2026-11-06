jest.mock("../lib/pwa/constants", () => ({
  ...jest.requireActual("../lib/pwa/constants"),
  isPwaEnabled: false,
}));

import {
  clearUserScopedCaches,
  configureServiceWorker,
  ensurePersistentStorage,
  invalidateCatalogCaches,
  isAppControlledByServiceWorker,
  postToServiceWorker,
} from "../lib/pwa/client";

describe("PWA cache client while the kill switch is off", () => {
  const postMessage = jest.fn();
  const persist = jest.fn(() => Promise.resolve(true));
  let cacheStore;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheStore = {
      keys: jest.fn(() => Promise.resolve(["alfa-pwa-v1-pages"])),
      delete: jest.fn(() => Promise.resolve(true)),
    };
    global.caches = cacheStore;
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        controller: { postMessage },
        ready: Promise.resolve({}),
        addEventListener: jest.fn(),
        getRegistrations: jest.fn(() => Promise.resolve([])),
      },
    });
    Object.defineProperty(window.navigator, "storage", {
      configurable: true,
      value: { persist },
    });
  });

  afterAll(() => {
    delete global.caches;
  });

  it("does not send messages to a service worker", () => {
    expect(postToServiceWorker({ type: "CLEAR_USER_DATA" })).toBe(false);
    expect(configureServiceWorker()).toBe(false);
    expect(postMessage).not.toHaveBeenCalled();
  });

  it("does not delete existing Cache Storage entries", async () => {
    await expect(clearUserScopedCaches()).resolves.toEqual([]);
    await expect(invalidateCatalogCaches()).resolves.toEqual([]);
    expect(cacheStore.keys).not.toHaveBeenCalled();
    expect(cacheStore.delete).not.toHaveBeenCalled();
  });

  it("does not request persistent storage or report a controlled app", async () => {
    await expect(ensurePersistentStorage()).resolves.toBe(false);
    expect(persist).not.toHaveBeenCalled();
    expect(isAppControlledByServiceWorker()).toBe(false);
  });
});
