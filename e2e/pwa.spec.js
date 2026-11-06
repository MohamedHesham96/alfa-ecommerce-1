const fs = require("node:fs");
const path = require("node:path");
const { test, expect, devices } = require("@playwright/test");

const swFile = path.resolve(__dirname, "../public/sw.js");
let originalServiceWorker = null;

test.describe.configure({ mode: "serial" });

async function waitForServiceWorker(page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return;
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 8000);
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        clearTimeout(timer);
        resolve();
      });
    });
  });
  await expect
    .poll(
      () => page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
      { timeout: 20_000 },
    )
    .toBe(true);
}

async function getCachedPagePaths(page) {
  return page.evaluate(async () => {
    const names = await caches.keys();
    const pagesName = names.find((name) => name.endsWith("-pages"));
    if (!pagesName) return [];
    const cache = await caches.open(pagesName);
    const requests = await cache.keys();
    return requests.map((request) => new URL(request.url).pathname);
  });
}

async function getApiCacheUrls(page) {
  return page.evaluate(async () => {
    const names = await caches.keys();
    const apiName = names.find((name) => name.endsWith("-publicApi"));
    if (!apiName) return [];
    const cache = await caches.open(apiName);
    const requests = await cache.keys();
    return requests.map((request) => request.url);
  });
}

test.beforeAll(() => {
  originalServiceWorker = fs.readFileSync(swFile);
});

test.afterAll(() => {
  if (originalServiceWorker) {
    fs.writeFileSync(swFile, originalServiceWorker);
  }
});

