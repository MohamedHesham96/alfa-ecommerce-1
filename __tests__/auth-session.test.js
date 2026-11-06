jest.mock("../lib/pwa/client", () => ({
  clearUserScopedCaches: jest.fn(() => Promise.resolve([])),
}));

import { clearUserScopedCaches } from "../lib/pwa/client";
import { AUTH_STORAGE_KEYS, clearAuthStorage } from "../utils/authSession";

describe("shared auth session cleanup", () => {
  beforeEach(() => {
    localStorage.clear();
    clearUserScopedCaches.mockClear();
  });

  it("removes every account field and clears PWA user-scoped caches", async () => {
    AUTH_STORAGE_KEYS.forEach((key) => localStorage.setItem(key, `value-${key}`));
    localStorage.setItem("lang", "ar");

    await clearAuthStorage();

    expect(localStorage.getItem("lang")).toBe("ar");
    AUTH_STORAGE_KEYS.forEach((key) => {
      expect(localStorage.getItem(key)).toBeNull();
    });
    expect(clearUserScopedCaches).toHaveBeenCalledTimes(1);
  });

  it("resolves even when cache clearing fails", async () => {
    clearUserScopedCaches.mockRejectedValueOnce(new Error("cache unavailable"));
    await expect(clearAuthStorage()).resolves.toBeUndefined();
  });
});
