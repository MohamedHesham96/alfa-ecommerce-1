import { render, screen } from "@testing-library/react";

import { createDefaultSalesReportFilter } from "../app/admin/types/salesReport.types";

jest.mock("../context/LanguageContext", () => {
  const en = require("../public/locales/en.json");
  return {
    useLanguage: () => ({
      locale: "en",
      t: (key) => en[key] ?? key,
    }),
  };
});

jest.mock("../app/admin/services/salesReportService", () => ({
  fetchSalesReportOrders: jest.fn(),
}));

import SalesReportTable from "../app/admin/Reports/Sales/components/SalesReportTable";
import { fetchSalesReportOrders } from "../app/admin/services/salesReportService";

function order(overrides = {}) {
  return {
    orderId: 1,
    code: "ORD-1",
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
    ...overrides,
  };
}

function mockPage(row) {
  fetchSalesReportOrders.mockResolvedValue({
    content: [row],
    page: { size: 25, number: 0, totalElements: 1, totalPages: 1 },
  });
}

describe("SalesReportTable display timestamp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the report display timestamp and timezone header", async () => {
    mockPage(order());

    render(
      <SalesReportTable
        filters={createDefaultSalesReportFilter()}
        searchTerm=""
        onSearch={jest.fn()}
        onOpenOrder={jest.fn()}
        currency="EGP"
        timezone="Africa/Cairo"
      />,
    );

    expect((await screen.findAllByText("ORD-1")).length).toBeGreaterThanOrEqual(1);
    expect(
      (await screen.findAllByText("Order Date (Africa/Cairo)")).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/00:30/).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/22:30/)).not.toBeInTheDocument();
  });

  test("falls back to the raw timestamp when display data is absent", async () => {
    mockPage(order({ displayCreatedDate: null, createdDate: "2026-11-20T14:05:00" }));

    render(
      <SalesReportTable
        filters={createDefaultSalesReportFilter()}
        searchTerm=""
        onSearch={jest.fn()}
        onOpenOrder={jest.fn()}
        currency="EGP"
        timezone="Africa/Cairo"
      />,
    );

    expect((await screen.findAllByText("ORD-1")).length).toBeGreaterThanOrEqual(1);
    expect((await screen.findAllByText(/14:05/)).length).toBeGreaterThanOrEqual(1);
  });
});