test.describe("PWA production behaviour", () => {
  test("serves a valid manifest and registers a root-scoped service worker", async ({
    page,
    request,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForServiceWorker(page);

    const manifestHref = await page
      .locator('link[rel="manifest"]')
      .getAttribute("href");
    expect(manifestHref).toBe("/manifest.webmanifest");

    const manifestResponse = await request.get(
      new URL(manifestHref, "http://localhost:3100").toString(),
    );
    expect(manifestResponse.status()).toBe(200);
    expect(manifestResponse.headers()["content-type"]).toContain(
      "application/manifest+json",
    );
    const manifest = await manifestResponse.json();
    expect(manifest.name).toBe("Alfa E-commerce");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(true);

    for (const icon of manifest.icons) {
      const iconResponse = await request.get(
        new URL(icon.src, "http://localhost:3100").toString(),
      );
      expect(iconResponse.status(), icon.src).toBe(200);
      expect(iconResponse.headers()["content-type"]).toContain("image/png");
    }

    const faviconResponse = await request.get("http://localhost:3100/favicon.ico");
    expect(faviconResponse.status()).toBe(200);
    expect(faviconResponse.headers()["content-type"]).toMatch(/image\//);

    const swResponse = await request.get("http://localhost:3100/sw.js");
    expect(swResponse.status()).toBe(200);
    expect(swResponse.headers()["cache-control"]).toContain("no-store");
    expect(swResponse.headers()["service-worker-allowed"]).toBe("/");

    const registration = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      return {
        scope: reg.scope,
        scriptURL: reg.active ? reg.active.scriptURL : null,
        controlled: Boolean(navigator.serviceWorker.controller),
      };
    });
    expect(registration.controlled).toBe(true);
    expect(new URL(registration.scope).pathname).toBe("/");
    expect(new URL(registration.scriptURL).pathname).toBe("/sw.js");

    const cdp = await page.context().newCDPSession(page);
    const appManifest = await cdp.send("Page.getAppManifest");
    expect(appManifest.errors).toEqual([]);
    const installability = await cdp.send("Page.getInstallabilityErrors");
    expect(installability.installabilityErrors).toEqual([]);
  });

  test("opens previously visited pages offline and recovers cleanly", async ({
    page,
    context,
  }) => {
    await page.goto("/user/about", { waitUntil: "domcontentloaded" });
    await waitForServiceWorker(page);
    await page.goto("/user/about", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#footer")).toBeVisible();

    expect(await getCachedPagePaths(page)).toContain("/user/about");

    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/user\/about$/);
    await expect(page.locator("#footer")).toBeVisible();
    await expect(page.getByTestId("offline-banner")).toBeVisible();
    await expect(page.getByTestId("offline-banner")).toContainText(
      /غير متصل|offline/i,
    );

    await context.setOffline(false);
    await expect(page.getByTestId("offline-banner")).toContainText(
      /استعادة|Back online/i,
      { timeout: 20_000 },
    );
    await expect(page.getByTestId("offline-banner")).toBeHidden({
      timeout: 20_000,
    });
  });

  test("navigates between cached pages through in-app links while offline", async ({
    page,
    context,
  }) => {
    await page.goto("/user/about", { waitUntil: "domcontentloaded" });
    await waitForServiceWorker(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);
    await page.goto("/user/about", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    expect(await getCachedPagePaths(page)).toContain("/");

    await context.setOffline(true);
    await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('a[href="/"]'))[0];
      if (!link) throw new Error("cached home link is missing");
      link.click();
    });

    await page.waitForURL("http://localhost:3100/", { timeout: 20_000 });
    await expect(page.getByTestId("offline-banner")).toBeVisible();
    await expect(page.locator("body")).toContainText("ألفا جروب تكنولوجي");

    await context.setOffline(false);
  });

  test("never caches private user or admin pages", async ({ page, context }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForServiceWorker(page);

    await page.goto("/user/cart", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await page.goto("/admin/Dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const cachedPaths = await getCachedPagePaths(page);
    expect(cachedPaths).not.toContain("/user/cart");
    expect(cachedPaths).not.toContain("/admin/Dashboard");

    await context.setOffline(true);
    await page.goto("/user/cart", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "أنت غير متصل بالإنترنت" }),
    ).toBeVisible();
    await expect(page.locator("#footer")).toHaveCount(0);
  });

  test("caches public API data but keeps auth and transactions network-only", async ({
    page,
    context,
    request,
  }) => {
    await page.goto("/user/about", { waitUntil: "domcontentloaded" });
    await waitForServiceWorker(page);
    await page.goto("/user/about", { waitUntil: "domcontentloaded" });

    const publicResult = await page.evaluate(async () => {
      // The application uses axios, whose browser adapter is XHR. Verify the
      // service worker intercepts that path too (not just fetch()).
      const response = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "http://localhost:8787/api/public/contact");
        xhr.setRequestHeader("Accept-Language", "ar");
        xhr.onload = () =>
          resolve({
            status: xhr.status,
            body: JSON.parse(xhr.responseText),
          });
        xhr.onerror = () => reject(new Error("XHR failed"));
        xhr.send();
      });
      return { ok: response.status === 200, body: response.body };
    });
    expect(publicResult.ok).toBe(true);
    expect(publicResult.body.data.whatsappURL).toContain("wa.me");

    const cachedUrls = await getApiCacheUrls(page);
    expect(
      cachedUrls.some(
        (url) =>
          url.includes("/api/public/contact") &&
          url.includes("__alfa_lang=ar"),
      ),
    ).toBe(true);

    await context.setOffline(true);
    const offlineResult = await page.evaluate(async () => {
      const response = await fetch("http://localhost:8787/api/public/contact", {
        headers: { "Accept-Language": "ar" },
      });
      return { ok: response.ok, body: await response.json() };
    });
    expect(offlineResult.ok).toBe(true);
    expect(offlineResult.body.data.whatsappURL).toContain("wa.me");
    await context.setOffline(false);

    // Requests carrying credentials must bypass Cache Storage.
    await page.evaluate(async () => {
      await fetch("http://localhost:8787/api/public/offers", {
        headers: {
          Accept: "application/json",
          "Accept-Language": "ar",
          Authorization: "Bearer e2e-secret",
        },
      });
      await fetch("http://localhost:8787/api/users", {
        headers: {
          Accept: "application/json",
          "Accept-Language": "ar",
          Authorization: "Bearer e2e-secret",
        },
      });
      await fetch("http://localhost:8787/api/shopCarts/addLine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": "ar",
          Authorization: "Bearer e2e-secret",
        },
        body: JSON.stringify({ itemId: 1, quantity: 1 }),
      });
    });

    const afterPrivateUrls = await getApiCacheUrls(page);
    expect(afterPrivateUrls.some((url) => url.includes("/api/public/offers"))).toBe(
      false,
    );
    expect(afterPrivateUrls.some((url) => url.includes("/api/users"))).toBe(
      false,
    );
    expect(
      afterPrivateUrls.some((url) => url.includes("/api/shopCarts")),
    ).toBe(false);

    const before = await request.get("http://localhost:8787/__test/stats");
    const beforeStats = await before.json();
    await context.setOffline(true);
    const orderResult = await page.evaluate(async () => {
      try {
        await fetch("http://localhost:8787/api/users/orders/place-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer e2e-secret",
          },
          body: JSON.stringify({ paymentMethod: "CASH_ON_DELIVERY" }),
        });
        return "unexpected-success";
      } catch {
        return "failed";
      }
    });
    expect(orderResult).toBe("failed");
    await context.setOffline(false);
    const after = await request.get("http://localhost:8787/__test/stats");
    const afterStats = await after.json();
    expect(afterStats.orders).toBe(beforeStats.orders);
  });

  test("detects a new service worker and updates on user confirmation", async ({
    page,
  }) => {
    await page.goto("/user/about", { waitUntil: "domcontentloaded" });
    await waitForServiceWorker(page);
    await page.goto("/user/about", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const oldCaches = await page.evaluate(() => caches.keys());
    expect(oldCaches.some((name) => name.startsWith("alfa-pwa-"))).toBe(true);

    const nextVersion = `e2e-${Date.now()}`;
    const updatedWorker = `${originalServiceWorker
      .toString("utf8")
      .replace(
        /const SW_VERSION = "[^"]+";/,
        `const SW_VERSION = "${nextVersion}";`,
      )}\n// e2e update ${Date.now()}\n`;
    fs.writeFileSync(swFile, updatedWorker);

    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration.update();
    });

    const updateBanner = page.getByTestId("update-banner");
    await expect(updateBanner).toBeVisible({ timeout: 30_000 });
    await expect(updateBanner).toContainText(/إصدار جديد|new app version/i);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => {}),
      updateBanner.getByRole("button", { name: /تحديث الآن|Update now/i }).click(),
    ]);

    await expect(page.getByTestId("update-banner")).toBeHidden({
      timeout: 30_000,
    });

    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect
      .poll(
        () => page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
        { timeout: 20_000 },
      )
      .toBe(true);

    const newCaches = await page.evaluate(() => caches.keys());
    expect(newCaches.some((name) => name.includes(nextVersion))).toBe(true);
    for (const oldCache of oldCaches) {
      if (oldCache.startsWith("alfa-pwa-")) {
        expect(newCaches).not.toContain(oldCache);
      }
    }

    fs.writeFileSync(swFile, originalServiceWorker);
  });

  test("blocks update activation while another tab holds a checkout lock", async ({
    context,
  }) => {
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    await pageA.goto("/user/about", { waitUntil: "domcontentloaded" });
    await waitForServiceWorker(pageA);
    await pageB.goto("/user/about", { waitUntil: "domcontentloaded" });
    await waitForServiceWorker(pageB);

    const nextVersion = `e2e-cross-tab-${Date.now()}`;
    const updatedWorker = `${originalServiceWorker
      .toString("utf8")
      .replace(
        /const SW_VERSION = "[^"]+";/,
        `const SW_VERSION = "${nextVersion}";`,
      )}\n// e2e cross-tab update ${Date.now()}\n`;
    fs.writeFileSync(swFile, updatedWorker);

    await pageA.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration.update();
    });

    const updateBanner = pageA.getByTestId("update-banner");
    await expect(updateBanner).toBeVisible({ timeout: 30_000 });
    const updateButton = updateBanner.getByRole("button", {
      name: /تحديث الآن|Update now/i,
    });

    // Hold the same shared lock a real checkout holds. Do this immediately
    // before the click so the UI has not had time to disable the button yet.
    await pageB.evaluate(async () => {
      const held = new Promise((resolve) => {
        window.__releaseCheckoutLock = resolve;
      });
      navigator.locks.request(
        "alfa-pwa-checkout",
        { mode: "shared" },
        () => held,
      );

      const deadline = Date.now() + 5000;
      while (Date.now() < deadline) {
        const snapshot = await navigator.locks.query();
        if (
          snapshot.held.some(
            (lock) =>
              lock.name === "alfa-pwa-checkout" && lock.mode === "shared",
          )
        ) {
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      throw new Error("shared checkout lock was not acquired");
    });

    await updateButton.click();
    await expect(updateBanner).toBeVisible();
    await expect(updateButton).toBeDisabled({ timeout: 8000 });

    await pageB.evaluate(() => {
      window.__releaseCheckoutLock?.();
    });

    await expect(updateButton).toBeEnabled({ timeout: 15_000 });
    await Promise.all([
      pageA.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => {}),
      updateButton.click(),
    ]);
    await expect(pageA.getByTestId("update-banner")).toBeHidden({
      timeout: 30_000,
    });

    await expect(pageB.getByTestId("update-banner")).toContainText(
      /تم تثبيت|installed/i,
      { timeout: 20_000 },
    );

    fs.writeFileSync(swFile, originalServiceWorker);
    await pageA.close();
    await pageB.close();
  });

  test("serves dynamic App Router pages after async params migration", async ({
    page,
    request,
  }) => {
    const routes = [
      "/products?page=2",
      "/products/e2e-product",
      "/categories/electronics",
      "/user/products/section/morerecommendedproducts",
      "/user/search/laptop",
      "/admin/orders/OrdersDetails/1",
      "/admin/UsersPage/UserInfo/1",
      "/user/orderdetails/1",
      "/user/returnorderdetails/1",
      "/user/productdetails/legacy/1",
      "/user/products/category/all/1",
    ];

    for (const route of routes) {
      const response = await page.goto(route, {
        waitUntil: "domcontentloaded",
      });
      expect(response, route).not.toBeNull();
      expect([200, 404], route).toContain(response.status());
      await expect(page.locator("body"), route).not.toContainText(
        /Application error|Internal Server Error/i,
      );
    }

    const legacyProduct = await request.get(
      "http://localhost:3100/user/productdetails/legacy/1",
      { maxRedirects: 0 },
    );
    expect([301, 302, 307, 308]).toContain(legacyProduct.status());
    expect(legacyProduct.headers().location).toContain("/products/e2e-product");

    const legacyCategory = await request.get(
      "http://localhost:3100/user/products/category/all/1",
      { maxRedirects: 0 },
    );
    expect([301, 302, 307, 308]).toContain(legacyCategory.status());
    expect(legacyCategory.headers().location).toContain("/products");
  });

  test("clears page/API caches during logout", async ({ page }) => {
    await page.goto("/user/about", { waitUntil: "domcontentloaded" });
    await waitForServiceWorker(page);
    await page.goto("/user/about", { waitUntil: "domcontentloaded" });
    expect(await getCachedPagePaths(page)).toContain("/user/about");

    await page.evaluate(() => {
      localStorage.setItem("id", "1");
      localStorage.setItem("accessToken", "e2e-token");
      localStorage.setItem("refreshToken", "e2e-refresh");
      localStorage.setItem("role", "USER");
      localStorage.setItem("firstName", "E2E");
      localStorage.setItem("lang", "ar");
    });

    await page.goto("/user/profile", { waitUntil: "domcontentloaded" });
    await page.getByText("تسجيل الخروج").first().click();
    await expect(page).toHaveURL("http://localhost:3100/", {
      timeout: 30_000,
    });

    const cachedPaths = await getCachedPagePaths(page);
    expect(cachedPaths).not.toContain("/user/about");
    expect(cachedPaths).not.toContain("/user/profile");
    const session = await page.evaluate(() => ({
      id: localStorage.getItem("id"),
      accessToken: localStorage.getItem("accessToken"),
      refreshToken: localStorage.getItem("refreshToken"),
    }));
    expect(session.id).toBe("");
    expect(session.accessToken).toBe("");
    expect(session.refreshToken).toBe("");
  });
});

