import {
  SW_PATH,
  SW_SCOPE,
  UPDATE_CHECK_INTERVAL_MS,
  isPwaDevEnabled,
  isPwaEnabled,
} from "./constants";
import { configureServiceWorker, ensurePersistentStorage } from "./client";
import { isCriticalOperationInProgress } from "./criticalOperation";
import { UPDATE_APPLY_RESULT } from "./update";

let reloadRequested = false;
let reloading = false;
let controllerChangeAttached = false;
const controllerChangeHandlers = new Set();

function notifyControllerChange() {
  controllerChangeHandlers.forEach((handler) => {
    try {
      handler();
    } catch (error) {
      console.warn("[Alfa PWA] controllerchange handler failed", error);
    }
  });
}

export function subscribeControllerChange(handler) {
  if (typeof handler !== "function") return () => {};
  controllerChangeHandlers.add(handler);
  return () => controllerChangeHandlers.delete(handler);
}

export function shouldRegisterServiceWorker({
  supported,
  secureContext,
  nodeEnv,
  devEnabled,
  pwaEnabled = isPwaEnabled,
} = {}) {
  if (pwaEnabled !== true) return false;
  if (!supported || !secureContext) return false;
  return nodeEnv === "production" || devEnabled === true;
}

export function getServiceWorkerRegistrationOptions() {
  return {
    scope: SW_SCOPE,
    updateViaCache: "none",
  };
}

function getWorkerScriptPath(worker) {
  if (!worker || typeof worker.scriptURL !== "string") return null;
  try {
    return new URL(worker.scriptURL, "http://localhost").pathname;
  } catch {
    return null;
  }
}

export function isAlfaServiceWorkerRegistration(registration) {
  if (!registration) return false;
  return [registration.active, registration.waiting, registration.installing]
    .some((worker) => getWorkerScriptPath(worker) === SW_PATH);
}

/*
 * Removes Alfa service-worker registrations without touching Cache Storage.
 * Existing PWA caches are intentionally preserved so re-enabling the feature
 * does not require downloading them again.
 */
export async function unregisterAlfaServiceWorkers(deps = {}) {
  const win =
    deps.window || (typeof window !== "undefined" ? window : null);
  const container =
    deps.container ||
    (win && win.navigator ? win.navigator.serviceWorker : null);

  if (!container || typeof container.getRegistrations !== "function") {
    return [];
  }

  try {
    const registrations = await container.getRegistrations();
    const targets = registrations.filter((registration) =>
      isAlfaServiceWorkerRegistration(registration),
    );

    await Promise.all(
      targets.map((registration) => {
        try {
          return registration.unregister();
        } catch {
          return false;
        }
      }),
    );

    return targets;
  } catch {
    return [];
  }
}

function attachControllerChangeListener(win) {
  if (controllerChangeAttached || !win) return;
  const container = win.navigator && win.navigator.serviceWorker;
  if (!container || typeof container.addEventListener !== "function") return;

  controllerChangeAttached = true;
  container.addEventListener("controllerchange", () => {
    notifyControllerChange();
    if (!reloadRequested || reloading) return;
    reloading = true;
    if (win.location && typeof win.location.reload === "function") {
      win.location.reload();
    }
  });
}

export function applyServiceWorkerUpdate(registration, { online = true } = {}) {
  if (!registration || !registration.waiting) {
    return UPDATE_APPLY_RESULT.UNAVAILABLE;
  }
  if (!online) {
    return UPDATE_APPLY_RESULT.OFFLINE;
  }
  if (isCriticalOperationInProgress()) {
    return UPDATE_APPLY_RESULT.BLOCKED;
  }

  try {
    reloadRequested = true;
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
    return UPDATE_APPLY_RESULT.APPLYING;
  } catch {
    reloadRequested = false;
    return UPDATE_APPLY_RESULT.UNAVAILABLE;
  }
}

