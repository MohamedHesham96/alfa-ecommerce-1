import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("../context/LanguageContext", () => {
  const en = require("../public/locales/en.json");
  return {
    useLanguage: () => ({
      locale: "en",
      t: (key) => en[key] ?? key,
    }),
  };
});

jest.mock("../utils/requestsUtils", () => ({
  getRequest: jest.fn(),
}));

import WebsiteAnalyticsPage from "../app/admin/Analytics/page";
import { getRequest } from "../utils/requestsUtils";

function summary(overrides = {}) {
  return {
    period: "TODAY",
    selectedYear: 2026,
    timezone: "Africa/Cairo",
    rangeStart: "2026-11-18T00:00+02:00",
    rangeEnd: "2026-11-18T12:30+02:00",
    hasData: true,
    activeUsers: 3,
    todayVisitors: 12,
    todayPageViews: 30,
    weekVisitors: 40,
    monthVisitors: 90,
    yearVisitors: 365,
    periodVisitors: 12,
    periodPageViews: 30,
    sessions: {
      averageDurationSeconds: 95,
      eligibleSessions: 4,
      bouncedSessions: 1,
      bounceRate: 25,
    },
    trafficSources: [
      { source: "GOOGLE", sessions: 5, visitors: 4, sessionPercentage: 100 },
    ],
    wishlist: { uniqueVisitors: 2, additions: 3 },
    topProducts: [],
    trend: [
      {
        bucketStart: "2026-11-18T12:00+02:00",
        granularity: "HOUR",
        visitors: 2,
        pageViews: 5,
      },
    ],
    newVsReturning: {
      newVisitors: 9,
      returningVisitors: 3,
      newPercentage: 75,
      returningPercentage: 25,
    },
    devices: [
      {
        device: "MOBILE",
        sessions: 5,
        visitors: 4,
        sessionPercentage: 100,
        visitorPercentage: 100,
      },
    ],
    generatedAt: "2026-11-18T10:30:00Z",
    availableYears: [2026, 2025],
    ...overrides,
  };
}

function mockRequests(payload) {
  getRequest.mockImplementation((endpoint) => {
    if (endpoint.startsWith("/api/admin/analytics/active-users")) {
      return Promise.resolve({ data: { activeUsers: 3 } });
    }
    if (typeof payload === "function") return payload();
    return Promise.resolve({ data: payload });
  });
}

describe("website analytics admin page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all required sections from real summary fields", async () => {
    mockRequests(summary());
    render(<WebsiteAnalyticsPage />);

    expect(screen.getByText("Website Analytics")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Traffic Trend" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Session Quality/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /New vs Returning/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Traffic Sources/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Devices/ })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Top Viewed Products/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Wishlist Activity/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Today's Visitors")).toBeInTheDocument();
    expect(screen.getByText("This Week's Visitors")).toBeInTheDocument();
    expect(screen.getByText("This Month's Visitors")).toBeInTheDocument();
    expect(screen.getByText("This Year's Visitors")).toBeInTheDocument();

    await waitFor(() =>
      expect(
        getRequest.mock.calls.some(([endpoint]) =>
          endpoint.includes("/api/admin/analytics/summary?period=TODAY"),
        ),
      ).toBe(true),
    );
  });

  it("offers a year period and loads a previous year from the picker", async () => {
    getRequest.mockImplementation((endpoint) => {
      if (endpoint.startsWith("/api/admin/analytics/active-users")) {
        return Promise.resolve({ data: { activeUsers: 3 } });
      }
      if (endpoint.includes("period=YEAR&year=2025")) {
        return Promise.resolve({
          data: summary({
            period: "YEAR",
            selectedYear: 2025,
            rangeStart: "2025-01-01T00:00+02:00",
            rangeEnd: "2025-12-31T23:59:59+02:00",
            yearVisitors: 777,
            periodVisitors: 777,
            periodPageViews: 1400,
            trend: [
              {
                bucketStart: "2025-01-01T00:00+02:00",
                granularity: "MONTH",
                visitors: 60,
                pageViews: 120,
              },
            ],
          }),
        });
      }
      if (endpoint.includes("period=YEAR")) {
        return Promise.resolve({
          data: summary({
            period: "YEAR",
            selectedYear: 2026,
            trend: [
              {
                bucketStart: "2026-01-01T00:00+02:00",
                granularity: "MONTH",
                visitors: 30,
                pageViews: 60,
              },
            ],
          }),
        });
      }
      return Promise.resolve({ data: summary() });
    });

    render(<WebsiteAnalyticsPage />);

    expect(await screen.findByText("This Year's Visitors")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Year" }));

    const picker = await screen.findByRole("combobox", { name: "Year" });
    fireEvent.change(picker, { target: { value: "2025" } });

    await waitFor(() =>
      expect(
        getRequest.mock.calls.some(([endpoint]) =>
          endpoint.includes("/api/admin/analytics/summary?period=YEAR&year=2025"),
        ),
      ).toBe(true),
    );
    expect(await screen.findByText("2025 Visitors")).toBeInTheDocument();
    expect(screen.getAllByText("777").length).toBeGreaterThanOrEqual(1);
  });

  it("shows the no-history explanation when no events exist", async () => {
    mockRequests(
      summary({
        hasData: false,
        activeUsers: 0,
        todayVisitors: 0,
        todayPageViews: 0,
        weekVisitors: 0,
        monthVisitors: 0,
        yearVisitors: 0,
        periodVisitors: 0,
        periodPageViews: 0,
        trafficSources: [],
        wishlist: { uniqueVisitors: 0, additions: 0 },
        trend: [],
        newVsReturning: {
          newVisitors: 0,
          returningVisitors: 0,
          newPercentage: 0,
          returningPercentage: 0,
        },
        devices: [],
      }),
    );
    render(<WebsiteAnalyticsPage />);

    expect(
      await screen.findByText("No analytics data yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Analytics starts collecting from the date/i),
    ).toBeInTheDocument();
    expect(screen.getByText("No traffic recorded in this period yet.")).toBeInTheDocument();
  });

  it("shows a recoverable error state without disturbing the storefront", async () => {
    mockRequests(() => Promise.reject(new Error("network down")));
    render(<WebsiteAnalyticsPage />);

    expect(
      await screen.findByText("Analytics could not be loaded"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});

