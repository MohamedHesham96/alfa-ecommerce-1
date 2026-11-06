/*
 * Cross-tab coordination for checkout protection and PWA update activation.
 *
 * The coordination has two layers:
 *
 * 1. Web Locks (when available) are the authoritative, atomic gate:
 *    - A tab holding a checkout acquires a shared lock for the duration of the
 *      operation.
 *    - Applying a PWA update requests an exclusive lock with `ifAvailable`.
 *      The browser grants it only when no tab holds a shared checkout lock.
 *    - Locks are released automatically if a tab crashes or is closed.
 *
 * 2. Versioned per-tab localStorage leases plus BroadcastChannel messages are
 *    the fallback and the UI notification path. Each tab owns exactly one
 *    lease key, so there is no read-modify-write race. Leases carry an expiry
 *    and are refreshed while the operation is active, so a crashed tab cannot
 *    block updates indefinitely.
 *
 * BroadcastChannel is used for immediate cross-tab notifications. If it is
 * unavailable, messages fall back to a localStorage event bus.
 *
 * Locks are coordination only. They never confirm an order, payment, or any
 * other server-side state.
 */

export const CROSS_TAB_CHANNEL_NAME = "alfa-pwa";
export const CHECKOUT_LOCK_NAME = "alfa-pwa-checkout";
export const CHECKOUT_LEASE_PREFIX = "alfa.pwa.checkout.";
export const CHECKOUT_LEASE_TTL_MS = 30_000;
export const CHECKOUT_HEARTBEAT_MS = 5_000;
export const UPDATE_GATE_KEY = "alfa.pwa.update-gate";
export const UPDATE_GATE_TTL_MS = 15_000;
export const CROSS_TAB_BUS_KEY = "alfa.pwa.bus";

export const CROSS_TAB_EVENT = {
  CHECKOUT_CHANGE: "checkout-change",
  UPDATE_AVAILABLE: "update-available",
  UPDATE_APPLIED: "update-applied",
};

function createTabId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // Fall through to a random id.
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function getBrowserStorage() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Private modes can make storage access throw.
  }
  return null;
}

function getBrowserLocks() {
  try {
    if (typeof navigator !== "undefined" && navigator.locks) {
      return navigator.locks;
    }
  } catch {
    // Ignore browsers that expose a throwing getter.
  }
  return null;
}

function createBrowserChannel() {
  try {
    if (typeof BroadcastChannel === "function") {
      return new BroadcastChannel(CROSS_TAB_CHANNEL_NAME);
    }
  } catch {
    // Fall back to the localStorage bus.
  }
  return null;
}

function subscribeToBrowserStorage(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function subscribeToBrowserLifecycle(handlers) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  const onPageHide = (event) => handlers.pagehide(Boolean(event.persisted));
  const onPageShow = (event) => handlers.pageshow(Boolean(event.persisted));
  const onVisibilityChange = () =>
    handlers.visibility(document.visibilityState === "visible");

  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("pageshow", onPageShow);
  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("pageshow", onPageShow);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}

function safeParse(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function storageKeys(storage) {
  const keys = [];
  if (!storage) return keys;
  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key) keys.push(key);
    }
  } catch {
    return [];
  }
  return keys;
}

