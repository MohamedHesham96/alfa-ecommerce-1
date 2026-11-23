import { render, screen } from "@testing-library/react";

jest.mock("../context/LanguageContext", () => {
  const en = require("../public/locales/en.json");
  return {
    useLanguage: () => ({
      locale: "en",
      t: (key) => en[key] ?? key,
    }),
  };
});

jest.mock("../app/admin/Reports/Sales/components/SalesReportKpis", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../app/admin/Reports/Sales/components/SalesReportCharts", () => ({
  __esModule: true,
  SalesOverTimeChart: () => null,
  SalesCompositionChart: () => null,
  SalesCategoryChart: () => null,
  TopProductsCard: () => null,
  DayHourHeatmap: () => null,
}));

jest.mock("../app/admin/Reports/Sales/SalesReportFeatureGate", () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock("../app/admin/services/salesReportService", () => ({
  decodeFiltersFromUrl: jest.fn(() => ({
    datePreset: "CUSTOM",
    fromDate: "2026-11-01",
    toDate: "2026-11-30",
    orderStates: [],
    paymentMethods: [],
    fulfillmentTypes: [],
    userIds: [],
    productIds: [],
    categoryIds: [],
    minOrderValue: null,
    maxOrderValue: null,
    compare: false,
  })),
  fetchSalesReportSummary: jest.fn(() =>
    Promise.resolve({
      reportKey: "SALES",
      currency: "EGP",
      timezone: "Africa/Cairo",
      generatedAt: "2026-10-31T22:30:00Z",
      generatedAtDisplay: "2026-11-01 00:30:00 +02:00 [Africa/Cairo]",
      timestampMetadata: {
        configuredMode: "UTC",
        resolvedMode: "UTC",
        timezone: "Africa/Cairo",
      },
      range: {
        preset: "CUSTOM",
        start: "2026-11-01T00:00:00+02:00",
        endExclusive: "2026-12-01T00:00:00+02:00",
        startDate: "2026-11-01",
        endDateInclusive: "2026-11-30",
      },
      comparison: { enabled: false },
      availability: {},
      metrics: {
        grossSales: 0,
        netSales: 0,
        deliveredRevenue: 0,
        shippingCharges: 0,
        totalDiscounts: 0,
        totalOrders: 1,
        averageOrderValue: 0,
        itemsSold: 0,
        cancelledOrders: 0,
        cancelledMerchandiseValue: 0,
        cancelledShippingValue: 0,
        cancelledTotalValue: 0,
        returnedOrders: 0,
      },
      composition: {
        byPaymentMethod: [],
        byFulfillmentType: [],
        byOrderStatus: [],
      },
      salesOverTime: [],
      salesByCategory: [],
      topProducts: [],
      salesByDayHour: [],
    }),
  ),
  fetchSalesReportOrders: jest.fn(() =>
    Promise.resolve({
      content: [
        {
          orderId: 1,
          code: "ORD-UTC-1",
          createdDate: "2026-10-31T22:30:00",
          displayCreatedDate: "2026-11-01T00:30:00",
          customer: { firstName: "Test", lastName: "User" },
          state: "PENDING",
          paymentMethod: "CASH_ON_DELIVERY",
          fulfillmentType: "DELIVERY",
          itemsCount: 1,
          subtotal: 100,
          discount: 0,
          shipping: 0,
          total: 100,
        },
      ],
      page: { size: 100, number: 0, totalElements: 1, totalPages: 1 },
    }),
  ),
}));

import SalesReportPrintPage from "../app/admin/Reports/Sales/Print/page";
import { fetchSalesReportSummary } from "../app/admin/services/salesReportService";

describe("sales report print timestamps", () => {
  test("print shows Cairo display time for the order and generation instant", async () => {
    render(<SalesReportPrintPage />);

    expect(
      await screen.findByText("2026-11-01 00:30:00 +02:00 [Africa/Cairo]"),
    ).toBeInTheDocument();
    expect(screen.getByText("2026-11-01 00:30:00 +02:00 [Africa/Cairo]")).toBeVisible();
    expect(screen.getAllByText(/00:30/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Timestamp mode:/)).toBeInTheDocument();
    expect(fetchSalesReportSummary).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { includeDataQuality: false },
    );
  });

  test("print handles a summary without timestamp metadata", async () => {
    const data = await fetchSalesReportSummary();
    delete data.generatedAtDisplay;
    delete data.timestampMetadata;
    fetchSalesReportSummary.mockResolvedValueOnce(data);

    render(<SalesReportPrintPage />);

    expect(await screen.findByText(/Nov 1, 2026/)).toBeInTheDocument();
    expect(screen.queryByText(/Timestamp mode:/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Africa\/Cairo/).length).toBeGreaterThan(0);
  });
});
