/**
 * First-party storefront analytics client.
 *
 * The visitor identity is a random UUID kept in localStorage. The session id
 * is kept alongside the last recorded activity and is rotated after 30 minutes
 * of inactivity. Nothing here requires authentication; when an access token is
 * present it is sent with the batch so the backend can associate the existing
 * anonymous session with the account.
 *
 * All failures are swallowed: analytics must never affect shopping,
 * navigation, authentication or checkout.
 */

const VISITOR_KEY = "alfa_analytics_visitor_id";
const SESSION_KEY = "alfa_analytics_session";
const ATTRIBUTION_KEY = "alfa_analytics_attribution";
const ATTRIBUTION_SENT_KEY = "alfa_analytics_attribution_sent";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_THROTTLE_MS = 30 * 1000;
const FLUSH_DELAY_MS = 1200;
const FLUSH_RETRY_MS = 15000;
const MAX_BATCH_SIZE = 20;
const MAX_QUEUE_SIZE = 100;
const RECENT_EVENT_WINDOW_MS = 1000;
const RECENT_ENGAGEMENT_WINDOW_MS = 2000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const memoryStorage = new Map();
const recentEvents = new Map();

let queue = [];
let flushTimer = null;
let sending = false;
let listening = false;
let enabled = true;
let attribution = null;
let attributionSent = false;
let lastActivitySentAt = 0;
let lastInteractionHandledAt = 0;
let stopListeners = null;

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function readStorage(storage, key) {
  if (!isBrowser()) return memoryStorage.get(key) ?? null;
  try {
    const value = storage === "session" ? window.sessionStorage : window.localStorage;
    return value.getItem(key);
  } catch {
    return memoryStorage.get(key) ?? null;
  }
}

function writeStorage(storage, key, value) {
  memoryStorage.set(key, value);
  if (!isBrowser()) return;
  try {
    const target = storage === "session" ? window.sessionStorage : window.localStorage;
    target.setItem(key, value);
  } catch {
    // Storage can be disabled by privacy settings; the in-memory fallback keeps
    // the current page working without breaking the storefront.
  }
}

function removeStorage(storage, key) {
  memoryStorage.delete(key);
  if (!isBrowser()) return;
  try {
    const target = storage === "session" ? window.sessionStorage : window.localStorage;
    target.removeItem(key);
  } catch {
    // Ignore unavailable storage.
  }
}

export function createUuid() {
  const cryptoApi = typeof globalThis !== "undefined" ? globalThis.crypto : null;
  if (cryptoApi?.randomUUID) {
    try {
      return cryptoApi.randomUUID();
    } catch {
      // Fall through to the byte-based generator.
    }
  }
  if (cryptoApi?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function getVisitorId() {
  const stored = readStorage("local", VISITOR_KEY);
  if (isUuid(stored)) return stored;
  const created = createUuid();
  writeStorage("local", VISITOR_KEY, created);
  return created;
}

function readSession() {
  const raw = readStorage("local", SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!isUuid(parsed?.id) || !Number.isFinite(parsed?.lastActivityAt)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(session) {
  writeStorage("local", SESSION_KEY, JSON.stringify(session));
}

function ensureSession() {
  const now = Date.now();
  const current = readSession();
  if (
    !current ||
    now - current.lastActivityAt > SESSION_TIMEOUT_MS ||
    current.lastActivityAt > now + SESSION_TIMEOUT_MS
  ) {
    const created = { id: createUuid(), lastActivityAt: now };
    writeSession(created);
    return { id: created.id, created: true };
  }
  const touched = { id: current.id, lastActivityAt: now };
  writeSession(touched);
  return { id: touched.id, created: false };
}

function adoptServerSession(sessionId) {
  if (!isUuid(sessionId)) return;
  writeSession({ id: sessionId, lastActivityAt: Date.now() });
}

function currentUtm() {
  if (!isBrowser()) return {};
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get("utm_source") || undefined,
      utmMedium: params.get("utm_medium") || undefined,
      utmCampaign: params.get("utm_campaign") || undefined,
      utmContent: params.get("utm_content") || undefined,
      utmTerm: params.get("utm_term") || undefined,
    };
  } catch {
    return {};
  }
}

function hasUtm(utm) {
  return Boolean(
    utm.utmSource ||
      utm.utmMedium ||
      utm.utmCampaign ||
      utm.utmContent ||
      utm.utmTerm,
  );
}

function isExternalReferrer(referrer) {
  if (!referrer || !isBrowser()) return false;
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    const own = window.location.hostname.toLowerCase();
    return Boolean(host) && host !== own && !host.endsWith(`.${own}`);
  } catch {
    return false;
  }
}

function truncate(value, max) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length <= max ? trimmed : trimmed.slice(0, max);
}

