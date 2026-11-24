import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("../utils/requestsUtils", () => ({
  getRequest: jest.fn(),
}));

import Dashboard_Details from "../app/admin/Dashboard/components/Details";
import DashboardInsights from "../app/admin/Dashboard/components/DashboardInsights";
import { DashboardSummaryProvider } from "../app/admin/Dashboard/context/DashboardSummaryContext";
import { IdProvider } from "../context/idContext";
import { NamePageInAdminProvider } from "../context/namePageInAdmin";
import { getRequest } from "../utils/requestsUtils";

function wrap(children) {
  return (
    <IdProvider>
      <NamePageInAdminProvider>
        <DashboardSummaryProvider>{children}</DashboardSummaryProvider>
      </NamePageInAdminProvider>
    </IdProvider>
  );
}

describe("dashboard insights", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequest.mockResolvedValue({
      data: {
        ordersCount: 12,
        ordersStats: [
          { state: "PENDING", count: 2, percentage: 16.7 },
          { state: "PROCESSING", count: 1, percentage: 8.3 },
          { state: "SHIPPED", count: 1, percentage: 8.3 },
          { state: "DELIVERED", count: 3, percentage: 25.0 },
          { state: "CANCELLED", count: 5, percentage: 41.7 },
        ],
        pendingReturns: 4,
        totalOrderValue: 20900,
        itemStats: {
          active: 60,
          inactive: 3,
          available: 54,
          unavailable: 9,
          favorite: 11,
        },
        userStats: {
          totalUsers: 24,
          activeUsers: 5,
          inactiveUsers: 19,
          blockedUsers: 0,
          usersWithOrders: 7,
          ordersPercentage: 29.2,
        },
      },
    });
  });

  it("renders the extra KPI cards with order value and average order value", async () => {
    render(wrap(<Dashboard_Details />));

    expect(
      await screen.findByText("dashboard_orders_value"),
    ).toBeInTheDocument();
    expect(await screen.findByText(/20,900/)).toBeInTheDocument();
    expect(
      screen.getByText("dashboard_average_order_value"),
    ).toBeInTheDocument();
    expect(await screen.findByText(/2,985.71/)).toBeInTheDocument();
    expect(screen.getByText("users_stats_with_orders")).toBeInTheDocument();
    expect(screen.getByText("dashboard_delivery_rate")).toBeInTheDocument();
  });

  it("renders actionable counts and store rates", async () => {
    render(wrap(<DashboardInsights />));

    expect(
      await screen.findByText("dashboard_attention_title"),
    ).toBeInTheDocument();
    expect(screen.getByText("dashboard_orders_overview")).toBeInTheDocument();
    expect(
      screen.getByText("dashboard_pending_returns"),
    ).toBeInTheDocument();
    expect(await screen.findByText(/29.2%/)).toBeInTheDocument();
    expect(screen.getByText(/85.7%/)).toBeInTheDocument();
    expect(screen.getByText(/42.9%/)).toBeInTheDocument();
  });
});
