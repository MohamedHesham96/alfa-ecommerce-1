import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("react-toastify", () => ({
  toast: { info: jest.fn(), success: jest.fn() },
}));

jest.mock("../context/LanguageContext", () => {
  const en = require("../public/locales/en.json");
  return {
    useLanguage: () => ({
      locale: "en",
      t: (key) => en[key] ?? key,
    }),
  };
});

jest.mock("../app/admin/components/ui/AdminPageHeader", () => ({
  __esModule: true,
  default: ({ actions }) => <div>{actions}</div>,
}));

jest.mock("../app/admin/components/ui/AdminModal", () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock("../app/admin/Reports/Sales/components/SavedReportFilters", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../app/admin/Reports/Sales/components/SalesReportFilters", () => ({
  __esModule: true,
  default: ({ onApply, onReset, loading, appliedRange }) => (
    <div>
      <span data-testid="filters-loading">{String(loading)}</span>
      <span data-testid="filters-range">{appliedRange || "none"}</span>
      <button
        type="button"
        onClick={() =>
          onApply({
            datePreset: "LAST_7_DAYS",
            fromDate: null,
            toDate: null,
            orderStates: [],
            paymentMethods: [],
            fulfillmentTypes: [],
            userIds: [],
            productIds: [],
            categoryIds: [],
            minOrderValue: null,
            maxOrderValue: null,
            compare: false,
          })
        }
      >
        apply-next
      </button>
      <button type="button" onClick={onReset}>
        reset
      </button>
    </div>
  ),
}));

jest.mock("../app/admin/Reports/Sales/components/SalesReportKpis", () => ({
  __esModule: true,
  default: ({ summary }) => (
    <div data-testid="summary-start">{summary.range.startDate}</div>
  ),
}));

jest.mock("../app/admin/Reports/Sales/components/SalesReportCharts", () => ({
  __esModule: true,
  SalesOverTimeChart: () => null,
  SalesCompositionChart: () => null,
  SalesCategoryChart: () => null,
  TopProductsCard: () => null,
  DayHourHeatmap: () => null,
}));

jest.mock("../app/admin/Reports/Sales/components/SalesReportTable", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../app/admin/Reports/Sales/components/SalesReportPreview", () => ({
  __esModule: true,
  default: ({ open, summary }) =>
    open && summary ? <div data-testid="preview-open" /> : null,
}));