function captureAttribution() {
  if (!isBrowser()) return null;
  const utm = currentUtm();
  const referrer = truncate(document.referrer || "", 2048);
  const storedRaw = readStorage("session", ATTRIBUTION_KEY);

  if (storedRaw && !hasUtm(utm) && !isExternalReferrer(referrer)) {
    try {
      return JSON.parse(storedRaw);
    } catch {
      // Rebuild below.
    }
  }

  const captured = {
    referrer,
    utmSource: truncate(utm.utmSource, 200),
    utmMedium: truncate(utm.utmMedium, 200),
    utmCampaign: truncate(utm.utmCampaign, 200),
    utmContent: truncate(utm.utmContent, 200),
    utmTerm: truncate(utm.utmTerm, 200),
  };
  writeStorage("session", ATTRIBUTION_KEY, JSON.stringify(captured));
  // A fresh external landing or campaign starts a new attribution; it must be
  // allowed to reach the backend even if an earlier session in this tab was
  // already attributed.
  removeStorage("session", ATTRIBUTION_SENT_KEY);
  attributionSent = false;
  return captured;
}

function getAttribution() {
  if (attribution === null && isBrowser()) {
    attribution = captureAttribution() || {};
  }
  return attribution;
}

function attributionWasSent() {
  if (attributionSent) return true;
  return readStorage("session", ATTRIBUTION_SENT_KEY) === "true";
}

function markAttributionSent() {
  attributionSent = true;
  writeStorage("session", ATTRIBUTION_SENT_KEY, "true");
}

export function isAnalyticsTrackablePath(path) {
  if (typeof path !== "string" || !path.startsWith("/")) return false;
  const lower = path.toLowerCase();
  return !["/admin", "/api", "/images", "/_next", "/__"].some((prefix) =>
    lower.startsWith(prefix),
  );
}

function recentlyTracked(key, windowMs) {
  const now = Date.now();
  const last = recentEvents.get(key);
  if (last && now - last < windowMs) return true;
  recentEvents.set(key, now);
  if (recentEvents.size > 250) {
    for (const [entryKey, timestamp] of recentEvents) {
      if (now - timestamp > windowMs) recentEvents.delete(entryKey);
    }
  }
  return false;
}

function pushEvent(type, fields = {}) {
  queue.push({
    eventId: createUuid(),
    type,
    ...fields,
  });
  if (queue.length > MAX_QUEUE_SIZE) {
    queue = queue.slice(-MAX_QUEUE_SIZE);
  }
}

function scheduleFlush(delay = FLUSH_DELAY_MS) {
  if (!isBrowser() || flushTimer) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flushAnalytics();
  }, delay);
}

function sendWithSession(type, fields = {}) {
  if (!isBrowser() || !enabled) return;
  // Route effects run immediately after paint; this guard also covers the
  // brief moment before the provider disables tracking on an admin route.
  if (!isAnalyticsTrackablePath(window.location.pathname)) return;
  const session = ensureSession();
  if (session.created) {
    pushEvent("SESSION_START");
  }
  pushEvent(type, fields);
  lastActivitySentAt = Date.now();
  scheduleFlush();
}

export function trackPageView(pathname) {
  if (!isAnalyticsTrackablePath(pathname)) return;
  if (recentlyTracked(`page:${pathname}`, RECENT_EVENT_WINDOW_MS)) return;
  sendWithSession("PAGE_VIEW", { path: pathname });
}

function positiveItemId(value) {
  const itemId = Number(value);
  return Number.isInteger(itemId) && itemId > 0 ? itemId : null;
}

export function trackProductView(itemId) {
  const normalized = positiveItemId(itemId);
  if (!normalized) return;
  if (recentlyTracked(`product:${normalized}`, RECENT_ENGAGEMENT_WINDOW_MS)) return;
  sendWithSession("PRODUCT_VIEW", { itemId: normalized });
}

export function trackWishlistAdd(itemId) {
  const normalized = positiveItemId(itemId);
  if (!normalized) return;
  if (recentlyTracked(`wishlist:${normalized}`, RECENT_ENGAGEMENT_WINDOW_MS)) return;
  sendWithSession("WISHLIST_ADD", { itemId: normalized });
}

export function trackCartAdd(itemId) {
  const normalized = positiveItemId(itemId);
  if (!normalized) return;
  if (recentlyTracked(`cart:${normalized}`, RECENT_ENGAGEMENT_WINDOW_MS)) return;
  sendWithSession("CART_ADD", { itemId: normalized });
}

