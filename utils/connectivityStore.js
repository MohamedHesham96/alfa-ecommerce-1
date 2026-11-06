let connectivityState = { browserOnline: true, serverDown: false };

const listeners = new Set();

const setState = (partial) => {
  connectivityState = { ...connectivityState, ...partial };
  listeners.forEach((listener) => listener());
};

export const getConnectivityState = () => connectivityState;

export const subscribeConnectivity = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const setBrowserOnline = (online) => {
  if (connectivityState.browserOnline === online) return;
  setState({ browserOnline: online });
};

// Classify a failed API request:
// - browser offline            -> handled by the online/offline listeners (offline page)
// - no response while online   -> server unreachable (server error page)
// - HTTP 5xx                   -> server error (server error page)
// - normal 4xx                 -> ignored, existing handling stays in place
export const reportApiFailure = (error) => {
  if (typeof navigator === "undefined" || navigator.onLine === false) return;

  const response = error?.response;
  const status = response?.status;
  const isServerFailure =
    !response || (typeof status === "number" && status >= 500);

  if (!isServerFailure) return;
  if (connectivityState.serverDown) return;

  setState({ serverDown: true });
};

export const clearServerFailure = () => {
  if (!connectivityState.serverDown) return;
  setState({ serverDown: false });
};

// Test-only reset. Keeping this in the store avoids tests leaking state into
// one another through the module-level singleton.
export const resetConnectivityForTests = () => {
  connectivityState = { browserOnline: true, serverDown: false };
  listeners.clear();
};