export async function registerServiceWorker(handlers = {}, deps = {}) {
  const win =
    deps.window || (typeof window !== "undefined" ? window : null);
  const container =
    deps.container ||
    (win && win.navigator ? win.navigator.serviceWorker : null);
  const secureContext =
    deps.secureContext !== undefined
      ? deps.secureContext
      : Boolean(win && win.isSecureContext);
  const nodeEnv = deps.nodeEnv || process.env.NODE_ENV;
  const devEnabled =
    deps.devEnabled !== undefined ? deps.devEnabled : isPwaDevEnabled;
  const pwaEnabled =
    deps.pwaEnabled !== undefined ? deps.pwaEnabled : isPwaEnabled;

  if (
    !shouldRegisterServiceWorker({
      supported: Boolean(container),
      secureContext,
      nodeEnv,
      devEnabled,
      pwaEnabled,
    })
  ) {
    return null;
  }

  try {
    const register =
      deps.register ||
      ((...args) => container.register(...args));
    const registration = await register(
      SW_PATH,
      getServiceWorkerRegistrationOptions(),
    );

    const sendConfiguration = () => configureServiceWorker(registration);
    sendConfiguration();
    if (container.ready && typeof container.ready.then === "function") {
      container.ready
        .then(() => sendConfiguration())
        .catch(() => {});
    }

    attachControllerChangeListener(win);

    const notifyInstalled = (worker) => {
      if (!worker || worker.state !== "installed") return;
      if (container.controller) {
        if (typeof handlers.onUpdateReady === "function") {
          handlers.onUpdateReady(registration, worker);
        }
      } else if (typeof handlers.onOfflineReady === "function") {
        handlers.onOfflineReady(registration);
      }
    };

    if (registration.waiting && container.controller) {
      if (typeof handlers.onUpdateReady === "function") {
        handlers.onUpdateReady(registration, registration.waiting);
      }
    }

    const onUpdateFound = () => {
      const installing = registration.installing;
      if (!installing) return;
      if (installing.state === "installed") {
        notifyInstalled(installing);
        return;
      }
      installing.addEventListener("statechange", () => {
        if (installing.state === "installed") notifyInstalled(installing);
      });
    };

    if (typeof registration.addEventListener === "function") {
      registration.addEventListener("updatefound", onUpdateFound);
    }

    const checkForUpdate = () => {
      if (!win || (win.navigator && win.navigator.onLine === false)) return;
      if (typeof registration.update !== "function") return;
      registration.update().catch(() => {});
    };

    const onVisibilityChange = () => {
      if (win.document && win.document.visibilityState === "visible") {
        checkForUpdate();
      }
    };

    if (win && typeof win.addEventListener === "function") {
      win.addEventListener("online", checkForUpdate);
      if (win.document && typeof win.document.addEventListener === "function") {
        win.document.addEventListener("visibilitychange", onVisibilityChange);
      }
    }

    const intervalId =
      win && typeof win.setInterval === "function"
        ? win.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS)
        : null;

    ensurePersistentStorage().catch(() => {});

    return {
      registration,
      checkForUpdate,
      cleanup() {
        if (typeof registration.removeEventListener === "function") {
          registration.removeEventListener("updatefound", onUpdateFound);
        }
        if (win && typeof win.removeEventListener === "function") {
          win.removeEventListener("online", checkForUpdate);
          if (win.document && typeof win.document.removeEventListener === "function") {
            win.document.removeEventListener(
              "visibilitychange",
              onVisibilityChange,
            );
          }
        }
        if (intervalId && win && typeof win.clearInterval === "function") {
          win.clearInterval(intervalId);
        }
      },
    };
  } catch (error) {
    if (typeof handlers.onError === "function") handlers.onError(error);
    return null;
  }
}

export function resetRegistrationStateForTests() {
  reloadRequested = false;
  reloading = false;
  controllerChangeAttached = false;
  controllerChangeHandlers.clear();
}
