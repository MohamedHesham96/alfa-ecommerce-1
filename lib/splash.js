/**
 * Storefront launch splash screen.
 *
 * The splash is a client-only overlay on the homepage. A tiny boot script runs
 * in <head> before the first paint so returning visitors (within the same
 * browser tab session) never see a flash of the splash, while crawlers and
 * no-JS visitors keep seeing the regular homepage.
 */
export const SPLASH_DURATION_MS = 7000;
export const SPLASH_STORAGE_KEY = "alfa.splash.seen.v1";
export const SPLASH_HTML_ATTR = "data-alfa-splash";

// The "seen" flag lives in sessionStorage, so each browser tab gets the intro
// once. Switch it to localStorage to show it once per browser profile, or
// remove the seen check in SPLASH_BOOT_SCRIPT to show it on every load.

export function markSplashSeen() {
  try {
    window.sessionStorage.setItem(SPLASH_STORAGE_KEY, "1");
  } catch {
    // Private modes can block storage; the splash still works for this page.
  }
}

export const SPLASH_BOOT_SCRIPT = (() => {
  const storageKey = JSON.stringify(SPLASH_STORAGE_KEY);
  const htmlAttr = JSON.stringify(SPLASH_HTML_ATTR);
  const duration = String(SPLASH_DURATION_MS);

  // Keep this script ES5-safe and synchronous. It must finish before first
  // paint so a seen splash never flashes. The click/timeout fallbacks keep the
  // intro usable while the React bundle is still hydrating on slow devices.
  return `(function(){var key=${storageKey},attr=${htmlAttr},duration=${duration};var root=document.documentElement;var onHome=window.location.pathname==="/";var onWelcome=window.location.pathname==="/welcome";var show=false;try{show=!window.sessionStorage.getItem(key)&&onHome;}catch(error){show=onHome;}root.setAttribute(attr,show?"on":"off");if(show){window.__alfaSplashStartedAt=window.performance.now();}if(onWelcome){window.__alfaSplashPageStartedAt=window.performance.now();}function markSeen(){try{window.sessionStorage.setItem(key,"1");}catch(error){}}window.addEventListener("click",function(event){var target=event.target;var trigger=target&&target.closest?target.closest("[data-splash-skip]"):null;if(!trigger||window.__alfaSplashHydrated){return;}markSeen();root.setAttribute(attr,"off");var redirect=trigger.getAttribute("data-splash-redirect");if(redirect){window.location.assign(redirect);}},true);if(show){window.setTimeout(function(){if(window.__alfaSplashHydrated){return;}markSeen();root.setAttribute(attr,"off");},duration);}})();`;
})();
