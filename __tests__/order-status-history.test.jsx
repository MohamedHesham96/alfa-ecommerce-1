import { useEffect } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

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

import OrderStatusHistory from "../app/admin/orders/OrdersDetails/components/Order_Status_History";
import {
  OrderDetailsProvider,
  useOrderDetailsContext,
} from "../context/orderDetailsContext";
import { getRequest } from "../utils/requestsUtils";

function wrap(children) {
  return <OrderDetailsProvider>{children}</OrderDetailsProvider>;
}

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

describe("admin order status history timeline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a loading state while the history request is pending", () => {
    getRequest.mockReturnValue(new Promise(() => {}));

    render(wrap(<OrderStatusHistory orderId="9" />));

    expect(
      screen.getByRole("status", { name: "Loading status history..." }),
    ).toBeInTheDocument();
  });

  it("shows the empty state for orders without history records", async () => {
    getRequest.mockResolvedValue({ data: [] });

    render(wrap(<OrderStatusHistory orderId="9" />));

    expect(
      await screen.findByText("No status history available"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This order was created before status history tracking/),
    ).toBeInTheDocument();
    expect(getRequest).toHaveBeenCalledWith("/api/admin/orders/9/history");
  });

  it("shows an error state and retries the request", async () => {
    getRequest.mockRejectedValueOnce(new Error("network"));
    getRequest.mockResolvedValueOnce({ data: [historyEntry()] });

    render(wrap(<OrderStatusHistory orderId="9" />));

    expect(
      await screen.findByText("The status history could not be loaded."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByText("Previous status:"),
    ).toBeInTheDocument();
    expect(getRequest).toHaveBeenCalledTimes(2);
  });

  it("renders newest first with previous/new states, actor, source, notes and current marker", async () => {
    getRequest.mockResolvedValue({
      data: [
        historyEntry({
          orderStateHistoryId: 1,
          state: "PENDING",
          changedDate: "2026-11-18T10:00:00",
        }),
        historyEntry({
          orderStateHistoryId: 2,
          previousState: "PENDING",
          state: "PROCESSING",
          changedBy: "Alice Admin",
          changedByUserId: 3,
          changedDate: "2026-11-18T12:00:00",
          source: "ADMIN_DASHBOARD",
          notes: "Approved for packing",
        }),
      ],
    });

    function Harness() {
      const { setSelectedOrderState } = useOrderDetailsContext();
      useEffect(() => {
        setSelectedOrderState("PROCESSING");
      }, [setSelectedOrderState]);
      return <OrderStatusHistory orderId="9" />;
    }

    render(wrap(<Harness />));

    const items = await screen.findAllByRole("listitem");
    expect(items).toHaveLength(2);

    const newest = within(items[0]);
    expect(newest.getByText("Approved for packing")).toBeInTheDocument();
    expect(newest.getByText("Alice Admin")).toBeInTheDocument();
    expect(newest.getByText("Admin Dashboard")).toBeInTheDocument();
    expect(newest.getAllByText("Processing").length).toBeGreaterThanOrEqual(1);
    expect(newest.getByText("Current")).toBeInTheDocument();

    const oldest = within(items[1]);
    expect(oldest.getByText("Initial status")).toBeInTheDocument();
    expect(oldest.getByText("Casey Customer")).toBeInTheDocument();
    expect(oldest.getByText("Customer")).toBeInTheDocument();
    expect(oldest.queryByText("Current")).not.toBeInTheDocument();
  });

  it("shows System for system-generated changes", async () => {
    getRequest.mockResolvedValue({
      data: [
        historyEntry({
          previousState: "PROCESSING",
          state: "SHIPPED",
          changedBy: "system",
          changedByUserId: null,
          source: "SYSTEM",
          changedDate: "2026-11-18T13:00:00",
        }),
      ],
    });

    render(wrap(<OrderStatusHistory orderId="9" />));

    const item = within(await screen.findByRole("listitem"));
    expect(item.getAllByText("System").length).toBeGreaterThanOrEqual(2);
  });

  it("refetches history after a successful status update", async () => {
    getRequest
      .mockResolvedValueOnce({ data: [historyEntry()] })
      .mockResolvedValueOnce({
        data: [
          historyEntry({
            orderStateHistoryId: 2,
            previousState: "PENDING",
            state: "PROCESSING",
            changedBy: "Alice Admin",
            changedDate: "2026-11-18T12:00:00",
            source: "ADMIN_DASHBOARD",
          }),
          historyEntry(),
        ],
      });

    function Harness() {
      const { refreshOrderHistory } = useOrderDetailsContext();
      return (
        <>
          <button type="button" onClick={refreshOrderHistory}>
            after-update
          </button>
          <OrderStatusHistory orderId="9" />
        </>
      );
    }

    render(wrap(<Harness />));

    await screen.findByText("Initial status");
    fireEvent.click(screen.getByRole("button", { name: "after-update" }));

    await waitFor(() => expect(getRequest).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Alice Admin")).toBeInTheDocument();
  });
});
