import {
  CHECKOUT_LEASE_PREFIX,
  CHECKOUT_LEASE_TTL_MS,
  CROSS_TAB_EVENT,
  UPDATE_GATE_TTL_MS,
  createCrossTabCoordinator,
} from "../lib/pwa/crossTab";

function createMemoryStorage() {
  const map = new Map();
  return {
    get length() {
      return map.size;
    },
    key(index) {
      return Array.from(map.keys())[index] ?? null;
    },
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(String(key), String(value));
    },
    removeItem(key) {
      map.delete(String(key));
    },
    clear() {
      map.clear();
    },
  };
}

function createSharedStorageNetwork() {
  const storage = createMemoryStorage();
  const listeners = new Set();
  const emit = (key, newValue) => {
    listeners.forEach((listener) =>
      listener({ key, newValue, storageArea: storage }),
    );
  };

  const setItem = storage.setItem.bind(storage);
  const removeItem = storage.removeItem.bind(storage);
  storage.setItem = (key, value) => {
    setItem(key, value);
    emit(String(key), String(value));
  };
  storage.removeItem = (key) => {
    removeItem(key);
    emit(String(key), null);
  };

  return {
    storage,
    subscribeStorage(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function createChannelHub() {
  const channels = new Set();
  return {
    createChannel() {
      const listeners = new Set();
      const channel = {
        postMessage(message) {
          for (const other of channels) {
            if (other !== channel) other.deliver(message);
          }
        },
        addEventListener(type, listener) {
          if (type === "message") listeners.add(listener);
        },
        removeEventListener(type, listener) {
          if (type === "message") listeners.delete(listener);
        },
        close() {
          channels.delete(channel);
        },
        deliver(message) {
          listeners.forEach((listener) => listener({ data: message }));
        },
      };
      channels.add(channel);
      return channel;
    },
  };
}

function createLifecycleCapture() {
  const handlers = new Set();
  return {
    subscribe(nextHandlers) {
      handlers.add(nextHandlers);
      return () => {
        handlers.delete(nextHandlers);
      };
    },
    pagehide(persisted = false) {
      handlers.forEach((entry) => entry.pagehide(persisted));
    },
    pageshow(persisted = false) {
      handlers.forEach((entry) => entry.pageshow(persisted));
    },
    visibility(visible) {
      handlers.forEach((entry) => entry.visibility(visible));
    },
  };
}

/*
 * Small Web Locks implementation for tests. It supports the subset used by the
 * coordinator: shared locks, exclusive locks, ifAvailable and query().
 */
function createFakeLocks() {
  const held = new Map();
  const pending = [];
  let nextId = 1;

  function canGrant(name, mode) {
    const current = Array.from(held.values()).filter((lock) => lock.name === name);
    if (current.length === 0) return true;
    if (mode === "exclusive") return false;
    return !current.some((lock) => lock.mode === "exclusive");
  }

  function pump() {
    for (let index = 0; index < pending.length; ) {
      const request = pending[index];
      if (!canGrant(request.name, request.mode)) {
        index += 1;
        continue;
      }
      pending.splice(index, 1);
      grant(request);
    }
  }

  function grant(request) {
    const handle = {
      id: nextId += 1,
      name: request.name,
      mode: request.mode,
      clientId: request.clientId,
      release: null,
    };
    held.set(handle.id, handle);

    let result;
    try {
      result = request.callback({
        name: handle.name,
        mode: handle.mode,
        clientId: handle.clientId,
      });
    } catch (error) {
      held.delete(handle.id);
      request.reject(error);
      pump();
      return;
    }

    Promise.resolve(result).then(
      () => {
        held.delete(handle.id);
        pump();
        request.resolve();
      },
      (error) => {
        held.delete(handle.id);
        pump();
        request.reject(error);
      },
    );
  }

  function request(name, options = {}, callback) {
    return new Promise((resolve, reject) => {
      const requestEntry = {
        name,
        mode: options.mode || "exclusive",
        clientId: options.clientId,
        callback,
        resolve,
        reject,
      };

      if (canGrant(requestEntry.name, requestEntry.mode)) {
        grant(requestEntry);
        return;
      }

      if (options.ifAvailable) {
        try {
          Promise.resolve(callback(null)).then(resolve, reject);
        } catch (error) {
          reject(error);
        }
        return;
      }

      pending.push(requestEntry);
    });
  }

  function query() {
    return Promise.resolve({
      held: Array.from(held.values()).map(({ name, mode, clientId }) => ({
        name,
        mode,
        clientId,
      })),
    });
  }

  return { request, query };
}

function setup(options = {}) {
  const network = createSharedStorageNetwork();
  const lifecycle = createLifecycleCapture();
  const clock = { value: 1_000 };
  const channelHub = options.channelHub || null;
  const locks = options.locks || null;

  const make = (tabId) =>
    createCrossTabCoordinator({
      tabId,
      storage: network.storage,
      channel: channelHub ? channelHub.createChannel() : null,
      locks,
      now: () => clock.value,
      setIntervalFn: () => 1,
      clearIntervalFn: () => {},
      setTimeoutFn: (callback, delay) => setTimeout(callback, delay),
      clearTimeoutFn: (id) => clearTimeout(id),
      subscribeStorage: network.subscribeStorage,
      subscribeLifecycle: lifecycle.subscribe,
    });

  return { network, lifecycle, clock, make };
}

describe("cross-tab critical operations", () => {
  it("blocks update activation while another tab holds a checkout", async () => {
    const { make } = setup();
    const tabA = make("tab-a");
    const tabB = make("tab-b");

    const releaseA = await tabA.beginCheckout("order");
    await expect(tabB.isCheckoutActive()).resolves.toBe(true);

    const blocked = await tabB.acquireUpdateGate();
    expect(blocked.acquired).toBe(false);
    expect(blocked.reason).toBe("checkout");

    releaseA();
    await expect(tabB.isCheckoutActive()).resolves.toBe(false);

    const gate = await tabB.acquireUpdateGate();
    expect(gate.acquired).toBe(true);
    gate.release();

    tabA.dispose();
    tabB.dispose();
  });

  it("keeps the checkout lock until every concurrent operation completes", async () => {
    const { make } = setup();
    const tabA = make("tab-a");
    const tabB = make("tab-b");

    const releaseA1 = await tabA.beginCheckout("order");
    const releaseA2 = await tabA.beginCheckout("order");
    const releaseB = await tabB.beginCheckout("order");

    await expect(tabB.isCheckoutActive()).resolves.toBe(true);

    releaseA1();
    await expect(tabB.isCheckoutActive()).resolves.toBe(true);
    releaseA2();
    await expect(tabB.isCheckoutActive()).resolves.toBe(true);
    releaseB();
    await expect(tabB.isCheckoutActive()).resolves.toBe(false);

    tabA.dispose();
    tabB.dispose();
  });

  it("ignores and removes stale checkout leases", async () => {
    const { make, network, clock } = setup();
    const tabA = make("tab-a");
    const staleKey = `${CHECKOUT_LEASE_PREFIX}dead-tab`;
    network.storage.setItem(
      staleKey,
      JSON.stringify({
        tabId: "dead-tab",
        count: 1,
        updatedAt: clock.value - CHECKOUT_LEASE_TTL_MS - 1,
        expiresAt: clock.value - 1,
      }),
    );

    await expect(tabA.isCheckoutActive()).resolves.toBe(false);
    expect(network.storage.getItem(staleKey)).toBeNull();
    tabA.dispose();
  });

  it("expires abandoned leases after the TTL", async () => {
    const { make, clock } = setup();
    const tabA = make("tab-a");
    const tabB = make("tab-b");
    const releaseA = await tabA.beginCheckout("order");

    clock.value += CHECKOUT_LEASE_TTL_MS + 1;
    await expect(tabB.isCheckoutActive()).resolves.toBe(false);

    releaseA();
    tabA.dispose();
    tabB.dispose();
  });

  it("releases leases and locks when a tab closes", async () => {
    const { make, lifecycle } = setup();
    const tabA = make("tab-a");
    const tabB = make("tab-b");

    await tabA.beginCheckout("order");
    lifecycle.pagehide(false);

    await expect(tabB.isCheckoutActive()).resolves.toBe(false);
    const gate = await tabB.acquireUpdateGate();
    expect(gate.acquired).toBe(true);
    gate.release();

    tabA.dispose();
    tabB.dispose();
  });

  it("keeps the lease for a BFCache page and releases it on real unload", async () => {
    const { make, lifecycle } = setup();
    const tabA = make("tab-a");
    const tabB = make("tab-b");

    await tabA.beginCheckout("order");
    lifecycle.pagehide(true);
    await expect(tabB.isCheckoutActive()).resolves.toBe(true);
    lifecycle.pagehide(false);
    await expect(tabB.isCheckoutActive()).resolves.toBe(false);

    tabA.dispose();
    tabB.dispose();
  });
});

describe("cross-tab update gate", () => {
  it("uses Web Locks to make checkout and update activation atomic", async () => {
    const locks = createFakeLocks();
    const { make } = setup({ locks });
    const tabA = make("tab-a");
    const tabB = make("tab-b");
    const tabC = make("tab-c");

    const releaseA = await tabA.beginCheckout("order");
    const blocked = await tabB.acquireUpdateGate();
    expect(blocked.acquired).toBe(false);

    releaseA();
    await Promise.resolve();
    const gate = await tabB.acquireUpdateGate();
    expect(gate.acquired).toBe(true);

    // The exclusive update gate is not a checkout.
    await expect(tabC.isCheckoutActive()).resolves.toBe(false);

    let checkoutGranted = null;
    const pendingCheckout = tabC.beginCheckout("order").then((release) => {
      checkoutGranted = release;
      return release;
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(checkoutGranted).toBeNull();

    gate.release();
    const releaseC = await pendingCheckout;
    expect(typeof releaseC).toBe("function");
    releaseC();
    await Promise.resolve();

    await expect(tabB.isCheckoutActive()).resolves.toBe(false);
    tabA.dispose();
    tabB.dispose();
    tabC.dispose();
  });

  it("expires an abandoned fallback update gate without removing a newer gate", async () => {
    const { make, clock } = setup();
    const tabA = make("tab-a");
    const tabB = make("tab-b");
    const tabC = make("tab-c");

    const gateA = await tabA.acquireUpdateGate();
    expect(gateA.acquired).toBe(true);

    // While the gate is alive, another tab must not overwrite it.
    const blocked = await tabB.acquireUpdateGate();
    expect(blocked.acquired).toBe(false);

    clock.value += UPDATE_GATE_TTL_MS + 1;
    const gateB = await tabB.acquireUpdateGate();
    expect(gateB.acquired).toBe(true);

    // Releasing the expired gate must not remove tab B's newer gate.
    gateA.release();
    const blockedAgain = await tabC.acquireUpdateGate();
    expect(blockedAgain.acquired).toBe(false);

    gateB.release();
    const gateC = await tabC.acquireUpdateGate();
    expect(gateC.acquired).toBe(true);
    gateC.release();

    tabA.dispose();
    tabB.dispose();
    tabC.dispose();
  });
});

describe("cross-tab update notifications", () => {
  it("delivers update events to other tabs over BroadcastChannel", () => {
    const channelHub = createChannelHub();
    const { make } = setup({ channelHub });
    const tabA = make("tab-a");
    const tabB = make("tab-b");
    const events = [];
    tabB.subscribe((event) => events.push(event));

    tabA.notifyUpdateAvailable();
    tabA.notifyUpdateApplied();

    expect(events.map((event) => event.type)).toEqual([
      CROSS_TAB_EVENT.UPDATE_AVAILABLE,
      CROSS_TAB_EVENT.UPDATE_APPLIED,
    ]);

    tabA.dispose();
    tabB.dispose();
  });

  it("falls back to the localStorage bus when BroadcastChannel is unavailable", () => {
    const { make } = setup();
    const tabA = make("tab-a");
    const tabB = make("tab-b");
    const events = [];
    tabB.subscribe((event) => events.push(event));

    tabA.notifyUpdateApplied();
    expect(events).toEqual([
      expect.objectContaining({ type: CROSS_TAB_EVENT.UPDATE_APPLIED }),
    ]);

    tabA.dispose();
    tabB.dispose();
  });

  it("does not deliver a tab's own update notification back to itself", () => {
    const { make } = setup();
    const tabA = make("tab-a");
    const events = [];
    tabA.subscribe((event) => events.push(event));

    tabA.notifyUpdateAvailable();
    expect(events).toEqual([]);
    tabA.dispose();
  });
});
