# Alfa PWA — Production Deployment Checklist

This checklist is specific to the existing Alfa frontend/backend deployment
split. Do not deploy or change the live server as part of a code review.

## 1. Preconditions

- [ ] Production canonical host is `https://alfagrouptech.com` (without `www`;
      `proxy.js` redirects `www` to the canonical host).
- [ ] Node.js **20.9+** is installed in the build environment (Next.js 16
      requirement).
- [ ] HTTPS is terminated before the frontend (service workers require a
      secure context).
- [ ] The API and image origins are known and reachable over HTTPS.
- [ ] The current frontend build has passed local verification:
      `npm ci`, `npm run build`, `npm run pwa:check`, `npm test`,
      PWA Playwright, and the existing Playwright suite.
- [ ] No production server files are edited manually.

## 2. Production environment variables

Set these in the deployment environment before `npm run build`:

```bash
NEXT_PUBLIC_SITE_URL=https://alfagrouptech.com
NEXT_PUBLIC_API_BASE_URL=https://<production-api-host>
NEXT_PUBLIC_API_IMAGE_BASE_URL=https://<production-api-host>/images
# Optional; must not be true in production:
# NEXT_PUBLIC_ENABLE_PWA_DEV=false
# Only for an intentional private-network image host. Never enable for public production:
# NEXT_PUBLIC_ALLOW_LOCAL_IMAGE_IP=false
# Only for local/e2e builds. The SW generator refuses localhost origins otherwise:
# PWA_ALLOW_LOCAL_ORIGINS=false
# Optional only when a release process needs a fixed cache version:
# PWA_CACHE_VERSION=<release-id>
```

Important:

- The PWA service worker injects the API origin at **build time**. If
  `NEXT_PUBLIC_API_BASE_URL` is missing, cross-origin public API responses will
  not be cached (safe, but the offline catalog will be less useful).
- Do not deploy a `public/sw.js` generated with `.env.local` (for example,
  containing `http://localhost:8787`).
- Ensure the image host is included in `next.config.mjs` `images.remotePatterns`
  and matches the actual production media host.

## 3. Build

```bash
npm ci
npm run build
npm run pwa:check
```

Expected checks:

- [ ] `npm ci` completes from `package-lock.json` without modifying it.
- [ ] `npm run build` succeeds.
- [ ] `npm run pwa:check` reports the generated service worker is up to date.
- [ ] `public/sw.js` contains the production API origin, not localhost.
- [ ] `public/sw.js` contains `const IS_DEV = false;`.
- [ ] The generated SW version changed relative to the previous deployment.

`public/sw.js` is a generated, git-ignored build artifact. It is written by
`prebuild` and must be produced as part of the deployment build; never commit or
copy a locally generated copy into a production artifact. The generator refuses
to create a non-dev SW containing localhost/private origins unless
`PWA_ALLOW_LOCAL_ORIGINS=true` is explicitly set for a local/e2e build.

## 4. Deploy artifact contents

- [ ] `.next/` from the production build.
- [ ] `public/` including `sw.js`, `sw-policies.js`, `manifest.webmanifest`,
      `offline.html`, `icons/`, `splash/`.
- [ ] `package.json` / `package-lock.json` matching the build.
- [ ] No `.env.local` or local-only secrets in the deployed artifact.

Use `npm run start` (or the existing process manager) with the production
environment. Do not serve the repository working tree directly.

## 5. CDN and cache rules

Purge/invalidate these paths at the CDN edge when deploying:

- `/sw.js`
- `/sw-policies.js`
- `/manifest.webmanifest`
- `/offline.html`
- `/favicon.ico` if the branded icon changed

Requirements:

- [ ] `/sw.js` must not be cached at the edge. The Next.js headers are:
      `Cache-Control: no-cache, no-store, must-revalidate`.
- [ ] `/sw.js` must preserve `Service-Worker-Allowed: /`.
- [ ] `/sw-policies.js` must revalidate.
- [ ] `/manifest.webmanifest` must be served as
      `application/manifest+json`.
- [ ] Do not rewrite or strip the service-worker headers in the proxy/CDN.
- [ ] If a CDN caches HTML, ensure it respects the app's no-store/private
      headers for private routes.

## 6. Post-deploy header verification

Run from a machine with production network access:

