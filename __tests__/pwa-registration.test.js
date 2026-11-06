import {
  applyServiceWorkerUpdate,
  registerServiceWorker,
  resetRegistrationStateForTests,
  shouldRegisterServiceWorker,
  subscribeControllerChange,
} from "../lib/pwa/registration";
import { UPDATE_APPLY_RESULT } from "../lib/pwa/update";
import {
  beginCriticalOperation,
  resetCriticalOperationsForTests,
} from "../lib/pwa/criticalOperation";
import {
  configureServiceWorker,
  ensurePersistentStorage,
} from "../lib/pwa/client";

jest.mock("../lib/pwa/client", () => ({
  configureServiceWorker: jest.fn(),
  ensurePersistentStorage: jest.fn(() => Promise.resolve(false)),
}));

function makeWindow(container) {
  const listeners = {};
  const documentListeners = {};
  return {
    navigator: { serviceWorker: container, onLine: true },
    isSecureContext: true,
    document: {
      visibilityState: "visible",
      addEventListener: jest.fn((event, handler) => {
        documentListeners[event] = handler;
      }),
      removeEventListener: jest.fn(),
    },
    addEventListener: jest.fn((event, handler) => {
      listeners[event] = handler;
    }),
    removeEventListener: jest.fn(),
    setInterval: jest.fn(() => 123),
    clearInterval: jest.fn(),
    location: { reload: jest.fn() },
    __listeners: listeners,
    __documentListeners: documentListeners,
  };
}

function makeContainer(controller = { postMessage: jest.fn() }) {
  const handlers = {};
  return {
    controller,
    ready: Promise.resolve({}),
    addEventListener: jest.fn((event, handler) => {
      handlers[event] = handler;
    }),
    __handlers: handlers,
  };
}

function makeRegistration() {
  const listeners = {};
  return {
    waiting: null,
    installing: null,
    active: { postMessage: jest.fn() },
    addEventListener: jest.fn((event, handler) => {
      listeners[event] = handler;
    }),
    removeEventListener: jest.fn(),
    update: jest.fn(() => Promise.resolve()),
    __listeners: listeners,
  };
}

describe("service worker registration", () => {
  beforeEach(() => {
    resetRegistrationStateForTests();
    resetCriticalOperationsForTests();
    jest.clearAllMocks();
  });

  it("enables registration only in secure production (or explicit dev) contexts", () => {
    expect(
      shouldRegisterServiceWorker({
        supported: true,
        secureContext: true,
        nodeEnv: "production",
      }),
    ).toBe(true);
    expect(
      shouldRegisterServiceWorker({
        supported: false,
        secureContext: true,
        nodeEnv: "production",
      }),
    ).toBe(false);
    expect(
      shouldRegisterServiceWorker({
        supported: true,
        secureContext: false,
        nodeEnv: "production",
      }),
    ).toBe(false);
    expect(
      shouldRegisterServiceWorker({
        supported: true,
        secureContext: true,
        nodeEnv: "development",
      }),
    ).toBe(false);
    expect(
      shouldRegisterServiceWorker({
        supported: true,
        secureContext: true,
        nodeEnv: "development",
        devEnabled: true,
      }),
    ).toBe(true);
  });

  it("registers at the root scope and configures the API origins", async () => {
    const container = makeContainer();
    const win = makeWindow(container);
    const registration = makeRegistration();
    const register = jest.fn().mockResolvedValue(registration);

    const result = await registerServiceWorker(
      {},
      {
        window: win,
        container,
        nodeEnv: "production",
        secureContext: true,
        devEnabled: false,
        register,
      },
    );

    expect(register).toHaveBeenCalledWith("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    expect(configureServiceWorker).toHaveBeenCalledWith(registration);
    expect(ensurePersistentStorage).toHaveBeenCalled();
    expect(result.registration).toBe(registration);

    result.cleanup();
    expect(registration.removeEventListener).toHaveBeenCalledWith(
      "updatefound",
      expect.any(Function),
    );
    expect(win.clearInterval).toHaveBeenCalledWith(123);
  });

  it("reports a waiting worker as an available update", async () => {
    const container = makeContainer();
    const win = makeWindow(container);
    const registration = makeRegistration();
    registration.waiting = { postMessage: jest.fn() };
    const onUpdateReady = jest.fn();

    await registerServiceWorker(
      { onUpdateReady },
      {
        window: win,
        container,
        nodeEnv: "production",
        secureContext: true,
        register: jest.fn().mockResolvedValue(registration),
      },
    );

    expect(onUpdateReady).toHaveBeenCalledWith(registration, registration.waiting);
  });

  it("reports the first install as offline-ready, not as an update", async () => {
    const container = makeContainer(null);
    const win = makeWindow(container);
    const registration = makeRegistration();
    const onOfflineReady = jest.fn();
    const onUpdateReady = jest.fn();
    const worker = {
      state: "installing",
      addEventListener: jest.fn((_event, handler) => {
        worker.__handler = handler;
      }),
    };
    registration.installing = worker;

    await registerServiceWorker(
      { onOfflineReady, onUpdateReady },
      {
        window: win,
        container,
        nodeEnv: "production",
        secureContext: true,
        register: jest.fn().mockResolvedValue(registration),
      },
    );

    const updateFound = registration.__listeners.updatefound;
    updateFound();
    worker.state = "installed";
    worker.__handler();

    expect(onOfflineReady).toHaveBeenCalledWith(registration);
    expect(onUpdateReady).not.toHaveBeenCalled();
  });

  it("does not activate an update while checkout is in progress", () => {
    const registration = makeRegistration();
    registration.waiting = { postMessage: jest.fn() };
    const release = beginCriticalOperation("checkout");

    expect(applyServiceWorkerUpdate(registration)).toBe(
      UPDATE_APPLY_RESULT.BLOCKED,
    );
    expect(registration.waiting.postMessage).not.toHaveBeenCalled();

    release();
    expect(applyServiceWorkerUpdate(registration)).toBe(
      UPDATE_APPLY_RESULT.APPLYING,
    );
    expect(registration.waiting.postMessage).toHaveBeenCalledWith({
      type: "SKIP_WAITING",
    });
  });

  it("does not activate an update while the browser is offline", () => {
    const registration = makeRegistration();
    registration.waiting = { postMessage: jest.fn() };

    expect(applyServiceWorkerUpdate(registration, { online: false })).toBe(
      UPDATE_APPLY_RESULT.OFFLINE,
    );
    expect(registration.waiting.postMessage).not.toHaveBeenCalled();
  });

  it("reloads once the waiting worker takes control after acceptance", async () => {
    const container = makeContainer();
    const win = makeWindow(container);
    const registration = makeRegistration();
    registration.waiting = { postMessage: jest.fn() };
    const controllerHandler = jest.fn();
    const unsubscribe = subscribeControllerChange(controllerHandler);

    await registerServiceWorker(
      {},
      {
        window: win,
        container,
        nodeEnv: "production",
        secureContext: true,
        register: jest.fn().mockResolvedValue(registration),
      },
    );

    expect(applyServiceWorkerUpdate(registration)).toBe(
      UPDATE_APPLY_RESULT.APPLYING,
    );
    const controllerChange = container.__handlers.controllerchange;
    expect(typeof controllerChange).toBe("function");
    controllerChange();

    expect(controllerHandler).toHaveBeenCalledTimes(1);
    expect(win.location.reload).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("returns unavailable when there is no waiting worker", () => {
    const registration = makeRegistration();
    expect(applyServiceWorkerUpdate(registration)).toBe(
      UPDATE_APPLY_RESULT.UNAVAILABLE,
    );
  });
});
