import { fireEvent, render, screen, within } from "@testing-library/react";

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

import OrderStatusTimeline from "../app/user/orderdetails/components/OrderStatusTimeline";
import { getRequest } from "../utils/requestsUtils";

function historyEntry(overrides = {}) {
  return {
    orderStateHistoryId: 1,
    orderId: 9,
    previousState: null,
    state: "PENDING",
    changedBy: "Casey Customer",
    changedByUserId: 12,
    changedDate: "2026-11-18T10:00:00",
    source: "CUSTOMER",
    notes: null,
    ...overrides,
  };
}

describe("customer order status timeline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads the customer order history endpoint", async () => {
    getRequest.mockResolvedValue({
      data: [
        historyEntry({
          orderStateHistoryId: 2,
          previousState: "PENDING",
          state: "PROCESSING",
          changedDate: "2026-11-18T12:00:00",
          source: "ADMIN_DASHBOARD",
        }),
        historyEntry(),
      ],
    });

    render(<OrderStatusTimeline orderId="9" currentState="PROCESSING" />);

    expect(
      await screen.findByText("Order Status History"),
    ).toBeInTheDocument();
    expect(getRequest).toHaveBeenCalledWith("/api/orders/9/history");
  });

  it("shows a loading state while the history request is pending", () => {
    getRequest.mockReturnValue(new Promise(() => {}));

    render(<OrderStatusTimeline orderId="9" currentState="PENDING" />);

    expect(
      screen.getByRole("status", { name: "Loading status history..." }),
    ).toBeInTheDocument();
  });

  it("shows the empty state for orders without history records", async () => {
    getRequest.mockResolvedValue({ data: [] });

    render(<OrderStatusTimeline orderId="9" />);

    expect(
      await screen.findByText("No status history available"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This order was created before status history tracking/),
    ).toBeInTheDocument();
  });

  it("shows an error state and retries the request", async () => {
    getRequest.mockRejectedValueOnce(new Error("network"));
    getRequest.mockResolvedValueOnce({ data: [historyEntry()] });

    render(<OrderStatusTimeline orderId="9" currentState="PENDING" />);

    expect(
      await screen.findByText("The status history could not be loaded."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("listitem")).toBeInTheDocument();
    expect(getRequest).toHaveBeenCalledTimes(2);
  });

  it("renders newest first and marks the current state", async () => {
    getRequest.mockResolvedValue({
      data: [
        historyEntry(),
        historyEntry({
          orderStateHistoryId: 2,
          previousState: "PENDING",
          state: "PROCESSING",
          changedDate: "2026-11-18T12:00:00",
          source: "ADMIN_DASHBOARD",
        }),
      ],
    });

    render(<OrderStatusTimeline orderId="9" currentState="PROCESSING" />);

    const items = await screen.findAllByRole("listitem");
    expect(items).toHaveLength(2);

    const newest = within(items[0]);
    expect(newest.getByText("Processing")).toBeInTheDocument();
    expect(newest.getByText("Current")).toBeInTheDocument();

    const oldest = within(items[1]);
    expect(oldest.getByText("Pending")).toBeInTheDocument();
    expect(oldest.queryByText("Current")).not.toBeInTheDocument();
  });
});