export function createCrossTabCoordinator(options = {}) {
  const {
    tabId = createTabId(),
    storage = getBrowserStorage(),
    channel = createBrowserChannel(),
    locks = getBrowserLocks(),
    now = () => Date.now(),
    setIntervalFn = (callback, delay) => setInterval(callback, delay),
    clearIntervalFn = (id) => clearInterval(id),
    setTimeoutFn = (callback, delay) => setTimeout(callback, delay),
    clearTimeoutFn = (id) => clearTimeout(id),
    subscribeStorage = subscribeToBrowserStorage,
    subscribeLifecycle = subscribeToBrowserLifecycle,
  } = options;

  const leaseKey = `${CHECKOUT_LEASE_PREFIX}${tabId}`;
  const listeners = new Set();
  let localCheckoutCount = 0;
  let heartbeatId = null;
  let disposed = false;
  let messageCounter = 0;
  let updateGateRelease = null;
  const sharedLockReleases = new Set();

  function emit(event) {
    listeners.forEach((listener) => listener(event));
  }

  function readStorage(key) {
    if (!storage) return null;
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  }

  function writeStorage(key, value) {
    if (!storage) return false;
    try {
      storage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  function removeStorage(key) {
    if (!storage) return false;
    try {
      storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  function readLeases({ removeExpired = true } = {}) {
    if (!storage) return [];
    const leases = [];
    const timestamp = now();

    for (const key of storageKeys(storage)) {
      if (!key.startsWith(CHECKOUT_LEASE_PREFIX)) continue;
      const lease = safeParse(readStorage(key));
      const expiresAt = Number(lease?.expiresAt || 0);
      if (!lease || !Number.isFinite(expiresAt) || expiresAt <= timestamp) {
        if (key === leaseKey && localCheckoutCount > 0) {
          // The tab is still active but a throttled background timer let the
          // lease expire. Refresh it instead of reporting the operation as gone.
          writeLease();
          leases.push({
            key,
            tabId,
            count: localCheckoutCount,
            updatedAt: timestamp,
            expiresAt: timestamp + CHECKOUT_LEASE_TTL_MS,
          });
          continue;
        }
        if (removeExpired) removeStorage(key);
        continue;
      }
      leases.push({ key, ...lease });
    }

    return leases;
  }

  function writeLease() {
    if (!storage || localCheckoutCount < 1) return;
    const timestamp = now();
    writeStorage(
      leaseKey,
      JSON.stringify({
        tabId,
        count: localCheckoutCount,
        updatedAt: timestamp,
        expiresAt: timestamp + CHECKOUT_LEASE_TTL_MS,
      }),
    );
  }

  function refreshLease() {
    if (localCheckoutCount > 0) writeLease();
  }

  function startHeartbeat() {
    if (heartbeatId !== null) return;
    heartbeatId = setIntervalFn(() => {
      if (disposed || localCheckoutCount < 1) return;
      writeLease();
    }, CHECKOUT_HEARTBEAT_MS);
  }

  function stopHeartbeat() {
    if (heartbeatId === null) return;
    clearIntervalFn(heartbeatId);
    heartbeatId = null;
  }

  function readUpdateGate() {
    if (!storage) return null;
    const gate = safeParse(readStorage(UPDATE_GATE_KEY));
    if (!gate) return null;
    const expiresAt = Number(gate.expiresAt || 0);
    if (!Number.isFinite(expiresAt) || expiresAt <= now()) {
      removeStorage(UPDATE_GATE_KEY);
      return null;
    }
    return gate;
  }

  function postMessage(type, payload = {}) {
    if (disposed) return;
    const message = {
      id: `${tabId}:${messageCounter += 1}`,
      type,
      tabId,
      at: now(),
      ...payload,
    };

    if (channel && typeof channel.postMessage === "function") {
      try {
        channel.postMessage(message);
        return;
      } catch {
        // Fall through to the storage bus.
      }
    }

    writeStorage(CROSS_TAB_BUS_KEY, JSON.stringify(message));
  }

  function handleMessage(message) {
    if (!message || typeof message.type !== "string") return;
    if (message.tabId === tabId) return;

    if (message.type === CROSS_TAB_EVENT.CHECKOUT_CHANGE) {
      emit({ type: CROSS_TAB_EVENT.CHECKOUT_CHANGE, tabId: message.tabId });
      return;
    }
    if (message.type === CROSS_TAB_EVENT.UPDATE_AVAILABLE) {
      emit({
        type: CROSS_TAB_EVENT.UPDATE_AVAILABLE,
        tabId: message.tabId,
        at: message.at,
      });
      return;
    }
    if (message.type === CROSS_TAB_EVENT.UPDATE_APPLIED) {
      emit({
        type: CROSS_TAB_EVENT.UPDATE_APPLIED,
        tabId: message.tabId,
        at: message.at,
      });
    }
  }

  function handleStorageEvent(event) {
    if (!event || !event.key) return;

    if (event.key === CROSS_TAB_BUS_KEY) {
      handleMessage(safeParse(event.newValue));
      return;
    }

    if (event.key.startsWith(CHECKOUT_LEASE_PREFIX)) {
      // Ignore the event caused by our own heartbeat; other tabs still see it.
      if (event.key !== leaseKey) {
        emit({ type: CROSS_TAB_EVENT.CHECKOUT_CHANGE });
      }
      return;
    }

    if (event.key === UPDATE_GATE_KEY) {
      emit({ type: CROSS_TAB_EVENT.CHECKOUT_CHANGE });
    }
  }

  function onChannelMessage(event) {
    handleMessage(event?.data);
  }

  let unsubscribeStorage = () => {};
  let unsubscribeLifecycle = () => {};

  if (channel && typeof channel.addEventListener === "function") {
    channel.addEventListener("message", onChannelMessage);
  } else if (channel) {
    channel.onmessage = onChannelMessage;
  }

  try {
    unsubscribeStorage = subscribeStorage(handleStorageEvent) || (() => {});
  } catch {
    unsubscribeStorage = () => {};
  }

  function releaseSharedLocks() {
    for (const release of Array.from(sharedLockReleases)) {
      sharedLockReleases.delete(release);
      try {
        release();
      } catch {
        // A failed release only affects this tab.
      }
    }
  }

  function releaseUpdateGate() {
    if (!updateGateRelease) return;
    const release = updateGateRelease;
    updateGateRelease = null;
    try {
      release();
    } catch {
      // Ignore a release failure; the TTL / Web Lock still applies.
    }
  }

  function releaseAll() {
    releaseSharedLocks();
    releaseUpdateGate();
    localCheckoutCount = 0;
    stopHeartbeat();
    removeStorage(leaseKey);
    emit({ type: CROSS_TAB_EVENT.CHECKOUT_CHANGE });
  }

  function onPageHide(persisted) {
    // A BFCache page keeps its locks/leases; a real unload must release them.
    if (!persisted) releaseAll();
  }

  function onPageShow() {
    refreshLease();
  }

  function onVisibility(visible) {
    if (visible) refreshLease();
  }

  try {
    unsubscribeLifecycle =
      subscribeLifecycle({
        pagehide: onPageHide,
        pageshow: onPageShow,
        visibility: onVisibility,
      }) || (() => {});
  } catch {
    unsubscribeLifecycle = () => {};
  }

  async function waitForFallbackUpdateGate() {
    const deadline = now() + 5_000;
    while (!disposed && now() < deadline) {
      const gate = readUpdateGate();
      if (!gate || gate.tabId === tabId) return;
      await new Promise((resolve) => setTimeoutFn(resolve, 50));
    }
  }

  async function waitForSharedLock() {
    if (!locks || typeof locks.request !== "function") {
      return null;
    }

    let releaseLock = null;
    let releaseRequested = false;
    let grantedResolve;
    let timedOut = false;
    const granted = new Promise((resolve) => {
      grantedResolve = resolve;
    });
    const timeoutId = setTimeoutFn(() => {
      timedOut = true;
      grantedResolve();
    }, 20_000);

    try {
      locks
        .request(CHECKOUT_LOCK_NAME, { mode: "shared" }, () => {
          clearTimeoutFn(timeoutId);
          if (timedOut || disposed) return undefined;
          grantedResolve();
          return new Promise((resolve) => {
            releaseLock = resolve;
            if (releaseRequested) resolve();
          });
        })
        .catch(() => {
          clearTimeoutFn(timeoutId);
          grantedResolve();
        });
    } catch {
      clearTimeoutFn(timeoutId);
      grantedResolve();
    }

    await granted;

    const release = () => {
      releaseRequested = true;
      if (releaseLock) releaseLock();
    };
    sharedLockReleases.add(release);
    return release;
  }

  async function beginCheckout(reason = "checkout") {
    if (disposed) {
      return () => {};
    }

    if (!locks || readUpdateGate()) {
      await waitForFallbackUpdateGate();
    }

    localCheckoutCount += 1;
    writeLease();
    startHeartbeat();
    postMessage(CROSS_TAB_EVENT.CHECKOUT_CHANGE, { phase: "begin", reason });

    const releaseLock = await waitForSharedLock();
    if (disposed) {
      if (releaseLock) releaseLock();
      localCheckoutCount = Math.max(0, localCheckoutCount - 1);
      stopHeartbeat();
      removeStorage(leaseKey);
      return () => {};
    }
    let released = false;

    return function releaseCheckout() {
      if (released) return;
      released = true;

      if (releaseLock) {
        sharedLockReleases.delete(releaseLock);
        try {
          releaseLock();
        } catch {
          // Ignore release errors; TTL cleanup still applies.
        }
      }

      localCheckoutCount = Math.max(0, localCheckoutCount - 1);
      if (localCheckoutCount === 0) {
        stopHeartbeat();
        removeStorage(leaseKey);
      } else {
        writeLease();
      }
      postMessage(CROSS_TAB_EVENT.CHECKOUT_CHANGE, { phase: "end", reason });
    };
  }

  async function isCheckoutActive() {
    if (readLeases().length > 0) return true;

    if (locks && typeof locks.query === "function") {
      try {
        const snapshot = await locks.query();
        return Boolean(
          snapshot?.held?.some(
            (lock) =>
              lock.name === CHECKOUT_LOCK_NAME && lock.mode === "shared",
          ),
        );
      } catch {
        return false;
      }
    }

    return false;
  }

  function writeFallbackUpdateGate() {
    const timestamp = now();
    const token = `${tabId}:${timestamp}:${Math.random().toString(36).slice(2)}`;
    const gate = {
      tabId,
      token,
      updatedAt: timestamp,
      expiresAt: timestamp + UPDATE_GATE_TTL_MS,
    };
    if (!writeStorage(UPDATE_GATE_KEY, JSON.stringify(gate))) return null;
    return () => {
      // Only the tab that created this gate may remove it. An expired gate may
      // already have been replaced by another tab.
      const current = safeParse(readStorage(UPDATE_GATE_KEY));
      if (current?.token === token) removeStorage(UPDATE_GATE_KEY);
    };
  }

  async function acquireUpdateGate() {
    if (disposed) {
      return { acquired: false, reason: "unavailable", release: () => {} };
    }

    const existingGate = readUpdateGate();
    if (existingGate) {
      return { acquired: false, reason: "update", release: () => {} };
    }

    if (readLeases().length > 0) {
      return { acquired: false, reason: "checkout", release: () => {} };
    }

    if (locks && typeof locks.request === "function") {
      let releaseLock = null;
      let granted = false;
      let timedOut = false;
      const acquired = await new Promise((resolve) => {
        let settled = false;
        let timeoutId = null;
        const finish = (value) => {
          if (settled) return;
          settled = true;
          if (timeoutId !== null) clearTimeoutFn(timeoutId);
          resolve(value);
        };

        timeoutId = setTimeoutFn(() => {
          timedOut = true;
          finish(false);
        }, 2_000);

        try {
          locks
            .request(
              CHECKOUT_LOCK_NAME,
              { mode: "exclusive", ifAvailable: true },
              (lock) => {
                if (!lock || timedOut) {
                  finish(false);
                  return undefined;
                }
                granted = true;
                finish(true);
                return new Promise((resolveLock) => {
                  releaseLock = resolveLock;
                });
              },
            )
            .catch(() => finish(false));
        } catch {
          finish(false);
        }
      });

      if (!granted || !acquired) {
        return { acquired: false, reason: "checkout", release: () => {} };
      }

      // Be defensive for tabs that wrote a lease before their Web Lock was
      // granted (or whose lock request failed). The exclusive lock already
      // excludes live shared holders; a remaining lease is treated as active
      // until its short TTL expires.
      if (readLeases().length > 0) {
        if (releaseLock) releaseLock();
        return { acquired: false, reason: "checkout", release: () => {} };
      }

      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        if (releaseLock) releaseLock();
      };
      updateGateRelease = release;
      return { acquired: true, reason: null, release };
    }

    const gateRelease = writeFallbackUpdateGate();
    if (!gateRelease) {
      return { acquired: false, reason: "unavailable", release: () => {} };
    }

    if (readLeases().length > 0) {
      gateRelease();
      return { acquired: false, reason: "checkout", release: () => {} };
    }

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      gateRelease();
      if (updateGateRelease === release) updateGateRelease = null;
    };
    updateGateRelease = release;
    return { acquired: true, reason: null, release };
  }

  function notifyUpdateAvailable() {
    postMessage(CROSS_TAB_EVENT.UPDATE_AVAILABLE);
  }

  function notifyUpdateApplied() {
    postMessage(CROSS_TAB_EVENT.UPDATE_APPLIED);
  }

  function subscribe(listener) {
    if (typeof listener !== "function") return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    releaseAll();
    unsubscribeStorage();
    unsubscribeLifecycle();
    if (channel && typeof channel.removeEventListener === "function") {
      channel.removeEventListener("message", onChannelMessage);
    }
    if (channel && typeof channel.close === "function") {
      try {
        channel.close();
      } catch {
        // Ignore.
      }
    }
    listeners.clear();
  }

  return {
    tabId,
    leaseKey,
    beginCheckout,
    isCheckoutActive,
    acquireUpdateGate,
    notifyUpdateAvailable,
    notifyUpdateApplied,
    subscribe,
    refreshLease,
    dispose,
  };
}

let defaultCoordinator = null;

export function getCrossTabCoordinator() {
  if (typeof window === "undefined") return null;
  if (!defaultCoordinator) {
    defaultCoordinator = createCrossTabCoordinator();
  }
  return defaultCoordinator;
}

export function resetCrossTabCoordinatorForTests() {
  if (defaultCoordinator) {
    defaultCoordinator.dispose();
    defaultCoordinator = null;
  }
}
