import {
  clearServerFailure,
  getConnectivityState,
  reportApiFailure,
  resetConnectivityForTests,
  setBrowserOnline,
  subscribeConnectivity,
} from "../utils/connectivityStore";

function setNavigatorOnline(value) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value,
  });
}

describe("connectivity store", () => {
  beforeEach(() => {
    resetConnectivityForTests();
    setNavigatorOnline(true);
  });

  afterAll(() => {
    resetConnectivityForTests();
  });

  it("tracks browser online/offline transitions", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeConnectivity(listener);

    setBrowserOnline(false);
    expect(getConnectivityState().browserOnline).toBe(false);
    setBrowserOnline(true);
    expect(getConnectivityState().browserOnline).toBe(true);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it("ignores API failures while the browser is offline", () => {
    setNavigatorOnline(false);
    reportApiFailure({ message: "Network Error" });
    expect(getConnectivityState().serverDown).toBe(false);
  });

  it("marks server-down only for network failures and 5xx responses", () => {
    reportApiFailure({ response: { status: 404 } });
    expect(getConnectivityState().serverDown).toBe(false);

    reportApiFailure({ response: { status: 503 } });
    expect(getConnectivityState().serverDown).toBe(true);

    clearServerFailure();
    expect(getConnectivityState().serverDown).toBe(false);

    reportApiFailure({ message: "Network Error" });
    expect(getConnectivityState().serverDown).toBe(true);
  });
});