jest.mock("../app/admin/Reports/Sales/SalesReportFeatureGate", () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock("../app/admin/services/salesReportService", () => ({
  fetchSalesReportSummary: jest.fn(),
  fetchSavedReportFilters: jest.fn(),
  buildSalesReportPrintUrl: jest.fn(() => "/admin/Reports/Sales/Print"),
  createSavedReportFilter: jest.fn(),
  decodeFiltersFromUrl: jest.fn(() => null),
  deleteSavedReportFilter: jest.fn(),
  downloadSalesReport: jest.fn(),
  setDefaultSavedReportFilter: jest.fn(),
  updateSavedReportFilter: jest.fn(),
}));

import SalesReportPage from "../app/admin/Reports/Sales/page";
import {
  fetchSalesReportSummary,
  fetchSavedReportFilters,
} from "../app/admin/services/salesReportService";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function summary(startDate) {
  return {
    currency: "EGP",
    timezone: "Africa/Cairo",
    generatedAt: "2026-11-21T10:00:00Z",
    range: {
      preset: "CUSTOM",
      start: `${startDate}T00:00:00+02:00`,
      endExclusive: `${startDate}T23:59:59+02:00`,
      startDate,
      endDateInclusive: startDate,
    },
    metrics: {
      grossSales: 100,
      netSales: 100,
      deliveredRevenue: 100,
      shippingCharges: 0,
      totalDiscounts: 0,
      totalOrders: 1,
      averageOrderValue: 100,
      itemsSold: 1,
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
    dataQuality: {
      ordersMissingCreatedDate: 0,
      ordersMissingTotal: 0,
      ordersWithLegacyNetTotalMismatch: 0,
      returns: {
        returnsWithoutOrderLine: 0,
        returnsWithoutOrder: 0,
        returnsWithInvalidQuantity: 0,
        linesWithReturnedQuantityExceedingPurchased: 0,
        returnsWithInvalidState: 0,
        returnsWithNegativeRefund: 0,
        refundAmountMismatches: 0,
      },
      global: {
        ordersMissingCreatedDate: 0,
        returnsWithoutOrderOnly: 0,
        totalOrphanReturns: 0,
      },
    },
  };
}

function summaryWithoutDataQuality(startDate) {
  const data = summary(startDate);
  delete data.dataQuality;
  return data;
}

function summaryWithIssues(startDate) {
  const data = summary(startDate);
  data.dataQuality = {
    ordersMissingCreatedDate: 0,
    ordersMissingTotal: 0,
    ordersWithLegacyNetTotalMismatch: 0,
    financial: {
      ordersMissingShippingCost: 0,
      ordersMissingNetTotal: 0,
      ordersWithNegativeFinancialValue: 0,
      ordersWithDiscountMismatch: 1,
    },
    returns: {
      returnsWithoutOrderLine: 0,
      returnsWithoutOrder: 0,
      returnsWithInvalidQuantity: 0,
      linesWithReturnedQuantityExceedingPurchased: 0,
      returnsWithInvalidState: 0,
      returnsWithNegativeRefund: 0,
      refundAmountMismatches: 0,
    },
    global: {
      ordersMissingCreatedDate: 0,
      returnsWithoutOrderOnly: 0,
      totalOrphanReturns: 0,
    },
  };
  return data;
}

describe("SalesReportPage summary consistency", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchSavedReportFilters.mockResolvedValue([]);
  });

  test("removes old summary and disables preview/export while new filters load", async () => {
    const first = deferred();
    const second = deferred();
    fetchSalesReportSummary
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    render(<SalesReportPage />);

    await waitFor(() =>
      expect(fetchSalesReportSummary).toHaveBeenCalledTimes(1),
    );

    const previewButton = screen.getByRole("button", { name: "Preview" });
    const exportButton = screen.getByRole("button", { name: "Export Excel" });

    expect(previewButton).toBeDisabled();
    expect(exportButton).toBeDisabled();
    expect(screen.getByTestId("filters-loading")).toHaveTextContent("true");
    expect(screen.queryByTestId("summary-start")).not.toBeInTheDocument();

    await act(async () => {
      first.resolve(summary("2026-10-01"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("summary-start")).toHaveTextContent(
        "2026-10-01",
      );
    });
    expect(previewButton).toBeEnabled();
    expect(exportButton).toBeEnabled();
    expect(screen.getByTestId("filters-range")).toHaveTextContent(
      "2026-10-01 — 2026-10-01",
    );

    fireEvent.click(screen.getByText("apply-next"));

    await waitFor(() =>
      expect(fetchSalesReportSummary).toHaveBeenCalledTimes(2),
    );
    await waitFor(() =>
      expect(screen.queryByTestId("summary-start")).not.toBeInTheDocument(),
    );

    expect(previewButton).toBeDisabled();
    expect(exportButton).toBeDisabled();
    expect(screen.getByTestId("filters-loading")).toHaveTextContent("true");
    expect(screen.getByTestId("filters-range")).toHaveTextContent("none");

    await act(async () => {
      second.resolve(summary("2026-11-01"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("summary-start")).toHaveTextContent(
        "2026-11-01",
      );
    });
    expect(previewButton).toBeEnabled();
    expect(exportButton).toBeEnabled();
  });

  test("a failed summary request leaves no old financial data and disables actions", async () => {
    const first = deferred();
    const failed = deferred();
    fetchSalesReportSummary
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(failed.promise);

    render(<SalesReportPage />);

    await waitFor(() =>
      expect(fetchSalesReportSummary).toHaveBeenCalledTimes(1),
    );
    await act(async () => {
      first.resolve(summary("2026-10-01"));
    });
    await waitFor(() =>
      expect(screen.getByTestId("summary-start")).toHaveTextContent(
        "2026-10-01",
      ),
    );

    fireEvent.click(screen.getByText("apply-next"));
    await waitFor(() =>
      expect(fetchSalesReportSummary).toHaveBeenCalledTimes(2),
    );
    await act(async () => {
      failed.reject(new Error("network down"));
    });

    await waitFor(() => {
      expect(screen.getByText("The report could not be loaded")).toBeVisible();
    });
    expect(screen.queryByTestId("summary-start")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Export Excel" })).toBeDisabled();
  });

  test("reset keeps the same fresh-summary protection", async () => {
    const first = deferred();
    const resetRequest = deferred();
    fetchSalesReportSummary
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(resetRequest.promise);

    render(<SalesReportPage />);

    await waitFor(() =>
      expect(fetchSalesReportSummary).toHaveBeenCalledTimes(1),
    );
    await act(async () => {
      first.resolve(summary("2026-10-01"));
    });
    await waitFor(() =>
      expect(screen.getByTestId("summary-start")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("reset"));
    await waitFor(() =>
      expect(fetchSalesReportSummary).toHaveBeenCalledTimes(2),
    );
    expect(screen.queryByTestId("summary-start")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview" })).toBeDisabled();

    await act(async () => {
      resetRequest.resolve(summary("2026-11-01"));
    });
    await waitFor(() =>
      expect(screen.getByTestId("summary-start")).toHaveTextContent(
        "2026-11-01",
      ),
    );
  });

  test("renders expanded data-quality diagnostics with global scope labels", async () => {
    const data = summary("2026-11-01");
    data.dataQuality = {
      ordersMissingCreatedDate: 2,
      ordersMissingTotal: 0,
      ordersWithLegacyNetTotalMismatch: 0,
      financial: {
        ordersMissingShippingCost: 0,
        ordersMissingNetTotal: 0,
        ordersWithNegativeFinancialValue: 0,
        ordersWithDiscountMismatch: 1,
      },
      orderItems: {
        ordersWithoutLines: 0,
        ordersWithMerchandiseMismatch: 0,
        linesMissingUnitPrice: 0,
        linesMissingTotalPrice: 0,
        linesWithNegativePrice: 0,
        linesWithInvalidQuantity: 0,
        linesWithTotalMismatch: 0,
        linesWithNullReturnedQuantity: 0,
        linesWithNegativeReturnedQuantity: 0,
        linesWithReturnedQuantityMismatch: 1,
      },
      returns: {
        returnsWithoutOrderLine: 0,
        returnsWithoutOrder: 0,
        returnsWithInvalidQuantity: 0,
        linesWithReturnedQuantityExceedingPurchased: 0,
        returnsWithInvalidState: 0,
        returnsWithNegativeRefund: 0,
        refundAmountMismatches: 0,
      },
      global: {
        ordersMissingCreatedDate: 2,
        returnsWithoutOrderOnly: 0,
        totalOrphanReturns: 1,
      },
    };
    fetchSalesReportSummary.mockResolvedValue(data);

    render(<SalesReportPage />);

    expect(await screen.findByText(/Global integrity check: 2/)).toBeInTheDocument();
    expect(await screen.findByText(/orphan return record/)).toBeInTheDocument();
    expect(await screen.findByText(/Additional checks found/)).toBeInTheDocument();
  });

  test("legacy orphan counters are not added together", async () => {
    const data = summary("2026-11-01");
    data.dataQuality = {
      ordersMissingCreatedDate: 0,
      ordersMissingTotal: 0,
      ordersWithLegacyNetTotalMismatch: 0,
      returns: {
        returnsWithoutOrderLine: 1,
        returnsWithoutOrder: 1,
        returnsWithInvalidQuantity: 0,
        linesWithReturnedQuantityExceedingPurchased: 0,
        returnsWithInvalidState: 0,
        returnsWithNegativeRefund: 0,
        refundAmountMismatches: 0,
      },
    };
    fetchSalesReportSummary.mockResolvedValue(data);

    render(<SalesReportPage />);

    expect(
      await screen.findByText(/1 orphan return record/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/2 orphan return/)).not.toBeInTheDocument();
  });

  test("shows diagnostic-unavailable when dataQuality is omitted", async () => {
    fetchSalesReportSummary.mockResolvedValue(
      summaryWithoutDataQuality("2026-11-01"),
    );

    render(<SalesReportPage />);

    expect(
      await screen.findByText(/diagnostics were not supplied/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Additional checks found/)).not.toBeInTheDocument();
  });

  test("shows diagnostic-unavailable when dataQuality is null", async () => {
    const data = summary("2026-11-01");
    data.dataQuality = null;
    fetchSalesReportSummary.mockResolvedValue(data);

    render(<SalesReportPage />);

    expect(
      await screen.findByText(/diagnostics were not supplied/i),
    ).toBeInTheDocument();
  });

  test("does not show the unavailable notice for a genuine zero-issue response", async () => {
    fetchSalesReportSummary.mockResolvedValue(summary("2026-11-01"));

    render(<SalesReportPage />);

    expect(await screen.findByTestId("summary-start")).toBeInTheDocument();
    expect(
      screen.queryByText(/diagnostics were not supplied/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/orphan-return diagnostics are incomplete/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Additional checks found/)).not.toBeInTheDocument();
  });

  test("shows orphan-diagnostic-unavailable for a lone missing-line counter", async () => {
    const data = summary("2026-11-01");
    data.dataQuality = {
      ordersMissingCreatedDate: 0,
      ordersMissingTotal: 0,
      ordersWithLegacyNetTotalMismatch: 0,
      returns: { returnsWithoutOrderLine: 1 },
    };
    fetchSalesReportSummary.mockResolvedValue(data);

    render(<SalesReportPage />);

    expect(
      await screen.findByText(/orphan-return diagnostics are incomplete/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/orphan return record/)).not.toBeInTheDocument();
  });

  test("shows orphan-diagnostic-unavailable for conflicting legacy counters", async () => {
    const data = summary("2026-11-01");
    data.dataQuality = {
      ordersMissingCreatedDate: 0,
      ordersMissingTotal: 0,
      ordersWithLegacyNetTotalMismatch: 0,
      returns: { returnsWithoutOrderLine: 4, returnsWithoutOrder: 2 },
    };
    fetchSalesReportSummary.mockResolvedValue(data);

    render(<SalesReportPage />);

    expect(
      await screen.findByText(/orphan-return diagnostics are incomplete/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/orphan return record/)).not.toBeInTheDocument();
  });

  test("clears available diagnostics when a filter change returns an unavailable payload", async () => {
    const first = deferred();
    const second = deferred();
    fetchSalesReportSummary
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    render(<SalesReportPage />);

    await waitFor(() =>
      expect(fetchSalesReportSummary).toHaveBeenCalledTimes(1),
    );
    await act(async () => {
      first.resolve(summaryWithIssues("2026-11-01"));
    });
    expect(await screen.findByText(/Additional checks found/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("apply-next"));
    await waitFor(() =>
      expect(fetchSalesReportSummary).toHaveBeenCalledTimes(2),
    );
    await act(async () => {
      second.resolve(summaryWithoutDataQuality("2026-11-02"));
    });

    expect(
      await screen.findByText(/diagnostics were not supplied/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Additional checks found/)).not.toBeInTheDocument();
  });

  test("does not retain stale diagnostic status after a failed reload", async () => {
    const first = deferred();
    const failed = deferred();
    fetchSalesReportSummary
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(failed.promise);

    render(<SalesReportPage />);

    await waitFor(() =>
      expect(fetchSalesReportSummary).toHaveBeenCalledTimes(1),
    );
    await act(async () => {
      first.resolve(summaryWithIssues("2026-11-01"));
    });
    expect(await screen.findByText(/Additional checks found/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("apply-next"));
    await waitFor(() =>
      expect(fetchSalesReportSummary).toHaveBeenCalledTimes(2),
    );
    await act(async () => {
      failed.reject(new Error("network down"));
    });

    await waitFor(() => {
      expect(screen.getByText("The report could not be loaded")).toBeVisible();
    });
    expect(screen.queryByText(/Additional checks found/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/diagnostics were not supplied/i),
    ).not.toBeInTheDocument();
  });
});