export function trackSearch(query) {
  if (typeof query !== "string") return;
  const normalized = query.trim();
  if (normalized.length < 2) return;
  if (recentlyTracked(`search:${normalized.toLowerCase()}`, RECENT_ENGAGEMENT_WINDOW_MS)) {
    return;
  }
  sendWithSession("SEARCH", { query: normalized.slice(0, 200) });
}

export function trackActivity() {
  if (!isBrowser() || !enabled) return;
  if (document.visibilityState === "hidden") return;
  const now = Date.now();
  if (now - lastActivitySentAt < ACTIVITY_THROTTLE_MS) return;
  sendWithSession("SESSION_ACTIVITY");
}

function accessToken() {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem("accessToken");
  } catch {
    return null;
  }
}

export async function flushAnalytics({ keepalive = false } = {}) {
  if (!isBrowser() || sending || queue.length === 0) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    scheduleFlush(FLUSH_RETRY_MS);
    return;
  }

  const batch = queue.splice(0, MAX_BATCH_SIZE);
  const session = ensureSession();
  const includeAttribution = !attributionWasSent();
  const token = accessToken();
  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  const abortTimer = controller
    ? window.setTimeout(() => controller.abort(), 8000)
    : null;
  sending = true;
  let retryable = true;

  try {
    const response = await window.fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/public/analytics/collect`,
      {
        method: "POST",
        keepalive,
        signal: controller?.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          visitorId: getVisitorId(),
          sessionId: session.id,
          ...(includeAttribution ? { attribution: getAttribution() } : {}),
          events: batch,
        }),
      },
    );
    if (!response.ok) {
      // A malformed/oversized payload will never succeed on retry. Drop it so
      // the storefront does not hammer the endpoint. Rate limits and server
      // errors remain retryable.
      retryable = response.status === 429 || response.status >= 500;
      throw new Error(`Analytics collection failed (${response.status})`);
    }
    const payload = await response.json().catch(() => null);
    const serverSessionId =
      payload?.data?.sessionId ?? payload?.sessionId ?? null;
    if (serverSessionId && serverSessionId !== session.id) {
      adoptServerSession(serverSessionId);
    }
    if (includeAttribution) markAttributionSent();
  } catch {
    if (retryable) {
      // Retry the same event ids later. The backend primary key makes retries
      // idempotent, while the capped queue prevents unbounded memory growth.
      queue = [...batch, ...queue].slice(-MAX_QUEUE_SIZE);
      scheduleFlush(FLUSH_RETRY_MS);
    }
  } finally {
    if (abortTimer) window.clearTimeout(abortTimer);
    sending = false;
    if (queue.length > 0) scheduleFlush();
  }
}

function onInteraction() {
  if (!enabled) return;
  const now = Date.now();
  if (now - lastInteractionHandledAt < 5000) return;
  lastInteractionHandledAt = now;
  trackActivity();
}

function onVisibilityChange() {
  if (document.visibilityState === "visible") {
    trackActivity();
  } else {
    void flushAnalytics({ keepalive: true });
  }
}

function onPageHide() {
  void flushAnalytics({ keepalive: true });
}

function onOnline() {
  void flushAnalytics();
}

export function setAnalyticsEnabled(nextEnabled) {
  enabled = Boolean(nextEnabled);
  if (!enabled) {
    void flushAnalytics({ keepalive: true });
  }
}

export function startAnalytics() {
  if (!isBrowser() || listening) return stopAnalytics;
  listening = true;
  getAttribution();
  window.addEventListener("pointerdown", onInteraction, { passive: true });
  window.addEventListener("keydown", onInteraction, { passive: true });
  window.addEventListener("scroll", onInteraction, { passive: true });
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("online", onOnline);
  document.addEventListener("visibilitychange", onVisibilityChange);

  stopListeners = () => {
    window.removeEventListener("pointerdown", onInteraction);
    window.removeEventListener("keydown", onInteraction);
    window.removeEventListener("scroll", onInteraction);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("online", onOnline);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    listening = false;
  };
  return stopAnalytics;
}

export function stopAnalytics() {
  stopListeners?.();
  stopListeners = null;
}

/**
 * Test helper. It intentionally lives on the module rather than exposing any
 * mutable state to application code.
 */
export function __resetAnalyticsForTests() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  stopAnalytics();
  queue = [];
  recentEvents.clear();
  sending = false;
  enabled = true;
  attribution = null;
  attributionSent = false;
  lastActivitySentAt = 0;
  lastInteractionHandledAt = 0;
  memoryStorage.clear();
}