test.describe("custom install entry", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("exposes the install dialog when the browser is installable", async ({
    page,
  }) => {
    await page.goto("/user/about", { waitUntil: "domcontentloaded" });

    await page.evaluate(() => {
      const event = new Event("beforeinstallprompt");
      event.prompt = () => Promise.resolve();
      event.userChoice = Promise.resolve({ outcome: "dismissed" });
      window.__alfaDeferredInstallPrompt = event;
      window.dispatchEvent(new Event("alfa:beforeinstallprompt"));
    });

    await page.getByRole("button", { name: "فتح القائمة" }).click();
    await page.getByTestId("menu-tab-menu").click();
    await expect(page.getByTestId("install-menu-entry")).toBeVisible();
    await page.getByTestId("install-menu-entry").click();

    const dialog = page.getByTestId("install-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("ثبّت تطبيق ألفا");
    await expect(dialog).toContainText("تثبيت الآن");
  });
});

const iphone13 = { ...devices["iPhone 13"] };
delete iphone13.defaultBrowserType;

test.describe("iOS install guidance", () => {
  test.use(iphone13);

  test("offers Safari Add to Home Screen instructions", async ({ page }) => {
    await page.addInitScript(() => {
      window.addEventListener(
        "beforeinstallprompt",
        (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
        },
        true,
      );
    });

    await page.goto("/user/about", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "فتح القائمة" }).click();
    await page.getByTestId("menu-tab-menu").click();

    const installEntry = page.getByTestId("install-menu-entry");
    await expect(installEntry).toBeVisible({ timeout: 10_000 });
    await installEntry.click();

    const dialog = page.getByTestId("install-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("أضف ألفا إلى الشاشة الرئيسية");
    await expect(dialog).toContainText("إضافة إلى الشاشة الرئيسية");
  });
});