```bash
curl -sSI https://alfagrouptech.com/sw.js
curl -sSI https://alfagrouptech.com/sw-policies.js
curl -sSI https://alfagrouptech.com/manifest.webmanifest
curl -sSI https://alfagrouptech.com/offline.html
curl -sSI https://alfagrouptech.com/icons/icon-192.png
```

Check:

- [ ] `/sw.js`: status 200, JavaScript content type, `no-store`, root
      `Service-Worker-Allowed`.
- [ ] `/manifest.webmanifest`: status 200 and manifest content type.
- [ ] `/offline.html`: status 200 and revalidation cache headers.
- [ ] Icons and splash images return 200 with image content types.
- [ ] The HTML includes `rel="manifest"`, Apple web-app metadata, theme color,
      and the expected viewport settings.

## 7. Functional smoke test (desktop)

- [ ] Open `https://alfagrouptech.com/` and confirm the service worker is
      activated in DevTools → Application → Service Workers.
- [ ] Confirm service worker scope is `/` and script URL is `/sw.js`.
- [ ] Visit a public product/category page, go offline, and reload it; the
      cached page or the offline fallback must appear.
- [ ] Reconnect and confirm the offline banner clears / the app recovers.
- [ ] Confirm a private page (cart/profile/admin) is not served from cache
      offline.
- [ ] Log in, log out, and verify account fields are cleared and the cached
      public page/API data is invalidated.
- [ ] Place a test order online and confirm it is not attempted offline and is
      never shown as confirmed without a server response.
- [ ] When a new build is deployed, confirm the update prompt appears and that
      accepting it reloads into the new version.
- [ ] With two tabs open, start a checkout in one tab and confirm the update
      button is blocked/disabled in the other tab until the checkout completes.
- [ ] Close the checkout tab without completing it and confirm the update is
      available after the lease expires or the browser releases the Web Lock.

## 8. Real-device checklist

### Android Chrome

- [ ] Open over HTTPS and confirm the custom install prompt/dialog appears.
- [ ] Install to the home screen and launch in standalone mode.
- [ ] Complete an online checkout and verify the service worker does not
      interfere with the authenticated request.
- [ ] Go offline and verify cached pages / offline fallback and recovery.
- [ ] Trigger a deployment update and verify the prompt and activation.

### iOS Safari

- [ ] Open over HTTPS and confirm the “Add to Home Screen” guidance appears.
- [ ] Add to Home Screen; confirm the icon and launch image.
- [ ] Launch standalone and verify safe-area layout.
- [ ] Go offline and verify cached pages / offline fallback.
- [ ] Reconnect and verify recovery.
- [ ] Trigger a deployment update and verify the update prompt/refresh path.

## 9. Rollback

- [ ] Keep the previous production build artifact available.
- [ ] If a release is faulty, restore the previous artifact and purge
      `/sw.js`, `/sw-policies.js`, and the manifest.
- [ ] Remember that service worker activation is user-approved; tabs that have
      not reloaded may continue using the previous worker until they refresh.

## 10. Dependency security status

- **Framework:** Next.js **16.4.5** with React **19.3.1** and React DOM
  **19.3.1**.
- Axios is a direct dependency pinned to a patched 1.x release; the unused
  `react-axios` wrapper (which pulled axios 0.27.x) was removed.
- Swiper was moved to the patched 12.2.x line.
- `postcss` and safe transitive dev dependencies were updated with
  `npm audit fix`.
- `npm audit --omit=dev` reports **0 production vulnerabilities**.
- `npm audit` may still report dev/tooling-only low/moderate findings
  (for example Jest/ESLint transitive packages); these are not shipped in
  the browser bundle and do not affect the production runtime.
- Node.js **20.9+** is required by Next.js 16.
- `next lint` was removed in Next.js 16; linting runs through the ESLint CLI
  with `eslint.config.mjs` (flat config).
- `middleware.js` was migrated to the Next.js 16 `proxy.js` convention.
  The proxy runs on the Node.js runtime and preserves the existing redirect
  behavior.


## 11. Known limitations to communicate

- Browsers without Web Locks use expiring localStorage leases for cross-tab
  coordination; the fallback has a sub-second race window, but abandoned locks
  expire after 30 seconds.
- Real Safari/Android hardware behavior must be checked on devices; Playwright
  uses Chromium device emulation for the iOS guidance test.
- The homepage has an existing layout-shift/performance issue unrelated to the
  PWA layer; address it separately if performance is a release gate.
