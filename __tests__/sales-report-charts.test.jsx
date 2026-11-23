import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("../context/LanguageContext", () => {
  const en = require("../public/locales/en.json");
  return {
    useLanguage: () => ({
      locale: "en",
      t: (key) => en[key] ?? key,
    }),
  };
});

import {
  SalesCompositionChart,
  SalesOverTimeChart,
} from "../app/admin/Reports/Sales/components/SalesReportCharts";

const emptySummary = {
  currency: "EGP",
  salesOverTime: [
    {
      bucketStart: "2026-11-01",
      granularity: "DAY",
      orders: 0,
      grossSales: 0,
      netSales: 0,
      deliveredRevenue: 0,
      itemsSold: 0,
    },
  ],
  composition: {
    byPaymentMethod: [],
    byFulfillmentType: [],
    byOrderStatus: [],
  },
};

describe("sales report financial chart empty states", () => {
  test("sales-over-time explains that cancelled orders are excluded", () => {
    render(<SalesOverTimeChart summary={emptySummary} />);
    expect(
      screen.getByText(/No non-cancelled sales match the applied filters/),
    ).toBeVisible();
  });

  test("composition explains its population in every grouping", () => {
    const summary = {
      ...emptySummary,
      composition: {
        byPaymentMethod: [
          { key: "INSTAPAY", orders: 1, merchandiseValue: 100, sharePercent: 100 },
        ],
        byFulfillmentType: [
          { key: "DELIVERY", orders: 1, merchandiseValue: 100, sharePercent: 100 },
        ],
        byOrderStatus: [
          { key: "DELIVERED", orders: 1, merchandiseValue: 100, sharePercent: 100 },
        ],
      },
    };

    render(<SalesCompositionChart summary={summary} />);

    expect(
      screen.getByText(/Financial sales composition\. Cancelled orders are excluded/),
    ).toBeVisible();
    expect(
      screen.getByText(/not verified collected money/),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Order status" }));

    expect(
      screen.getByText(/Financial sales composition\. Cancelled orders are excluded/),
    ).toBeVisible();
    expect(screen.getByText("Delivered")).toBeVisible();
  });

  test("an empty composition shows the accurate financial empty state", () => {
    render(<SalesCompositionChart summary={emptySummary} />);
    expect(
      screen.getByText(/No non-cancelled sales match the applied filters/),
    ).toBeVisible();
  });
});
