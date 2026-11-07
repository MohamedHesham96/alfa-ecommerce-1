import { act, render, screen, waitFor } from "@testing-library/react";

import {
  getAppConfigValue,
  initializeAppConfig,
  refreshAppConfig,
  resetAppConfigForTests,
} from "../lib/appConfigStore";
import {
  AppConfigProvider,
  useAppConfig,
  useFeature,
} from "../context/AppConfigContext";

function ConfigProbe() {
  const showSku = useAppConfig("catalog.showSku", true);
  const wishlist = useFeature("features.wishlist.enabled");
  return (
    <div>
      <span data-testid="sku">{String(showSku)}</span>
      <span data-testid="wishlist">{String(wishlist)}</span>
    </div>
  );
}

function KeyProbe({ configKey, renderCount }) {
  renderCount.count += 1;
  const value = useAppConfig(configKey, "fallback");
  return <span data-testid={`probe-${configKey}`}>{String(value)}</span>;
}

describe("frontend configuration store", () => {
  beforeEach(() => {
    resetAppConfigForTests();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("uses developer defaults when no value is stored", () => {
    expect(getAppConfigValue("catalog.showSku")).toBe(true);
    expect(getAppConfigValue("unknown.key", "fallback")).toBe("fallback");
  });

  it("applies server-provided values over defaults", () => {
    initializeAppConfig({ "catalog.showSku": false }, 42);
    expect(getAppConfigValue("catalog.showSku")).toBe(false);
    expect(getAppConfigValue("catalog.productsPerPage")).toBe(12);
  });

  it("deduplicates concurrent refresh requests", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          values: { "catalog.showSku": false },
          version: 7,
        },
      }),
    });

    await Promise.all([refreshAppConfig(), refreshAppConfig()]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(getAppConfigValue("catalog.showSku")).toBe(false);
  });

  it("keeps safe defaults when the configuration request fails", async () => {
    global.fetch.mockRejectedValue(new Error("offline"));

    await expect(refreshAppConfig()).rejects.toThrow("offline");
    expect(getAppConfigValue("features.wishlist.enabled")).toBe(true);
  });

  it("renders initial configuration and feature flags", () => {
    render(
      <AppConfigProvider
        initialConfig={{
          "catalog.showSku": false,
          "features.wishlist.enabled": false,
        }}
        initialVersion={3}
      >
        <ConfigProbe />
      </AppConfigProvider>,
    );

    expect(screen.getByTestId("sku")).toHaveTextContent("false");
    expect(screen.getByTestId("wishlist")).toHaveTextContent("false");
  });

  it("does not rerender a key subscriber when another key changes", async () => {
    initializeAppConfig({ "catalog.showSku": true, "catalog.gridColumns": 4 });
    const renderCount = { count: 0 };
    render(
      <AppConfigProvider initialConfig={{ "catalog.showSku": true }}>
        <KeyProbe configKey="catalog.showSku" renderCount={renderCount} />
      </AppConfigProvider>,
    );

    const initialRenders = renderCount.count;

    await act(async () => {
      initializeAppConfig({ "catalog.showSku": true, "catalog.gridColumns": 3 });
    });

    await waitFor(() => {
      expect(getAppConfigValue("catalog.gridColumns")).toBe(3);
    });
    expect(renderCount.count).toBe(initialRenders);
  });
});
