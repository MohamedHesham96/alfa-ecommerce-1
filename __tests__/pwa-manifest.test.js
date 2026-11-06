import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");

function readPngSize(file) {
  const buffer = fs.readFileSync(file);
  const signature = buffer.subarray(0, 8).toString("hex");
  expect(signature).toBe("89504e470d0a1a0a");
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

describe("PWA manifest and static assets", () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "public/manifest.webmanifest"), "utf8"),
  );

  it("declares the installable app identity and display mode", () => {
    expect(manifest).toMatchObject({
      name: "Alfa E-commerce",
      short_name: "Alfa",
      start_url: "/",
      scope: "/",
      display: "standalone",
      theme_color: "#0d0625",
      background_color: "#f6f5f8",
    });
    expect(manifest.description).toBeTruthy();
    expect(manifest.orientation).toBe("any");
    expect(manifest.icons.length).toBeGreaterThanOrEqual(4);
    expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(2);
  });

  it("ships 192px, 512px, and maskable icons with correct dimensions", () => {
    const bySrc = new Map(manifest.icons.map((icon) => [icon.src, icon]));
    expect(bySrc.has("/icons/icon-192.png")).toBe(true);
    expect(bySrc.has("/icons/icon-512.png")).toBe(true);
    expect(bySrc.has("/icons/icon-192-maskable.png")).toBe(true);
    expect(bySrc.has("/icons/icon-512-maskable.png")).toBe(true);

    const expected = {
      "/icons/icon-192.png": 192,
      "/icons/icon-512.png": 512,
      "/icons/icon-192-maskable.png": 192,
      "/icons/icon-512-maskable.png": 512,
      "/icons/apple-touch-icon.png": 180,
    };

    for (const [src, size] of Object.entries(expected)) {
      const file = path.join(root, "public", src.replace(/^\//, ""));
      expect(fs.existsSync(file)).toBe(true);
      expect(readPngSize(file)).toEqual({ width: size, height: size });
    }

    const maskable = manifest.icons.filter((icon) =>
      String(icon.purpose).includes("maskable"),
    );
    expect(maskable.length).toBeGreaterThanOrEqual(2);
  });

  it("links the manifest and Apple metadata from the root layout", () => {
    const layout = fs.readFileSync(path.join(root, "app/layout.js"), "utf8");
    expect(layout).toContain('manifest: "/manifest.webmanifest"');
    expect(layout).toContain('appleWebApp');
    expect(layout).toContain("apple-touch-startup-image");
    expect(layout).toContain("viewportFit: \"cover\"");
    expect(layout).toContain("PwaProvider");
    expect(layout).toContain("beforeinstallprompt");
  });

  it("ships every iOS splash image referenced by the layout", () => {
    const layout = fs.readFileSync(path.join(root, "app/layout.js"), "utf8");
    const splashFiles = Array.from(
      layout.matchAll(/apple-splash-(\d+)x(\d+)\.png/g),
      (match) => ({
        file: match[0],
        width: Number(match[1]),
        height: Number(match[2]),
      }),
    );
    const unique = new Set(splashFiles.map((entry) => entry.file));

    expect(unique.size).toBeGreaterThanOrEqual(10);
    for (const entry of splashFiles) {
      const file = path.join(root, "public/splash", entry.file);
      expect(fs.existsSync(file)).toBe(true);
      expect(readPngSize(file)).toEqual({
        width: entry.width,
        height: entry.height,
      });
    }
  });

  it("ships a branded favicon and precaches it for offline launches", () => {
    expect(fs.existsSync(path.join(root, "app/favicon.ico"))).toBe(true);
    const sw = fs.readFileSync(path.join(root, "public/sw.js"), "utf8");
    expect(sw).toContain('"/favicon.ico"');
  });

  it("generates a versioned service worker with offline and invalidation support", () => {
    const sw = fs.readFileSync(path.join(root, "public/sw.js"), "utf8");
    expect(sw).not.toContain("__SW_VERSION__");
    expect(sw).not.toContain("__PRECACHE_URLS__");
    expect(sw).not.toContain("__API_ORIGINS__");
    expect(sw).toMatch(/const SW_VERSION = "[a-zA-Z0-9._-]+";/);
    expect(sw).toContain('"/offline.html"');
    expect(sw).toContain("SKIP_WAITING");
    expect(sw).toContain("CLEAR_USER_DATA");
    expect(sw).toContain("INVALIDATE_CATALOG");
    expect(sw).toContain("navigationPreload");
    expect(sw).toContain("isCacheablePublicPageResponse");
  });

  it("ships a self-contained offline fallback", () => {
    const offline = fs.readFileSync(
      path.join(root, "public/offline.html"),
      "utf8",
    );
    expect(offline).toContain("أنت غير متصل بالإنترنت");
    expect(offline).toContain("/icons/icon-192.png");
    expect(offline).toContain("navigator.onLine");
    expect(offline).toContain("retry");
  });

  it("configures service-worker and manifest response headers", () => {
    const config = fs.readFileSync(path.join(root, "next.config.mjs"), "utf8");
    expect(config).toContain("Service-Worker-Allowed");
    expect(config).toContain("application/manifest+json");
    expect(config).toContain("no-cache, no-store, must-revalidate");
  });
});
